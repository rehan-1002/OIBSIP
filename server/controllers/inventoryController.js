const Inventory = require('../models/Inventory');

const INITIAL_INVENTORY = [
  // 5 Pizza Bases
  { category: 'base', name: 'Neapolitan Artisan Crust', stockQuantity: 50, minThreshold: 20, price: 14.99, description: 'Traditional Neapolitan airy crust fermented 72 hours' },
  { category: 'base', name: 'Thin Crisp New York Style', stockQuantity: 45, minThreshold: 20, price: 13.99, description: 'Crispy outer shell with a tender foldable center' },
  { category: 'base', name: 'Stuffed Cheese Crust', stockQuantity: 30, minThreshold: 20, price: 16.99, description: 'Ring of molten mozzarella sealed inside the crust edge' },
  { category: 'base', name: 'Gluten-Free Cauliflower Base', stockQuantity: 25, minThreshold: 20, price: 15.99, description: 'Naturally gluten-free roasted cauliflower dough' },
  { category: 'base', name: 'Sicilian Deep Dish Pan', stockQuantity: 35, minThreshold: 20, price: 17.49, description: 'Golden thick pan crust with crunchy caramelized edges' },

  // 5 Sauces
  { category: 'sauce', name: 'San Marzano DOP Tomato Sauce', stockQuantity: 60, minThreshold: 20, price: 0.00, description: 'Volcanic soil tomatoes crushed with sea salt & basil' },
  { category: 'sauce', name: 'Spicy Fiery Marinara', stockQuantity: 40, minThreshold: 20, price: 1.00, description: 'Infused with Calabrian chili flakes and roasted garlic' },
  { category: 'sauce', name: 'Creamy Garlic Alfredo', stockQuantity: 35, minThreshold: 20, price: 1.50, description: 'Heavy cream, butter, and aged Parmigiano Reggiano' },
  { category: 'sauce', name: 'Genovese Basil Pesto', stockQuantity: 30, minThreshold: 20, price: 1.75, description: 'Fresh basil leaves, pine nuts, olive oil, and parmesan' },
  { category: 'sauce', name: 'Smoked Hickory BBQ Sauce', stockQuantity: 40, minThreshold: 20, price: 1.00, description: 'Rich tangy sauce with natural mesquite wood smoke' },

  // Cheeses
  { category: 'cheese', name: 'Fresh Mozzarella di Bufala', stockQuantity: 50, minThreshold: 20, price: 2.00, description: 'Hand-stretched water buffalo mozzarella' },
  { category: 'cheese', name: 'Smoked Gouda & Fontina', stockQuantity: 35, minThreshold: 20, price: 2.25, description: 'Nutty, buttery blend that melts smoothly' },
  { category: 'cheese', name: 'Gorgonzola Dolce DOP', stockQuantity: 25, minThreshold: 20, price: 2.50, description: 'Creamy Italian blue cheese with mild tangy notes' },
  { category: 'cheese', name: 'Plant-Based Vegan Mozzarella', stockQuantity: 30, minThreshold: 20, price: 2.00, description: 'Dairy-free coconut oil & cashew melt' },

  // Vegetables
  { category: 'veggie', name: 'Bell Peppers', stockQuantity: 50, minThreshold: 20, price: 1.25, description: 'Crisp sweet red & yellow bell pepper slices' },
  { category: 'veggie', name: 'Caramelized Red Onions', stockQuantity: 45, minThreshold: 20, price: 1.00, description: 'Slow-cooked in balsamic reduction' },
  { category: 'veggie', name: 'Wild Mushrooms Mix', stockQuantity: 30, minThreshold: 20, price: 1.75, description: 'Sautéed cremini, shiitake, and oyster mushrooms' },
  { category: 'veggie', name: 'Calabrian Jalapeños', stockQuantity: 40, minThreshold: 20, price: 1.00, description: 'Spicy pickled peppers' },
  { category: 'veggie', name: 'Castelvetrano Black Olives', stockQuantity: 50, minThreshold: 20, price: 1.25, description: 'Pitted savory Mediterranean olives' },
  { category: 'veggie', name: 'Cherry Tomatoes', stockQuantity: 40, minThreshold: 20, price: 1.50, description: 'Sweet roasted vine tomatoes' },
  { category: 'veggie', name: 'Baby Spinach', stockQuantity: 35, minThreshold: 20, price: 1.25, description: 'Fresh tender organic spinach leaves' },
  { category: 'veggie', name: 'Artichoke Hearts', stockQuantity: 25, minThreshold: 20, price: 1.75, description: 'Marinated Italian artichoke hearts' },

  // Extra Toppings
  { category: 'topping', name: 'Spicy Pepperoni', stockQuantity: 60, minThreshold: 20, price: 2.00 },
  { category: 'topping', name: 'Prosciutto di Parma', stockQuantity: 25, minThreshold: 20, price: 2.50 },
  { category: 'topping', name: 'Truffle Oil Drizzle', stockQuantity: 18, minThreshold: 20, price: 3.00 }
];

// @desc    Get all inventory stock items
// @route   GET /api/inventory
// @access  Public
exports.getInventory = async (req, res) => {
  try {
    let count = await Inventory.countDocuments();
    if (count === 0) {
      await Inventory.insertMany(INITIAL_INVENTORY);
    }

    const { category } = req.query;
    const filter = category ? { category } : {};
    const inventory = await Inventory.find(filter).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: inventory.length,
      inventory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get structured 4-step builder options
// @route   GET /api/inventory/builder-options
// @access  Public
exports.getBuilderOptions = async (req, res) => {
  try {
    let count = await Inventory.countDocuments();
    if (count === 0) {
      await Inventory.insertMany(INITIAL_INVENTORY);
    }

    const bases = await Inventory.find({ category: 'base' }).sort({ price: 1 });
    const sauces = await Inventory.find({ category: 'sauce' }).sort({ price: 1 });
    const cheeses = await Inventory.find({ category: 'cheese' }).sort({ price: 1 });
    const veggies = await Inventory.find({ category: 'veggie' }).sort({ name: 1 });
    const toppings = await Inventory.find({ category: 'topping' }).sort({ name: 1 });

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update stock quantity & threshold (Admin)
// @route   PUT /api/inventory/:id
// @access  Private/Admin
exports.updateStock = async (req, res) => {
  try {
    const { stockQuantity, minThreshold, name, price } = req.body;
    let item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    if (stockQuantity !== undefined) item.stockQuantity = stockQuantity;
    if (minThreshold !== undefined) item.minThreshold = minThreshold;
    if (name !== undefined) item.name = name;
    if (price !== undefined) item.price = price;

    await item.save();

    res.status(200).json({
      success: true,
      message: `Inventory item ${item.name} updated successfully`,
      item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seed or reset inventory items (Admin)
// @route   POST /api/inventory/seed
// @access  Private/Admin
exports.seedInventory = async (req, res) => {
  try {
    await Inventory.deleteMany({});
    const items = await Inventory.insertMany(INITIAL_INVENTORY);
    res.status(201).json({
      success: true,
      message: 'Inventory successfully reset and seeded!',
      count: items.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
