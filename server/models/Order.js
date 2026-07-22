const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  pizzaName: { type: String, required: true },
  isCustom: { type: Boolean, default: false },
  size: { type: String, default: 'Medium' },
  base: { type: String, default: '' },
  sauce: { type: String, default: '' },
  cheese: { type: String, default: '' },
  veggies: [{ type: String }],
  toppings: [{ type: String }],
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 }
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    razorpayOrderId: {
      type: String
    },
    razorpayPaymentId: {
      type: String
    },
    razorpaySignature: {
      type: String
    },
    orderStatus: {
      type: String,
      enum: ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'],
      default: 'Order Received'
    },
    deliveryAddress: {
      type: String,
      default: 'Main St, Artisan District'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
