const path = require('path');
const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { initCronJobs } = require('./utils/cronJobs');
const Inventory = require('./models/Inventory');

// Connect to MongoDB Database and start HTTP server
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  try {
    const basesCount = await Inventory.countDocuments({ category: 'base' });
    if (basesCount === 0) {
      await Inventory.deleteMany({});
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
      await Inventory.insertMany(INITIAL_INVENTORY);
      console.log('✅ Inventory seeded successfully on startup.');
    }
  } catch (err) {
    console.error('Inventory seeding check error:', err);
  }

  // Initialize node-cron background jobs
  initCronJobs();

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🔥 FUOCO Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🌐 Frontend accessible at http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
});

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Store io instance on app for controller access
app.set('io', io);

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Body parser & CORS middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Serve client static files
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Fallback to client/index.html for any unhandled routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientPath, 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API Endpoint not found' });
  }
});
