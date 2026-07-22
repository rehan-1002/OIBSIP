const Inventory = require('../models/Inventory');

// @desc    Get 4-step options for custom pizza builder
// @route   GET /api/orders/builder-options
// @access  Public
exports.getBuilderOptions = async (req, res) => {
  try {
    const totalCount = await Inventory.countDocuments();
    const bases = await Inventory.find({ category: 'base' }).sort({ price: 1 });
    const sauces = await Inventory.find({ category: 'sauce' }).sort({ price: 1 });
    const cheeses = await Inventory.find({ category: 'cheese' }).sort({ price: 1 });
    const veggies = await Inventory.find({ category: 'veggie' }).sort({ name: 1 });
    const toppings = await Inventory.find({ category: 'topping' }).sort({ name: 1 });

    console.log(`[PizzaBuilder Debug] Total items in DB: ${totalCount}, bases found: ${bases.length}`);

    res.status(200).json({
      success: true,
      options: {
        step1_bases: bases,
        step2_sauces: sauces,
        step3_cheeses: cheeses,
        step4_veggies: veggies,
        extra_toppings: toppings
      }
    });
  } catch (error) {
    console.error('[PizzaBuilder Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
