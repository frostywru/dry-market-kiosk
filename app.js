import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── FIREBASE CONFIG ─────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCg78WsoPWQ--dTunQQNjhJGf7cpO6wpP4",
  authDomain: "dry-market-kiosk-f1e5e.firebaseapp.com",
  projectId: "dry-market-kiosk-f1e5e",
  storageBucket: "dry-market-kiosk-f1e5e.firebasestorage.app",
  messagingSenderId: "145444548340",
  appId: "1:145444548340:web:ee6b8cba9cd0f3df0ff8a1",
  measurementId: "G-D2D2DFQE83"
};

const ADMIN_PASSWORD = "7602";

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─── STATE ─────────────────────────────────────────
let products = [];
let cart = {};

// ─── SEED DEFAULT PRODUCTS ─────────────────────────────────────────
const DEFAULT_PRODUCTS = [
  { name: "Garlic", unit: "per kilo", price: 80, emoji: "🧄" },
  { name: "Onion", unit: "per kilo", price: 90, emoji: "🧅" },
  { name: "Tomato", unit: "per kilo", price: 60, emoji: "🍅" },
  { name: "Ginger", unit: "per kilo", price: 120, emoji: "🫚" },
  { name: "Potato", unit: "per kilo", price: 75, emoji: "🥔" },
  { name: "Carrot", unit: "per kilo", price: 70, emoji: "🥕" },
  { name: "Cabbage", unit: "per head", price: 40, emoji: "🥬" },
  { name: "Sitaw", unit: "per bundle", price: 20, emoji: "🫘" },
  { name: "Kangkong", unit: "per bundle", price: 15, emoji: "🌿" },
  { name: "Ampalaya", unit: "per piece", price: 25, emoji: "🥒" },
];

async function seedIfEmpty() {
  const snap = await getDocs(collection(db, "products"));
  if (snap.empty) {
    for (const p of DEFAULT_PRODUCTS) {
      await addDoc(collection(db, "products"), p);
    }
  }
}

// ─── LISTENER ─────────────────────────────────────────
function listenProducts() {
  onSnapshot(collection(db, "products"), (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.name.localeCompare(b.name));
    renderProductGrid();
    renderAdminProducts();
  });
}

// ─── PRODUCT GRID (UPDATED TO KG INPUT) ─────────────────────────────────────────
function renderProductGrid() {
  const grid = document.getElementById("product-grid");

  if (!products.length) {
    grid.innerHTML = `<div class="loading-spinner">Loading products…</div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    return `
    <div class="product-card">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-unit">${p.unit}</div>
      <div class="product-price">₱${Number(p.price).toFixed(2)}</div>

      <div class="kg-controls">
        <input 
          type="number"
          min="0"
          step="0.1"
          placeholder="kg"
          id="kg-${p.id}"
          class="kg-input"
        />
        <button 
          class="add-cart-btn"
          onclick="addKgToCart('${p.id}')"
        >
          Add to Cart
        </button>
      </div>
    </div>`;
  }).join('');
}

// ─── KG ADD TO CART (NEW CORE LOGIC) ─────────────────────────────────────────
window.addKgToCart = function(id) {
  const input = document.getElementById(`kg-${id}`);
  const value = parseFloat(input.value);

  if (!value || value <= 0) return;

  cart[id] = (cart[id] || 0) + value;

  input.value = "";
  updateCartDisplay();
};

// ─── CART DISPLAY ─────────────────────────────────────────
function updateCartDisplay() {
  const cartItemsEl = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const orderBtn = document.getElementById("order-btn");

  const entries = Object.entries(cart);

  if (!entries.length) {
    cartItemsEl.innerHTML = `
      <div class="empty-cart">
        <span>🥬</span><p>Add items to your basket</p>
      </div>`;
    totalEl.textContent = "₱0.00";
    orderBtn.disabled = true;
    return;
  }

  let total = 0;

  cartItemsEl.innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    if (!p) return '';

    const sub = p.price * qty;
    total += sub;

    return `
    <div class="cart-item">
      <span class="cart-item-emoji">${p.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-qty">${qty} kg × ₱${Number(p.price).toFixed(2)}</div>
      </div>
      <span class="cart-item-price">₱${sub.toFixed(2)}</span>
      <button class="cart-item-remove" onclick="removeFromCart('${id}')">✕</button>
    </div>`;
  }).join('');

  totalEl.textContent = `₱${total.toFixed(2)}`;
  orderBtn.disabled = false;
}

// ─── REMOVE / CLEAR ─────────────────────────────────────────
window.removeFromCart = function(id) {
  delete cart[id];
  updateCartDisplay();
};

window.clearCart = function() {
  cart = {};
  updateCartDisplay();
};

// ─── ORDER SYSTEM (UNCHANGED) ─────────────────────────────────────────
window.openOrderModal = function() {
  const entries = Object.entries(cart);
  let total = 0;

  document.getElementById("receipt-items").innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    const sub = p.price * qty;
    total += sub;

    return `
    <div class="receipt-item-row">
      <span>${p.emoji} ${p.name} × ${qty}kg</span>
      <span>₱${sub.toFixed(2)}</span>
    </div>`;
  }).join('');

  document.getElementById("receipt-total").textContent = `₱${total.toFixed(2)}`;
  document.getElementById("order-modal").style.display = "flex";
};

window.closeOrderModal = function() {
  document.getElementById("order-modal").style.display = "none";
};

window.confirmOrder = async function() {
  const name = document.getElementById("customer-name").value || "Walk-in";
  const entries = Object.entries(cart);

  let total = 0;
  const items = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    const sub = p.price * qty;
    total += sub;

    return {
      name: p.name,
      emoji: p.emoji,
      qty,
      unitPrice: p.price,
      subtotal: sub
    };
  });

  await addDoc(collection(db, "orders"), {
    customer: name,
    items,
    total,
    createdAt: serverTimestamp()
  });

  cart = {};
  updateCartDisplay();
  closeOrderModal();
};

// ─── BOOT ─────────────────────────────────────────
(async () => {
  await seedIfEmpty();
  listenProducts();
})();