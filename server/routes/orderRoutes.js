const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  getUserOrders,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { getBuilderOptions } = require('../controllers/pizzaBuilderController');
const { protect, admin } = require('../middleware/auth');

router.get('/builder-options', getBuilderOptions);
router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/my-orders', protect, getUserOrders);

// Admin routes
router.get('/admin/all', protect, admin, getAllOrders);
router.put('/admin/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
