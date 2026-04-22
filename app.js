import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── FIREBASE CONFIG ─────────────────────────
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
const db = getFirestore(app);

// ─── STATE ─────────────────────────
let products = [];
let cart = {};

// ─── DEFAULT PRODUCTS ─────────────────────────
const DEFAULT_PRODUCTS = [
  { name: "Garlic", unit: "per kilo", price: 80, emoji: "🧄" },
  { name: "Onion", unit: "per kilo", price: 90, emoji: "🧅" },
  { name: "Tomato", unit: "per kilo", price: 60, emoji: "🍅" },
  { name: "Ginger", unit: "per kilo", price: 120, emoji: "🫚" },
  { name: "Potato", unit: "per kilo", price: 75, emoji: "🥔" },
];

// ─── SEED ─────────────────────────
async function seedIfEmpty() {
  const snap = await getDocs(collection(db, "products"));
  if (snap.empty) {
    for (const p of DEFAULT_PRODUCTS) {
      await addDoc(collection(db, "products"), p);
    }
  }
}

// ─── PRODUCTS LISTENER ─────────────────────────
function listenProducts() {
  onSnapshot(collection(db, "products"), (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.name.localeCompare(b.name));

    renderProductGrid();
    renderAdminProducts();
  });
}

// ─── PRODUCT GRID ─────────────────────────
function renderProductGrid() {
  const grid = document.getElementById("product-grid");

  if (!products.length) {
    grid.innerHTML = `<div class="loading-spinner">Loading products…</div>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-unit">${p.unit}</div>
      <div class="product-price">₱${Number(p.price).toFixed(2)}</div>

      <div class="kg-controls">
        <input type="number" min="0" step="0.1" id="kg-${p.id}" class="kg-input" placeholder="kg"/>
        <button class="add-cart-btn" onclick="addKgToCart('${p.id}')">Add</button>
      </div>
    </div>
  `).join('');
}

// ─── CART ─────────────────────────
window.addKgToCart = function(id) {
  const input = document.getElementById(`kg-${id}`);
  const value = parseFloat(input.value);

  if (!value || value <= 0) return;

  cart[id] = (cart[id] || 0) + value;
  input.value = "";
  updateCartDisplay();
};

function updateCartDisplay() {
  const cartItemsEl = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const orderBtn = document.getElementById("order-btn");

  const entries = Object.entries(cart);

  if (!entries.length) {
    cartItemsEl.innerHTML = `<div class="empty-cart"><span>🥬</span><p>Add items</p></div>`;
    totalEl.textContent = "₱0.00";
    orderBtn.disabled = true;
    return;
  }

  let total = 0;

  cartItemsEl.innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    const sub = p.price * qty;
    total += sub;

    return `
      <div class="cart-item">
        <span>${p.emoji}</span>
        <div class="cart-item-info">
          <div>${p.name}</div>
          <small>${qty} kg</small>
        </div>
        <div>₱${sub.toFixed(2)}</div>
        <button onclick="removeFromCart('${id}')">✕</button>
      </div>
    `;
  }).join('');

  totalEl.textContent = `₱${total.toFixed(2)}`;
  orderBtn.disabled = false;
}

window.removeFromCart = (id) => {
  delete cart[id];
  updateCartDisplay();
};

window.clearCart = () => {
  cart = {};
  updateCartDisplay();
};

// ─── ORDER ─────────────────────────
window.openOrderModal = () => {
  document.getElementById("order-modal").style.display = "flex";
};

window.closeOrderModal = () => {
  document.getElementById("order-modal").style.display = "none";
};

window.confirmOrder = async () => {
  await addDoc(collection(db, "orders"), {
    items: cart,
    createdAt: serverTimestamp()
  });

  cart = {};
  updateCartDisplay();
  closeOrderModal();
};

// ─────────────────────────────────────────
// ✅ ADMIN FIX (THIS FIXES YOUR ISSUE)
// ─────────────────────────────────────────

// OPEN LOGIN
window.openAdminLogin = function () {
  document.getElementById("admin-login-modal").style.display = "flex";
};

// CLOSE LOGIN
window.closeAdminLogin = function () {
  document.getElementById("admin-login-modal").style.display = "none";
};

// CHECK PASSWORD
window.checkAdminLogin = function () {
  const input = document.getElementById("admin-password-input").value;

  if (input === ADMIN_PASSWORD) {
    closeAdminLogin();

    document.getElementById("kiosk-view").style.display = "none";
    document.getElementById("admin-view").style.display = "block";

    switchTab("inventory");
  } else {
    document.getElementById("login-error").style.display = "block";
  }
};

// EXIT ADMIN
window.exitAdmin = function () {
  document.getElementById("admin-view").style.display = "none";
  document.getElementById("kiosk-view").style.display = "block";
};

// SWITCH TAB (FIX MOBILE ISSUE)
window.switchTab = function (tab) {
  document.querySelectorAll(".tab-btn")
    .forEach(b => b.classList.remove("active"));

  document.querySelectorAll(".admin-section")
    .forEach(s => s.style.display = "none");

  if (tab === "inventory") {
    document.querySelectorAll(".tab-btn")[0].classList.add("active");
    document.getElementById("tab-inventory").style.display = "block";
  }

  if (tab === "orders") {
    document.querySelectorAll(".tab-btn")[1].classList.add("active");
    document.getElementById("tab-orders").style.display = "block";
  }
};

// ─── ADMIN RENDER (BASIC) ─────────────────────────
function renderAdminProducts() {
  const el = document.getElementById("admin-product-list");
  if (!el) return;

  el.innerHTML = products.map(p => `
    <div class="admin-product-row">
      <div>${p.emoji}</div>
      <div>
        <b>${p.name}</b><br>
        <small>${p.unit}</small>
      </div>
      <div>₱${p.price}</div>
    </div>
  `).join('');
}

// ─── BOOT ─────────────────────────
(async () => {
  await seedIfEmpty();
  listenProducts();
})();