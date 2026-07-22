// =========================================================
// FUOCO ARTISAN PIZZA — GSAP ANIMATIONS & MERN ENGINE
// =========================================================

const API_BASE = '/api';

// Socket.io initialization
let socket = null;
try {
  socket = io();
  socket.on('connect', () => console.log('[Socket.io] Connected to server'));
  socket.on('orderStatusChanged', (data) => {
    showToast(`Order status updated to: ${data.orderStatus}`);
    if (userStore.token) {
      loadUserOrders();
      if (userStore.user && userStore.user.role === 'admin') loadAdminOrders();
    }
  });
  socket.on('newOrderAlert', () => {
    if (userStore.user && userStore.user.role === 'admin') {
      showToast('🔔 New order received!');
      loadAdminOrders();
      loadAdminInventory();
    }
  });
} catch (e) {
  console.warn('Socket.io connection fallback:', e);
}

// ---------------------------------------------------------
// AUTH STATE
// ---------------------------------------------------------
const userStore = {
  token: localStorage.getItem('fuoco_token') || null,
  user: JSON.parse(localStorage.getItem('fuoco_user') || 'null'),

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('fuoco_token', token);
    localStorage.setItem('fuoco_user', JSON.stringify(user));
    updateAuthUI();
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('fuoco_token');
    localStorage.removeItem('fuoco_user');
    updateAuthUI();
    showToast('Logged out successfully');
  }
};

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {})
  };
}

function updateAuthUI() {
  const authNav = document.getElementById('authNavButtons');
  const userNav = document.getElementById('userInfoNav');
  const navName = document.getElementById('navUserName');
  const adminBtn = document.getElementById('adminPanelNavBtn');
  const myOrdersBtn = document.getElementById('myOrdersBtn');

  if (userStore.token && userStore.user) {
    authNav?.classList.add('hidden');
    userNav?.classList.remove('hidden');
    myOrdersBtn?.classList.remove('hidden');
    if (navName) navName.textContent = `Hi, ${userStore.user.name.split(' ')[0]}`;

    if (userStore.user.role === 'admin') {
      adminBtn?.classList.remove('hidden');
    } else {
      adminBtn?.classList.add('hidden');
    }
  } else {
    authNav?.classList.remove('hidden');
    userNav?.classList.add('hidden');
    myOrdersBtn?.classList.add('hidden');
    adminBtn?.classList.add('hidden');
  }
}

function checkUrlHashActions() {
  const hash = window.location.hash;
  if (hash.includes('verify-email')) {
    const token = new URLSearchParams(hash.split('?')[1]).get('token');
    if (token) {
      fetch(`${API_BASE}/auth/verify-email/${token}`)
        .then(res => res.json())
        .then(data => {
          showToast(data.message || 'Email verification process complete');
          window.location.hash = '';
        });
    }
  }
}

// ---------------------------------------------------------
// CART STORE
// ---------------------------------------------------------
const CartStore = {
  items: JSON.parse(localStorage.getItem('fuoco_cart') || '[]'),
  listeners: [],

  save() {
    localStorage.setItem('fuoco_cart', JSON.stringify(this.items));
    this.notify();
  },

  addItem(item) {
    const existingIndex = this.items.findIndex(i =>
      i.id === item.id &&
      i.size === item.size &&
      JSON.stringify(i.toppings || []) === JSON.stringify(item.toppings || []) &&
      i.base === item.base &&
      i.sauce === item.sauce &&
      i.cheese === item.cheese
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += (item.quantity || 1);
    } else {
      this.items.push({
        ...item,
        id: item.id || Date.now(),
        quantity: item.quantity || 1
      });
    }
    this.save();
  },

  updateQuantity(id, size, delta) {
    const item = this.items.find(i => i.id == id && i.size === size);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.items = this.items.filter(i => !(i.id == id && i.size === size));
      }
      this.save();
    }
  },

  removeItem(id, size) {
    this.items = this.items.filter(i => !(i.id == id && i.size === size));
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  },

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  subscribe(fn) {
    this.listeners.push(fn);
  },

  notify() {
    this.listeners.forEach(fn => fn());
  }
};

// ---------------------------------------------------------
// PRESET DATA
// ---------------------------------------------------------
const INGREDIENTS = [
  { title: 'San Marzano Tomatoes', desc: 'Grown in volcanic soil at Mount Vesuvius. DOP-certified, sweet, and impossibly rich.', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&h=400&fit=crop' },
  { title: 'Fresh Mozzarella di Bufala', desc: 'Handcrafted daily from water buffalo milk in Campania. Creamy and delicate.', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&h=400&fit=crop' },
  { title: '72-Hour Fermented Dough', desc: 'Tipo 00 flour, wild yeast, and 3 days of cold fermentation creating an airy crust.', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop' },
  { title: 'Tuscan Extra Virgin Olive Oil', desc: 'Cold-pressed from Frantoio olives for a peppery finish.', image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&h=400&fit=crop' }
];

const PRESET_PIZZAS = [
  { id: 1, name: 'Margherita Classica', category: 'classic', price: 14.99, rating: 4.8, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop', badge: null, description: 'San Marzano tomatoes, fresh mozzarella, basil, EVOO', base: 'Neapolitan Artisan Crust', sauce: 'San Marzano DOP Tomato Sauce', cheese: 'Fresh Mozzarella di Bufala' },
  { id: 2, name: 'Diavola', category: 'spicy', price: 16.99, rating: 4.9, image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=600&h=400&fit=crop', badge: 'spicy', description: 'Spicy salami, crushed chili, mozzarella, tomato sauce', base: 'Thin Crisp New York Style', sauce: 'Spicy Fiery Marinara', cheese: 'Fresh Mozzarella di Bufala' },
  { id: 3, name: 'Quattro Formaggi', category: 'classic', price: 17.99, rating: 4.7, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop', badge: 'best', description: 'Mozzarella, gorgonzola, parmesan, fontina, honey drizzle', base: 'Stuffed Cheese Crust', sauce: 'Creamy Garlic Alfredo', cheese: 'Gorgonzola Dolce DOP' },
  { id: 4, name: 'Truffle Mushroom', category: 'specialty', price: 19.99, rating: 5.0, image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=400&fit=crop', badge: 'chef', description: 'Wild mushroom mix, truffle cream, mozzarella, arugula', base: 'Neapolitan Artisan Crust', sauce: 'Genovese Basil Pesto', cheese: 'Fresh Mozzarella di Bufala' },
  { id: 5, name: 'BBQ Chicken', category: 'specialty', price: 18.99, rating: 4.6, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop', badge: null, description: 'Smoked chicken, red onion, cilantro, BBQ sauce, gouda', base: 'Sicilian Deep Dish Pan', sauce: 'Smoked Hickory BBQ Sauce', cheese: 'Smoked Gouda & Fontina' },
  { id: 6, name: 'Veggie Garden', category: 'vegetarian', price: 15.49, rating: 4.5, image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&h=400&fit=crop', badge: null, description: 'Bell peppers, red onion, mushrooms, olives, cherry tomatoes', base: 'Gluten-Free Cauliflower Base', sauce: 'San Marzano DOP Tomato Sauce', cheese: 'Plant-Based Vegan Mozzarella' }
];

const CATEGORIES = ['all', 'classic', 'specialty', 'vegetarian', 'spicy'];

// ---------------------------------------------------------
// 4-STEP CUSTOM PIZZA BUILDER WIZARD
// ---------------------------------------------------------
let currentBuilderStep = 1;
let builderOptionsData = null;

const customPizzaState = {
  base: null,
  sauce: null,
  cheese: null,
  veggies: [],
  size: 'Medium',
  sizeMultiplier: 1.0
};

async function fetchBuilderOptions() {
  try {
    const res = await fetch(`${API_BASE}/inventory/builder-options`);
    const data = await res.json();
    if (data.success) {
      builderOptionsData = data.options;
    }
  } catch (err) {
    console.error('Error fetching builder options from API:', err);
  }
}

function renderBuilderStep() {
  if (!builderOptionsData) return;

  const basesContainer = document.getElementById('basesList');
  if (basesContainer) {
    basesContainer.innerHTML = builderOptionsData.step1_bases.map(item => `
      <div class="option-card ${customPizzaState.base && customPizzaState.base._id === item._id ? 'selected' : ''}" data-type="base" data-id="${item._id}">
        <div>
          <div class="font-bold text-sm text-white">${item.name}</div>
          <div class="text-xs text-stone-400 mt-0.5">${item.description}</div>
        </div>
        <div class="text-right">
          <span class="font-bold text-sm text-accent">$${item.price.toFixed(2)}</span>
          <span class="block text-[10px] ${item.stockQuantity < 20 ? 'text-red-400' : 'text-stone-400'}">${item.stockQuantity} left</span>
        </div>
      </div>
    `).join('');
  }

  const saucesContainer = document.getElementById('saucesList');
  if (saucesContainer) {
    saucesContainer.innerHTML = builderOptionsData.step2_sauces.map(item => `
      <div class="option-card ${customPizzaState.sauce && customPizzaState.sauce._id === item._id ? 'selected' : ''}" data-type="sauce" data-id="${item._id}">
        <div>
          <div class="font-bold text-sm text-white">${item.name}</div>
          <div class="text-xs text-stone-400 mt-0.5">${item.description}</div>
        </div>
        <div class="text-right">
          <span class="font-bold text-sm text-accent">${item.price > 0 ? '+$' + item.price.toFixed(2) : 'Included'}</span>
          <span class="block text-[10px] ${item.stockQuantity < 20 ? 'text-red-400' : 'text-stone-400'}">${item.stockQuantity} left</span>
        </div>
      </div>
    `).join('');
  }

  const cheesesContainer = document.getElementById('cheesesList');
  if (cheesesContainer) {
    cheesesContainer.innerHTML = builderOptionsData.step3_cheeses.map(item => `
      <div class="option-card ${customPizzaState.cheese && customPizzaState.cheese._id === item._id ? 'selected' : ''}" data-type="cheese" data-id="${item._id}">
        <div>
          <div class="font-bold text-sm text-white">${item.name}</div>
          <div class="text-xs text-stone-400 mt-0.5">${item.description}</div>
        </div>
        <div class="text-right">
          <span class="font-bold text-sm text-accent">+$${item.price.toFixed(2)}</span>
          <span class="block text-[10px] ${item.stockQuantity < 20 ? 'text-red-400' : 'text-stone-400'}">${item.stockQuantity} left</span>
        </div>
      </div>
    `).join('');
  }

  const veggiesContainer = document.getElementById('veggiesList');
  if (veggiesContainer) {
    veggiesContainer.innerHTML = builderOptionsData.step4_veggies.map(item => {
      const isSelected = customPizzaState.veggies.some(v => v._id === item._id);
      return `
        <div class="option-card ${isSelected ? 'selected' : ''}" data-type="veggie" data-id="${item._id}">
          <div>
            <div class="font-bold text-xs text-white">${item.name}</div>
            <div class="text-[10px] text-accent mt-0.5">+$${item.price.toFixed(2)}</div>
          </div>
          <span class="text-[10px] ${item.stockQuantity < 20 ? 'text-red-400' : 'text-stone-400'}">${item.stockQuantity} left</span>
        </div>
      `;
    }).join('');
  }

  updateBuilderSummary();
}

function updateBuilderSummary() {
  if (!customPizzaState.base && builderOptionsData?.step1_bases?.length) {
    customPizzaState.base = builderOptionsData.step1_bases[0];
  }
  if (!customPizzaState.sauce && builderOptionsData?.step2_sauces?.length) {
    customPizzaState.sauce = builderOptionsData.step2_sauces[0];
  }
  if (!customPizzaState.cheese && builderOptionsData?.step3_cheeses?.length) {
    customPizzaState.cheese = builderOptionsData.step3_cheeses[0];
  }

  let total = 0;
  if (customPizzaState.base) total += customPizzaState.base.price;
  if (customPizzaState.sauce) total += customPizzaState.sauce.price;
  if (customPizzaState.cheese) total += customPizzaState.cheese.price;
  customPizzaState.veggies.forEach(v => total += v.price);

  const priceEl = document.getElementById('builderTotalPrice');
  if (priceEl) priceEl.textContent = `$${total.toFixed(2)}`;
}

function setBuilderStep(step) {
  currentBuilderStep = step;
  [1, 2, 3, 4].forEach(s => {
    const el = document.getElementById(`builderStep${s}`);
    const pill = document.getElementById(`stepPill${s}`);
    if (el && pill) {
      if (s === step) {
        el.classList.remove('hidden');
        pill.className = 'step-pill active';
      } else if (s < step) {
        el.classList.add('hidden');
        pill.className = 'step-pill completed';
      } else {
        el.classList.add('hidden');
        pill.className = 'step-pill';
      }
    }
  });

  const prevBtn = document.getElementById('builderPrevBtn');
  const nextBtn = document.getElementById('builderNextBtn');
  const addBtn = document.getElementById('builderAddToCartBtn');

  if (prevBtn) prevBtn.disabled = step === 1;

  if (step === 4) {
    nextBtn?.classList.add('hidden');
    addBtn?.classList.remove('hidden');
  } else {
    nextBtn?.classList.remove('hidden');
    addBtn?.classList.add('hidden');
  }
}

// ---------------------------------------------------------
// RENDER FUNCTIONS
// ---------------------------------------------------------
function renderIngredients() {
  const el = document.getElementById('ingredientTrack');
  if (!el) return;
  el.innerHTML = INGREDIENTS.map(item => `
    <div class="ingredient-card" data-tilt>
      <img src="${item.image}" alt="${item.title}">
      <div class="p-6">
        <h3 class="font-display font-bold text-xl mb-2">${item.title}</h3>
        <p class="text-sm leading-relaxed" style="color:var(--muted)">${item.desc}</p>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('[data-tilt]').forEach(initTiltEffect);
}

function renderFilterBar() {
  const el = document.getElementById('filterBar');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(cat => `
    <button class="filter-btn ${cat === 'all' ? 'active' : ''}" data-cat="${cat}">
      ${cat.charAt(0).toUpperCase() + cat.slice(1)}
    </button>
  `).join('');

  el.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      el.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderPizzaCards(this.dataset.cat);
    });
  });
}

function renderPizzaCards(filterCat = 'all') {
  const el = document.getElementById('pizzaGrid');
  if (!el) return;

  const filtered = filterCat === 'all' ? PRESET_PIZZAS : PRESET_PIZZAS.filter(p => p.category === filterCat);

  el.innerHTML = filtered.map(pizza => `
    <div class="pizza-card" data-tilt>
      <div class="img-wrap">
        ${pizza.badge ? `<span class="pizza-badge badge-${pizza.badge}">${pizza.badge.toUpperCase()}</span>` : ''}
        <img src="${pizza.image}" alt="${pizza.name}">
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-display font-bold text-lg">${pizza.name}</h3>
          <span class="font-bold text-accent">$${pizza.price.toFixed(2)}</span>
        </div>
        <p class="text-xs text-stone-400 mb-4 line-clamp-2">${pizza.description}</p>
        <button class="add-preset-btn w-full py-3 rounded-xl bg-charcoal-lighter hover:bg-accent text-white font-semibold text-xs transition-colors" data-id="${pizza.id}">
          Add to Cart 🛒
        </button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('#pizzaGrid .pizza-card[data-tilt]').forEach(initTiltEffect);

  el.querySelectorAll('.add-preset-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const pizza = PRESET_PIZZAS.find(p => p.id == this.dataset.id);
      if (pizza) {
        CartStore.addItem({
          id: pizza.id,
          name: pizza.name,
          price: pizza.price,
          sizeLabel: 'Medium',
          size: 'M',
          image: pizza.image,
          isCustom: false,
          base: pizza.base,
          sauce: pizza.sauce,
          cheese: pizza.cheese,
          toppings: []
        });
        showToast(`Added ${pizza.name} to cart!`);
        openCart();
      }
    });
  });
}

function renderCart() {
  const items = CartStore.items;
  const el = document.getElementById('cartItems');
  const ft = document.getElementById('cartFooter');

  if (!el || !ft) return;

  if (!items.length) {
    el.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-center py-16">
        <i data-lucide="shopping-bag" class="w-16 h-16 mb-4 text-stone-600"></i>
        <p class="font-display font-bold text-lg mb-2">Your cart is empty</p>
        <p class="text-sm text-stone-400">Build a custom pizza or pick a classic pie!</p>
      </div>`;
    ft.innerHTML = '';
  } else {
    el.innerHTML = items.map(item => `
      <div class="flex gap-4 mb-5 pb-5 border-b border-charcoal-lighter">
        <img src="${item.image || 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop'}" class="w-16 h-16 rounded-xl object-cover flex-shrink-0">
        <div class="flex-1 min-w-0">
          <h4 class="font-display font-bold text-sm truncate">${item.name}</h4>
          <p class="text-xs text-stone-400 mt-0.5">${item.base ? item.base + ' | ' : ''}${item.sauce || ''}</p>
          ${item.veggies?.length ? `<p class="text-[10px] text-amber-400">+ ${item.veggies.join(', ')}</p>` : ''}
          <p class="font-bold text-sm mt-1 text-accent">$${(item.price * item.quantity).toFixed(2)}</p>
          <div class="flex items-center gap-3 mt-2">
            <button class="cart-act w-6 h-6 rounded-full bg-charcoal-lighter text-xs font-bold" data-action="dec" data-id="${item.id}" data-size="${item.size}">-</button>
            <span class="text-sm font-semibold">${item.quantity}</span>
            <button class="cart-act w-6 h-6 rounded-full bg-charcoal-lighter text-xs font-bold" data-action="inc" data-id="${item.id}" data-size="${item.size}">+</button>
            <button class="cart-act ml-auto p-1 text-stone-400 hover:text-red-400" data-action="remove" data-id="${item.id}" data-size="${item.size}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
        </div>
      </div>
    `).join('');

    ft.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm text-stone-400">Total Amount</span>
        <span class="font-display font-bold text-2xl text-white">$${CartStore.getTotal().toFixed(2)}</span>
      </div>
      <button id="checkoutBtn" class="w-full py-4 rounded-2xl font-display font-bold text-base bg-accent text-white hover:bg-orange-600 shadow-lg shadow-orange-900/40 transition-all flex items-center justify-center gap-2">
        <span>Proceed to Razorpay Checkout</span>
        <i data-lucide="arrow-right" class="w-5 h-5"></i>
      </button>
      <button id="clearCartBtn" class="w-full py-3 mt-2 rounded-2xl text-xs font-medium text-stone-400 hover:text-white border border-charcoal-lighter">Clear Cart</button>
    `;
  }

  if (window.lucide) lucide.createIcons();

  const count = CartStore.getCount();
  const nb = document.getElementById('navCartBadge');
  const fb = document.getElementById('floatingCartBadge');
  const fc = document.getElementById('floatingCart');

  if (nb) { nb.textContent = count; nb.style.display = count > 0 ? 'flex' : 'none'; }
  if (fb) fb.textContent = count;
  if (fc) {
    if (count > 0) { fc.classList.add('visible'); fb?.classList.add('visible'); }
    else { fc.classList.remove('visible'); fb?.classList.remove('visible'); }
  }
}

// Delegate Cart actions
document.getElementById('cartItems')?.addEventListener('click', function(e) {
  const btn = e.target.closest('.cart-act');
  if (!btn) return;
  const a = btn.dataset.action, id = btn.dataset.id, sz = btn.dataset.size;
  if (a === 'inc') CartStore.updateQuantity(id, sz, 1);
  else if (a === 'dec') CartStore.updateQuantity(id, sz, -1);
  else if (a === 'remove') CartStore.removeItem(id, sz);
});

document.getElementById('cartFooter')?.addEventListener('click', function(e) {
  if (e.target.closest('#checkoutBtn')) handleRazorpayCheckout();
  if (e.target.closest('#clearCartBtn')) CartStore.clear();
});

CartStore.subscribe(renderCart);

// ---------------------------------------------------------
// RAZORPAY CHECKOUT FLOW
// ---------------------------------------------------------
async function handleRazorpayCheckout() {
  if (!userStore.token) {
    closeCart();
    openModal('authModal');
    showToast('Please log in to complete your order!');
    return;
  }

  if (!CartStore.items.length) {
    showToast('Your cart is empty!');
    return;
  }

  try {
    showToast('Initializing Razorpay Order...');

    const orderItems = CartStore.items.map(item => ({
      pizzaName: item.name,
      isCustom: item.isCustom || false,
      size: item.sizeLabel || 'Medium',
      base: item.base || '',
      sauce: item.sauce || '',
      cheese: item.cheese || '',
      veggies: item.veggies || [],
      toppings: item.toppings || [],
      price: item.price,
      quantity: item.quantity
    }));

    const response = await fetch(`${API_BASE}/orders/create-razorpay-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        items: orderItems,
        totalAmount: CartStore.getTotal(),
        deliveryAddress: 'Main St, Artisan District'
      })
    });

    const data = await response.json();
    if (!data.success) {
      showToast(data.message || 'Failed initializing Razorpay order');
      return;
    }

    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: 'FUOCO Artisan Pizza',
      description: 'Wood-Fired Neapolitan Pizza Order',
      order_id: data.razorpayOrderId,
      prefill: {
        name: userStore.user.name,
        email: userStore.user.email
      },
      theme: { color: '#FF5E14' },
      handler: async function (razorpayRes) {
        showToast('Verifying payment signature...');
        try {
          const verifyRes = await fetch(`${API_BASE}/orders/verify-payment`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              razorpayOrderId: razorpayRes.razorpay_order_id,
              razorpayPaymentId: razorpayRes.razorpay_payment_id,
              razorpaySignature: razorpayRes.razorpay_signature
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            CartStore.clear();
            closeCart();
            showToast('🎉 Order Paid & Confirmed! Check My Orders.');
            loadUserOrders();
            openModal('ordersModal');
          } else {
            showToast(verifyData.message || 'Payment verification failed');
          }
        } catch (err) {
          showToast('Payment verification error: ' + err.message);
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    showToast('Checkout error: ' + err.message);
  }
}

// ---------------------------------------------------------
// USER ORDERS & LIVE STATUS TRACKER
// ---------------------------------------------------------
async function loadUserOrders() {
  if (!userStore.token) return;
  try {
    const res = await fetch(`${API_BASE}/orders/my-orders`, { headers: getAuthHeaders() });
    const data = await res.json();
    const container = document.getElementById('userOrdersList');

    if (!container) return;

    if (data.success && data.orders.length) {
      container.innerHTML = data.orders.map(order => `
        <div class="p-5 rounded-2xl bg-charcoal border border-charcoal-lighter">
          <div class="flex items-center justify-between mb-3 pb-3 border-b border-charcoal-lighter">
            <div>
              <span class="font-bold text-sm text-white">Order #${order._id.slice(-6).toUpperCase()}</span>
              <span class="text-xs text-stone-500 block">${new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <span class="status-badge ${getStatusBadgeClass(order.orderStatus)}">${order.orderStatus}</span>
          </div>

          <div class="flex items-center justify-between my-4 px-2">
            ${['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'].map((st, i, arr) => {
              const currentIdx = arr.indexOf(order.orderStatus);
              const isPastOrCurrent = i <= currentIdx;
              return `
                <div class="flex flex-col items-center gap-1">
                  <div class="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${isPastOrCurrent ? 'bg-accent text-white' : 'bg-charcoal-lighter text-stone-500'}">
                    ${i + 1}
                  </div>
                  <span class="text-[9px] ${isPastOrCurrent ? 'text-amber-400 font-semibold' : 'text-stone-600'}">${st}</span>
                </div>
              `;
            }).join('<div class="h-0.5 flex-1 bg-charcoal-lighter mx-1 mb-4"></div>')}
          </div>

          <div class="space-y-1 text-xs text-stone-300">
            ${order.items.map(item => `
              <div class="flex justify-between">
                <span>${item.quantity}x ${item.pizzaName} (${item.size})</span>
                <span class="text-accent font-semibold">$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <div class="mt-4 pt-3 border-t border-charcoal-lighter flex justify-between items-center text-xs">
            <span class="text-stone-400">Payment: <strong class="text-emerald-400 uppercase">${order.paymentStatus}</strong></span>
            <span class="font-bold text-base text-white">Total: $${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="text-center text-stone-400 text-sm py-8">No orders found yet. Build your first pizza!</p>';
    }
  } catch (err) {
    console.error('Error loading user orders:', err);
  }
}

function getStatusBadgeClass(status) {
  if (status === 'Order Received') return 'status-received';
  if (status === 'In Kitchen') return 'status-kitchen';
  if (status === 'Sent to Delivery') return 'status-delivery';
  if (status === 'Delivered') return 'status-delivered';
  return 'status-received';
}

// ---------------------------------------------------------
// ADMIN PANEL (INVENTORY & ORDER CONTROL)
// ---------------------------------------------------------
async function loadAdminInventory() {
  if (!userStore.token || userStore.user?.role !== 'admin') return;
  try {
    const res = await fetch(`${API_BASE}/inventory`, { headers: getAuthHeaders() });
    const data = await res.json();
    const table = document.getElementById('adminInventoryTable');
    let lowCount = 0;

    if (data.success && table) {
      table.innerHTML = data.inventory.map(item => {
        const isLow = item.stockQuantity < item.minThreshold;
        if (isLow) lowCount++;
        return `
          <tr class="hover:bg-charcoal-lighter/50">
            <td class="p-3 uppercase text-[10px] font-bold text-amber-400">${item.category}</td>
            <td class="p-3 font-semibold text-white">${item.name}</td>
            <td class="p-3">$${item.price.toFixed(2)}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded ${isLow ? 'stock-badge-low' : 'stock-badge-ok'} font-bold">
                ${item.stockQuantity} units
              </span>
            </td>
            <td class="p-3 text-stone-400">${item.minThreshold}</td>
            <td class="p-3">
              <button class="update-stock-btn text-[11px] bg-accent/20 hover:bg-accent text-accent hover:text-white px-2.5 py-1 rounded transition-colors font-semibold" data-id="${item._id}" data-name="${item.name}" data-qty="${item.stockQuantity}">
                Edit Stock
              </button>
            </td>
          </tr>
        `;
      }).join('');

      const badge = document.getElementById('lowStockCountBadge');
      if (badge) badge.textContent = lowCount;
    }
  } catch (err) {
    console.error('Error loading inventory:', err);
  }
}

async function loadAdminOrders() {
  if (!userStore.token || userStore.user?.role !== 'admin') return;
  try {
    const res = await fetch(`${API_BASE}/orders/admin/all`, { headers: getAuthHeaders() });
    const data = await res.json();
    const table = document.getElementById('adminOrdersTable');

    if (data.success && table) {
      table.innerHTML = data.orders.map(order => `
        <tr class="hover:bg-charcoal-lighter/50">
          <td class="p-3 font-bold text-amber-400">#${order._id.slice(-6).toUpperCase()}</td>
          <td class="p-3 font-medium text-white">${order.user?.name || 'Customer'}<br><span class="text-[10px] text-stone-400">${order.user?.email || ''}</span></td>
          <td class="p-3 text-[11px]">${order.items.map(i => `${i.quantity}x ${i.pizzaName}`).join(', ')}</td>
          <td class="p-3 font-bold text-accent">$${order.totalAmount.toFixed(2)}</td>
          <td class="p-3 uppercase text-[10px] text-emerald-400 font-bold">${order.paymentStatus}</td>
          <td class="p-3">
            <select class="admin-status-select bg-charcoal border border-charcoal-lighter text-xs text-white rounded p-1" data-id="${order._id}">
              ${['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'].map(st => `
                <option value="${st}" ${order.orderStatus === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading admin orders:', err);
  }
}

// ---------------------------------------------------------
// ORIGINAL GSAP & LENIS ANIMATIONS ENGINE
// ---------------------------------------------------------
let lenis = null;

function initSmoothScroll() {
  try {
    lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => { if (lenis) lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } catch (e) { console.warn('Lenis unavailable.'); }
}

function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 2 });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToElement(sel) {
  const el = document.querySelector(sel);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.5 });
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initMagneticButton(btn) {
  if (!btn) return;
  btn.addEventListener('mousemove', function(e) {
    const r = this.getBoundingClientRect();
    gsap.to(this, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.3, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', function() {
    gsap.to(this, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  });
}

function initTiltEffect(card) {
  if (!card) return;
  card.addEventListener('mousemove', function(e) {
    const r = this.getBoundingClientRect();
    gsap.to(this, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 12, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 12, duration: 0.4, ease: 'power2.out', transformPerspective: 800 });
  });
  card.addEventListener('mouseleave', function() {
    gsap.to(this, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)', transformPerspective: 800 });
  });
}

function createHeroParticles() {
  const c = document.getElementById('heroParticles');
  if (!c) return;
  const cols = ['var(--accent)', 'var(--gold)', 'rgba(255,94,20,0.6)', 'rgba(255,184,0,0.5)'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div'); p.className = 'hero-particle';
    const sz = Math.random() * 6 + 2;
    p.style.cssText = '--dur:' + (Math.random() * 6 + 6) + 's;--delay:' + (Math.random() * 8) + 's;--op:' + (Math.random() * 0.5 + 0.2) + ';width:' + sz + 'px;height:' + sz + 'px;left:' + (Math.random() * 100) + '%;bottom:' + (Math.random() * 30) + '%;background:' + cols[Math.floor(Math.random() * cols.length)];
    c.appendChild(p);
  }
}

function splitText(el) {
  if (!el) return [];
  const txt = el.textContent; el.innerHTML = '';
  txt.split(' ').forEach((w, wi) => {
    if (wi > 0) { const s = document.createElement('span'); s.innerHTML = '&nbsp;'; s.style.cssText = 'display:inline-block;width:0.3em'; el.appendChild(s); }
    [...w].forEach(ch => { const s = document.createElement('span'); s.className = 'char-reveal'; s.textContent = ch; s.style.display = 'inline-block'; el.appendChild(s); });
  });
  return el.querySelectorAll('.char-reveal');
}

function initGSAPAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Scroll Progress Bar
  gsap.to('#scroll-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });

  // Nav Solid background transition
  ScrollTrigger.create({
    start: 'top -80',
    onUpdate: self => {
      const n = document.getElementById('mainNav');
      if (n) {
        if (self.progress > 0) n.classList.add('nav-solid');
        else n.classList.remove('nav-solid');
      }
    }
  });

  // Hero Headline Character Reveal Animation
  const headline = document.getElementById('heroHeadline');
  if (headline) {
    const chars = splitText(headline);
    gsap.set('#heroTag', { opacity: 0, y: 20 });
    gsap.set('#heroSub', { opacity: 0, y: 20 });
    gsap.set('#heroCta', { opacity: 0, y: 30 });
    gsap.set('#scrollIndicator', { opacity: 0 });

    const tl = gsap.timeline({ delay: 0.2 });
    tl.to('#heroTag', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
      .from(chars, { opacity: 0, y: 80, rotateX: -90, duration: 0.8, stagger: 0.02, ease: 'power3.out' }, '-=0.4')
      .to('#heroSub', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .from('#heroCta', { opacity: 0, y: 30, duration: 0.7, ease: 'power3.out' }, '-=0.4')
      .from('#heroPizzaWrap', { opacity: 0, scale: 0.7, rotation: -15, duration: 1.2, ease: 'power3.out' }, '-=0.8')
      .to('#scrollIndicator', { opacity: 1, duration: 0.6 }, '-=0.2');
  }

  // Hero Parallax Background & Rotating Pizza
  gsap.to('#heroBg', { y: 150, scale: 1.15, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('#heroPizza', { rotationY: 180, rotationX: 20, y: -100, scale: 0.7, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.5 } });
  gsap.to('#heroPizza', { y: '+=15', duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('#scrollIndicator', { opacity: 0, scrollTrigger: { trigger: '#hero', start: '10% top', end: '20% top', scrub: true } });

  // Horizontal Scroll Pinning for Ingredients
  const track = document.getElementById('ingredientTrack');
  function setupHScroll() {
    if (!track || window.innerWidth < 768) return;
    const dist = Math.max(0, track.scrollWidth - window.innerWidth + 100);
    if (dist <= 0) return;
    gsap.to(track, {
      x: -dist,
      ease: 'none',
      scrollTrigger: {
        trigger: '#why-us',
        start: 'top top',
        end: () => '+=' + dist,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
  }

  if (document.readyState === 'complete') setupHScroll();
  else window.addEventListener('load', () => { ScrollTrigger.refresh(); setupHScroll(); });

  // 3D Tilt Effect on cards
  document.querySelectorAll('[data-tilt]').forEach(initTiltEffect);

  // Reveal-Up animations
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' } });
  });

  // Pizza Grid Cards Entrance Animation
  ScrollTrigger.create({
    trigger: '#pizzaGrid',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.from('#pizzaGrid .pizza-card', { opacity: 0, y: 50, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
    }
  });
}

// ---------------------------------------------------------
// MODAL CONTROLS & BINDINGS
// ---------------------------------------------------------
function openModal(id) {
  document.getElementById('modalBackdrop')?.classList.add('open');
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById('modalBackdrop')?.classList.remove('open');
  document.getElementById(id)?.classList.remove('open');
}

function closeAllModals() {
  document.getElementById('modalBackdrop')?.classList.remove('open');
  document.querySelectorAll('.modal-glass').forEach(m => m.classList.remove('open'));
}

function openCart() {
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartDrawer')?.classList.add('open');
}

function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
}

function showToast(msg) {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

// ---------------------------------------------------------
// INITIALIZATION & EVENT LISTENERS
// ---------------------------------------------------------
function init() {
  updateAuthUI();
  checkUrlHashActions();
  fetchBuilderOptions();

  renderIngredients();
  renderFilterBar();
  renderPizzaCards('all');
  renderCart();
  createHeroParticles();

  initMagneticButton(document.getElementById('heroCta'));
  initMagneticButton(document.getElementById('heroCustomBuilderCta'));
  initSmoothScroll();

  // Navigation Click Handlers
  document.getElementById('navCartBtn')?.addEventListener('click', openCart);
  document.getElementById('floatingCart')?.addEventListener('click', openCart);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('modalBackdrop')?.addEventListener('click', closeAllModals);

  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // Nav links smooth scroll
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href !== '#') { e.preventDefault(); scrollToElement(href); }
    });
  });

  document.getElementById('backToTop')?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToTop();
  });

  // Builder Modal Triggers
  const triggerBuilder = () => {
    setBuilderStep(1);
    renderBuilderStep();
    openModal('builderModal');
  };

  document.getElementById('openBuilderBtn')?.addEventListener('click', triggerBuilder);
  document.getElementById('heroCustomBuilderCta')?.addEventListener('click', triggerBuilder);
  document.getElementById('footerBuilderBtn')?.addEventListener('click', triggerBuilder);

  // Builder Option Selection Delegation
  document.getElementById('builderStepContainer')?.addEventListener('click', (e) => {
    const card = e.target.closest('.option-card');
    if (!card || !builderOptionsData) return;

    const type = card.dataset.type;
    const id = card.dataset.id;

    if (type === 'base') {
      customPizzaState.base = builderOptionsData.step1_bases.find(b => b._id === id);
    } else if (type === 'sauce') {
      customPizzaState.sauce = builderOptionsData.step2_sauces.find(s => s._id === id);
    } else if (type === 'cheese') {
      customPizzaState.cheese = builderOptionsData.step3_cheeses.find(c => c._id === id);
    } else if (type === 'veggie') {
      const veggieObj = builderOptionsData.step4_veggies.find(v => v._id === id);
      const existsIdx = customPizzaState.veggies.findIndex(v => v._id === id);
      if (existsIdx > -1) customPizzaState.veggies.splice(existsIdx, 1);
      else customPizzaState.veggies.push(veggieObj);
    }
    renderBuilderStep();
  });

  document.getElementById('builderNextBtn')?.addEventListener('click', () => setBuilderStep(currentBuilderStep + 1));
  document.getElementById('builderPrevBtn')?.addEventListener('click', () => setBuilderStep(currentBuilderStep - 1));

  document.getElementById('builderAddToCartBtn')?.addEventListener('click', () => {
    if (!customPizzaState.base) {
      showToast('Please choose a pizza base');
      return;
    }
    const totalPrice = parseFloat(document.getElementById('builderTotalPrice').textContent.replace('$', ''));

    CartStore.addItem({
      id: Date.now(),
      name: `Custom 4-Step Pizza (${customPizzaState.base.name})`,
      price: totalPrice,
      sizeLabel: 'Medium',
      size: 'M',
      isCustom: true,
      base: customPizzaState.base.name,
      sauce: customPizzaState.sauce?.name || '',
      cheese: customPizzaState.cheese?.name || '',
      veggies: customPizzaState.veggies.map(v => v.name),
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop'
    });

    closeAllModals();
    showToast('Custom Pizza added to Cart! 🍕');
    openCart();
  });

  // Auth Modals & Forms
  document.getElementById('loginModalBtn')?.addEventListener('click', () => {
    document.getElementById('authModalTitle').textContent = 'Welcome Back';
    document.getElementById('loginForm')?.classList.remove('hidden');
    document.getElementById('registerForm')?.classList.add('hidden');
    document.getElementById('forgotForm')?.classList.add('hidden');
    openModal('authModal');
  });

  document.getElementById('registerModalBtn')?.addEventListener('click', () => {
    document.getElementById('authModalTitle').textContent = 'Create Account';
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('registerForm')?.classList.remove('hidden');
    document.getElementById('forgotForm')?.classList.add('hidden');
    openModal('authModal');
  });

  document.getElementById('toggleRegisterBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('registerForm')?.classList.remove('hidden');
  });

  document.getElementById('toggleLoginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm')?.classList.add('hidden');
    document.getElementById('loginForm')?.classList.remove('hidden');
  });

  document.getElementById('toggleForgotBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('forgotForm')?.classList.remove('hidden');
  });

  document.getElementById('backToLoginFromForgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('forgotForm')?.classList.add('hidden');
    document.getElementById('loginForm')?.classList.remove('hidden');
  });

  // Handle Login Submit
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        userStore.setAuth(data.token, data.user);
        closeAllModals();
        showToast(`Welcome back, ${data.user.name}!`);
      } else {
        showToast(data.message || 'Login failed');
      }
    } catch (err) {
      showToast('Login error: ' + err.message);
    }
  });

  // Handle Register Submit
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (data.success) {
        userStore.setAuth(data.token, data.user);
        closeAllModals();
        showToast(data.message || 'Registration successful!');
      } else {
        showToast(data.message || 'Registration failed');
      }
    } catch (err) {
      showToast('Registration error: ' + err.message);
    }
  });

  // Handle Forgot Password Submit
  document.getElementById('forgotForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      showToast(data.message || 'Password reset link sent');
      closeAllModals();
    } catch (err) {
      showToast('Request error');
    }
  });

  // Logout Handler
  document.getElementById('logoutBtn')?.addEventListener('click', () => userStore.logout());

  // My Orders Modal Trigger
  document.getElementById('myOrdersBtn')?.addEventListener('click', () => {
    loadUserOrders();
    openModal('ordersModal');
  });

  // Admin Panel Modal Trigger
  document.getElementById('adminPanelNavBtn')?.addEventListener('click', () => {
    loadAdminInventory();
    loadAdminOrders();
    openModal('adminModal');
  });

  // Admin Tabs Switcher
  document.getElementById('adminTabInventory')?.addEventListener('click', function() {
    document.getElementById('adminInventorySec')?.classList.remove('hidden');
    document.getElementById('adminOrdersSec')?.classList.add('hidden');
    this.className = 'text-sm font-bold pb-2 border-b-2 border-accent text-accent';
    const oTab = document.getElementById('adminTabOrders');
    if (oTab) oTab.className = 'text-sm font-bold pb-2 border-b-2 border-transparent text-stone-400 hover:text-white';
  });

  document.getElementById('adminTabOrders')?.addEventListener('click', function() {
    document.getElementById('adminOrdersSec')?.classList.remove('hidden');
    document.getElementById('adminInventorySec')?.classList.add('hidden');
    this.className = 'text-sm font-bold pb-2 border-b-2 border-accent text-accent';
    const iTab = document.getElementById('adminTabInventory');
    if (iTab) iTab.className = 'text-sm font-bold pb-2 border-b-2 border-transparent text-stone-400 hover:text-white';
  });

  // Preloader GSAP Timeline
  const pb = document.getElementById('preloaderBar');
  const pl = document.getElementById('preloader');
  if (pb && pl) {
    gsap.to(pb, {
      width: '100%', duration: 1.4, ease: 'power2.inOut',
      onComplete: () => {
        gsap.to(pl, {
          opacity: 0, duration: 0.5, ease: 'power2.in',
          onComplete: () => {
            pl.style.display = 'none';
            initGSAPAnimations();
          }
        });
      }
    });
  } else {
    initGSAPAnimations();
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
