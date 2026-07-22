const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const { sendEmail } = require('../utils/sendEmail');
const { checkAndAlertLowStock } = require('../utils/cronJobs');

// Lazy initialization of Razorpay instance
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TGX8TUvGaiLtrY',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'Y7ugnJL4O442Y48EokN8u7Nu'
  });
};

// Helper: Auto-decrement inventory stock after successful payment
const decrementInventoryForOrder = async (items) => {
  let lowStockTriggered = false;

  for (const item of items) {
    const qty = item.quantity || 1;
    const namesToDecrement = [];

    if (item.base) namesToDecrement.push(item.base);
    if (item.sauce) namesToDecrement.push(item.sauce);
    if (item.cheese) namesToDecrement.push(item.cheese);
    if (item.veggies && Array.isArray(item.veggies)) namesToDecrement.push(...item.veggies);
    if (item.toppings && Array.isArray(item.toppings)) namesToDecrement.push(...item.toppings);

    // If preset pizza without explicit custom components, attempt to match name or toppings
    if (!item.isCustom && namesToDecrement.length === 0) {
      // Default base & sauce for preset pizzas
      namesToDecrement.push('Neapolitan Artisan Crust', 'San Marzano DOP Tomato Sauce', 'Fresh Mozzarella di Bufala');
    }

    for (const name of namesToDecrement) {
      const invItem = await Inventory.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (invItem) {
        invItem.stockQuantity = Math.max(0, invItem.stockQuantity - qty);
        await invItem.save();
        console.log(`[Inventory Decrement] ${invItem.name} stock reduced by ${qty}. Current: ${invItem.stockQuantity}`);

        if (invItem.stockQuantity < invItem.minThreshold) {
          lowStockTriggered = true;
        }
      }
    }
  }

  if (lowStockTriggered) {
    console.log('[Inventory] Low stock detected after order completion! Triggering alert email...');
    checkAndAlertLowStock();
  }
};

// @desc    Initialize Razorpay order & save pending order in DB
// @route   POST /api/orders/create-razorpay-order
// @access  Private
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress } = req.body;

    if (!items || !items.length || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Invalid order data provided' });
    }

    const razorpay = getRazorpayInstance();

    // Razorpay amount in paise (1 INR = 100 paise) or cents (1 USD = 100 cents)
    const amountInSubunits = Math.round(totalAmount * 100);

    const razorpayOrderOptions = {
      amount: amountInSubunits,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    const rzpOrder = await razorpay.orders.create(razorpayOrderOptions);

    // Save pending order to MongoDB
    const order = await Order.create({
      user: req.user._id,
      items,
      totalAmount,
      deliveryAddress: deliveryAddress || 'Main St, Artisan District',
      paymentStatus: 'pending',
      razorpayOrderId: rzpOrder.id,
      orderStatus: 'Order Received'
    });

    res.status(201).json({
      success: true,
      orderId: order._id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay payment signature & update inventory stock
// @route   POST /api/orders/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Missing payment signature verification data' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'Y7ugnJL4O442Y48EokN8u7Nu';
    const body = razorpayOrderId + '|' + razorpayPaymentId;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpaySignature;

    if (!isAuthentic) {
      // Mark order as failed
      await Order.findOneAndUpdate({ razorpayOrderId }, { paymentStatus: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid HMAC signature' });
    }

    // Payment is verified successfully
    const order = await Order.findOne({ razorpayOrderId }).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'completed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    // Auto-decrement inventory stock counts for ingredients used
    await decrementInventoryForOrder(order.items);

    // Send order confirmation email
    if (order.user && order.user.email) {
      try {
        await sendEmail({
          email: order.user.email,
          subject: `🍕 Order Confirmed #${order._id.toString().slice(-6).toUpperCase()} — FUOCO Pizza`,
          html: `
            <div style="font-family: Arial, sans-serif; background: #0D0D0D; color: #FFF; padding: 30px;">
              <h1 style="color: #FF5E14;">FUOCO ARTISAN PIZZA</h1>
              <h2>Order Confirmed & Paid!</h2>
              <p>Hi ${order.user.name}, your order of $${order.totalAmount.toFixed(2)} has been received and is being prepared in our wood-fired kitchen!</p>
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Status:</strong> ${order.orderStatus}</p>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('Failed sending order confirmation email:', mailErr);
      }
    }

    // Emit Socket.io event if socket server is attached
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', order);
      io.emit('newOrderAlert', order);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully & inventory updated',
      order
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get orders for logged in user
// @route   GET /api/orders/my-orders
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const validStatuses = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    await order.save();

    // Broadcast live socket status update to clients
    const io = req.app.get('io');
    if (io) {
      io.emit('orderStatusChanged', { orderId: order._id, orderStatus });
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
