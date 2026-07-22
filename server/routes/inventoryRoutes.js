const express = require('express');
const router = express.Router();
const {
  getInventory,
  getBuilderOptions,
  updateStock,
  seedInventory
} = require('../controllers/inventoryController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getInventory);
router.get('/builder-options', getBuilderOptions);
router.put('/:id', protect, admin, updateStock);
router.post('/seed', protect, admin, seedInventory);

module.exports = router;
