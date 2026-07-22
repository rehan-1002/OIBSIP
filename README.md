<div align="center">

# 🍕 FUOCO — Artisan Pizza & Live Inventory System

<p align="center">
  <strong>A Full-Stack MERN (Node.js, Express, MongoDB, JavaScript) Wood-Fired Neapolitan Pizza Ordering Engine featuring an Interactive 4-Step Custom Builder, Razorpay Payment Gateway, Live WebSockets, Admin Dashboard, and Automated Low-Stock Cron Alerts.</strong>
</p>

<h3>🌐 <a href="https://fuoco-pizza.onrender.com">Live Demo: fuoco-pizza.onrender.com</a></h3>

[![Live Demo](https://img.shields.io/badge/Live_Demo-fuoco--pizza.onrender.com-FF5E14?style=for-the-badge&logo=render)](https://fuoco-pizza.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-4.x-black?style=for-the-badge&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_SDK-blue?style=for-the-badge&logo=razorpay)](https://razorpay.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-white?style=for-the-badge&logo=socket.io)](https://socket.io)
[![GSAP](https://img.shields.io/badge/GSAP-Animations-greenyellow?style=for-the-badge&logo=greensock)](https://greensock.com/gsap/)

---

</div>

## 🌟 Highlights & Key Features

### 🍕 1. Interactive 4-Step Custom Pizza Builder
Craft your dream Neapolitan pizza step-by-step with real-time stock validation and dynamic price calculation:
- **Step 1: Crust Base Selection** (5 options: Neapolitan Artisan, Thin Crisp NY, Stuffed Cheese, Gluten-Free Cauliflower, Sicilian Deep Dish)
- **Step 2: Signature Sauce Base** (5 options: San Marzano DOP, Spicy Fiery Marinara, Creamy Alfredo, Genovese Pesto, Smoked BBQ)
- **Step 3: Gourmet Cheese** (Fresh Mozzarella di Bufala, Smoked Gouda & Fontina, Gorgonzola Dolce, Vegan Mozzarella)
- **Step 4: Fresh Farm Vegetables** (Multi-select: Bell Peppers, Red Onions, Mushrooms, Jalapeños, Black Olives, Cherry Tomatoes, Spinach, Artichoke Hearts)

### 🔐 2. Authentication & Verification System
- **JWT Authorization**: Secure JSON Web Tokens with password hashing via `bcryptjs`.
- **Email Verification**: Sends an automated HTML verification link on user registration via **Nodemailer**.
- **Password Reset Flow**: Crypto-generated token reset link delivered straight to inbox.
- **Role-Based Guards**: Protected routes (`protect`) and Admin-only middleware (`admin`).

### 💳 3. Razorpay Test Mode Payment Integration
- **Order Initialization**: Endpoint `/api/orders/create-razorpay-order` generates receipt and Razorpay subunit orders.
- **HMAC Signature Verification**: Secure server-side validation using `crypto.createHmac('sha256', secret)` to prevent tampering.
- **Automated Stock Decrement**: Instantly reduces inventory levels for every ingredient used when payment succeeds.

### 🛡️ 4. Admin Management Dashboard
- **Live Inventory Manager**: Real-time stock counts with automated red warnings for low-stock items (`< 20` units), inline quantity editor, and 1-click database re-seeding.
- **Order Status Stepper**: Admin controls to update incoming order progress:
  `Order Received` ➔ `In Kitchen` ➔ `Sent to Delivery` ➔ `Delivered`

### ⏰ 5. Automated Low-Stock Cron Job Alerts (`node-cron`)
- **Automated Monitoring**: Background `node-cron` job runs periodically to scan inventory levels.
- **Instant Email Alerts**: If any item drops below the minimum threshold (default: 20 units), an HTML low-stock alert is automatically sent to the Store Admin.

### ⚡ 6. Real-Time WebSockets (`socket.io`)
- Instant status updates pushed live to customer dashboards when the kitchen changes an order status.

### ✨ 7. Artisan Neapolitan Design System
- Built with **GSAP 3**, **Lenis Smooth Scroll**, **Glassmorphism**, **3D Tilt Perspective**, and **Magnetic Buttons**.

---

## 🛠️ Technology Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, TailwindCSS, GSAP 3 (ScrollTrigger), Lenis Smooth Scroll, Lucide Icons, Socket.io Client, Razorpay Checkout SDK |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Node `crypto` |
| **Payments** | Razorpay SDK (`razorpay`) |
| **Email & Cron** | Nodemailer (`nodemailer`), `node-cron` |

---

## 📁 Repository Directory Architecture

```text
WebDevelopment-Level3-PizzaApp/
├── client/                      # Frontend Application
│   ├── css/
│   │   └── styles.css           # Glassmorphism & Artisan UI tokens
│   ├── js/
│   │   └── app.js               # Client state, 4-step wizard, GSAP animations, Socket.io, Cart, Razorpay
│   └── index.html               # Main responsive Web App HTML
├── server/                      # Node.js/Express Backend
│   ├── config/
│   │   └── db.js                # MongoDB Mongoose connection
│   ├── controllers/
│   │   ├── authController.js    # Register, login, verify email, forgot/reset password
│   │   ├── inventoryController.js# Stock view, manual edit, database seed
│   │   ├── orderController.js    # Razorpay order creation, HMAC signature verification, stock decrement
│   │   └── pizzaBuilderController.js # 4-step builder options
│   ├── middleware/
│   │   └── auth.js              # JWT & Admin role middleware
│   ├── models/
│   │   ├── User.js              # User Mongoose Schema
│   │   ├── Inventory.js         # Inventory Mongoose Schema
│   │   └── Order.js             # Order Mongoose Schema
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── inventoryRoutes.js   # Inventory endpoints
│   │   └── orderRoutes.js       # Order & Payment endpoints
│   ├── utils/
│   │   ├── sendEmail.js         # Nodemailer HTML templates
│   │   └── cronJobs.js          # node-cron automated inventory alerts
│   ├── .env                     # Server environment configurations
│   ├── .env.example             # Template environment variables
│   ├── package.json             # Backend dependencies
│   └── server.js                # Express app, Socket.io & HTTP server startup
├── .gitignore                   # Excluded files (node_modules, .env)
├── package.json                 # Root deployment script (1-click Render/Railway deployment)
└── README.md                    # Project documentation
```

---

## 📡 API Endpoints Overview

### 🔐 Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register user & send email verification link |
| `GET` | `/api/auth/verify-email/:token` | Public | Confirm user email address |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset token email |
| `POST` | `/api/auth/reset-password/:token` | Public | Reset password using valid token |
| `GET` | `/api/auth/me` | Private | Retrieve logged-in user profile |

### 📦 Inventory Routes (`/api/inventory`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/inventory` | Public | Retrieve all inventory stock items |
| `GET` | `/api/inventory/builder-options` | Public | Fetch structured 4-step custom builder options |
| `PUT` | `/api/inventory/:id` | Admin | Manually update stock quantity & thresholds |
| `POST` | `/api/inventory/seed` | Admin | Reset and seed default inventory stock |

### 🍕 Order & Payment Routes (`/api/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/create-razorpay-order` | Private | Create Razorpay order & pending order record |
| `POST` | `/api/orders/verify-payment` | Private | HMAC signature verification & stock auto-decrement |
| `GET` | `/api/orders/my-orders` | Private | Get user order history & live order status |
| `GET` | `/api/orders/admin/all` | Admin | Retrieve all customer orders |
| `PUT` | `/api/orders/admin/:id/status` | Admin | Update order status (`Order Received` ➔ `Delivered`) |

---

## ⚙️ Quick Start Guide (Local Development)

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **MongoDB**: Active MongoDB Atlas Cluster or local MongoDB database instance.

### 2. Installation & Setup
Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/rehan-1002/OIBSIP.git
cd OIBSIP

# Install dependencies (runs root and server install)
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `server/` directory (or edit `server/.env`):

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pizza_app
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user
SMTP_PASS=your_ethereal_pass
ADMIN_EMAIL=admin@fuoco.com
LOW_STOCK_THRESHOLD=20
CLIENT_URL=http://localhost:5000
```

### 4. Run the Development Server
```bash
npm run dev
```

Visit **`http://localhost:5000`** in your browser!

---

## 🚀 Cloud Deployment Instructions

### Deploying to Render.com
1. Create a new **Web Service** on [Render](https://render.com) and link your repository `https://github.com/rehan-1002/OIBSIP.git`.
2. Configure settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables in Render Settings dashboard (copied from `server/.env`).

---

## 📜 License & Credits

Distributed under the **ISC License**. Developed with passion for wood-fired pizza lovers and full-stack web applications.
