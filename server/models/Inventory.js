const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Please specify item category'],
      enum: ['base', 'sauce', 'cheese', 'veggie', 'topping']
    },
    name: {
      type: String,
      required: [true, 'Please specify ingredient name'],
      unique: true,
      trim: true
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Please specify stock quantity'],
      default: 100,
      min: [0, 'Stock cannot be negative']
    },
    minThreshold: {
      type: Number,
      default: 20
    },
    price: {
      type: Number,
      default: 0.0
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Inventory', inventorySchema);
