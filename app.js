import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ───────────────────────── FIREBASE ─────────────────────────
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

// ───────────────────────── STATE ─────────────────────────
let products = [];
let cart = {};

// ───────────────────────── DEFAULT DATA ─────────────────────────
const DEFAULT_PRODUCTS = [
  { name: "Garlic", unit: "per kilo", price: 80, emoji: "🧄" },
  { name: "Onion", unit: "per kilo", price: 90, emoji: "🧅" },
  { name: "Tomato", unit: "per kilo", price: 60, emoji: "🍅" },
  { name: "Potato", unit: "per kilo", price: 75, emoji: "🥔" }
];

// ───────────────────────── INIT SAFE START ─────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ App initialized");

  await seedIfEmpty();
  listenProducts();

  updateCartDisplay();
});

// ───────────────────────── FIREBASE SEED ─────────────────────────
async function seedIfEmpty() {
  const snap = await getDocs(collection(db, "products"));
  if (snap.empty) {
    for (const p of DEFAULT_PRODUCTS) {
      await addDoc(collection(db, "products"), p);
    }
  }
}

// ───────────────────────── REALTIME PRODUCTS ─────────────────────────
function listenProducts() {
  onSnapshot(collection(db, "products"), (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProductGrid();
  });
}

// ───────────────────────── PRODUCT UI ─────────────────────────
function renderProductGrid() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `<div class="loading-spinner">Loading products...</div>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-unit">${p.unit}</div>
      <div class="product-price">₱${p.price}</div>

      <div class="kg-controls">
        <input type="number" min="0" step="0.1" id="kg-${p.id}" class="kg-input" placeholder="kg">
        <button class="add-cart-btn" onclick="addKgToCart('${p.id}')">Add</button>
      </div>
    </div>
  `).join('');
}

// ───────────────────────── CART ─────────────────────────
function addKgToCart(id) {
  const input = document.getElementById(`kg-${id}`);
  const value = parseFloat(input?.value);

  if (!value || value <= 0) return;

  cart[id] = (cart[id] || 0) + value;
  input.value = "";

  updateCartDisplay();
}

function updateCartDisplay() {
  const cartEl = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  if (!cartEl || !totalEl) return;

  let total = 0;

  const html = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    if (!p) return "";

    const sub = p.price * qty;
    total += sub;

    return `
      <div class="cart-item">
        <span>${p.emoji} ${p.name}</span>
        <span>${qty} kg</span>
        <span>₱${sub.toFixed(2)}</span>
        <button onclick="removeFromCart('${id}')">✕</button>
      </div>
    `;
  }).join("");

  cartEl.innerHTML = html || `<div class="empty-cart">Empty cart</div>`;
  totalEl.textContent = `₱${total.toFixed(2)}`;
}

// ───────────────────────── CART ACTIONS ─────────────────────────
function removeFromCart(id) {
  delete cart[id];
  updateCartDisplay();
}

function clearCart() {
  cart = {};
  updateCartDisplay();
}

// ───────────────────────── ADMIN FIX (IMPORTANT) ─────────────────────────
function openAdminLogin() {
  console.log("🔐 Admin clicked");

  const modal = document.getElementById("admin-login-modal");
  if (!modal) return console.error("Admin modal not found");

  modal.style.display = "flex";
}

function closeAdminLogin() {
  document.getElementById("admin-login-modal").style.display = "none";
}

function checkAdminLogin() {
  const pass = document.getElementById("admin-password-input").value;

  if (pass === ADMIN_PASSWORD) {
    document.getElementById("admin-login-modal").style.display = "none";
    document.getElementById("kiosk-view").style.display = "none";
    document.getElementById("admin-view").style.display = "block";
  } else {
    document.getElementById("login-error").style.display = "block";
  }
}

function exitAdmin() {
  document.getElementById("admin-view").style.display = "none";
  document.getElementById("kiosk-view").style.display = "block";
}

// ───────────────────────── GLOBAL EXPORTS (CRITICAL FIX) ─────────────────────────
window.openAdminLogin = openAdminLogin;
window.closeAdminLogin = closeAdminLogin;
window.checkAdminLogin = checkAdminLogin;
window.exitAdmin = exitAdmin;

window.addKgToCart = addKgToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;