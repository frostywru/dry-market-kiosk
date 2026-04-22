import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
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
let cart = [];

// ─── DEFAULT PRODUCTS ─────────────────────────
const DEFAULT_PRODUCTS = [
  { name: "Garlic", unit: "per kilo", price: 80, emoji: "🧄" },
  { name: "Onion", unit: "per kilo", price: 90, emoji: "🧅" },
  { name: "Tomato", unit: "per kilo", price: 60, emoji: "🍅" }
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

// ─── LISTEN PRODUCTS ─────────────────────────
function listenProducts() {
  onSnapshot(collection(db, "products"), (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProductGrid();
    renderAdminProducts();
  });
}

// ─── PRODUCT GRID ─────────────────────────
function renderProductGrid() {
  const grid = document.getElementById("product-grid");

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-unit">${p.unit}</div>
      <div class="product-price">₱${p.price}</div>

      <div class="kg-controls">
        <input type="number" id="kg-${p.id}" class="kg-input" placeholder="kg" step="0.1">
        <button class="add-cart-btn" onclick="addKgToCart('${p.id}')">Add</button>
      </div>
    </div>
  `).join('');
}

// ─── CART ─────────────────────────
window.addKgToCart = function(id) {
  const input = document.getElementById(`kg-${id}`);
  const qty = parseFloat(input.value);

  if (!qty || qty <= 0) return;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty });
  }

  input.value = "";
  updateCart();
};

function updateCart() {
  const el = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  if (!cart.length) {
    el.innerHTML = `<div class="empty-cart">Empty</div>`;
    totalEl.innerText = "₱0.00";
    return;
  }

  let total = 0;

  el.innerHTML = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    const sub = p.price * item.qty;
    total += sub;

    return `
      <div class="cart-item">
        <span>${p.emoji} ${p.name}</span>
        <span>${item.qty}kg</span>
        <span>₱${sub}</span>
        <button onclick="removeItem('${item.id}')">x</button>
      </div>
    `;
  }).join('');

  totalEl.innerText = "₱" + total.toFixed(2);
}

window.removeItem = function(id) {
  cart = cart.filter(i => i.id !== id);
  updateCart();
};

window.clearCart = function() {
  cart = [];
  updateCart();
};

// ─── ADMIN LOGIN ─────────────────────────
window.openAdminLogin = function() {
  document.getElementById("admin-login-modal").style.display = "flex";
};

window.closeAdminLogin = function() {
  document.getElementById("admin-login-modal").style.display = "none";
};

window.checkAdminLogin = function() {
  const pass = document.getElementById("admin-password-input").value;

  if (pass === ADMIN_PASSWORD) {
    closeAdminLogin();
    document.getElementById("kiosk-view").style.display = "none";
    document.getElementById("admin-view").style.display = "block";
    switchTab("inventory");
  } else {
    document.getElementById("login-error").style.display = "block";
  }
};

window.exitAdmin = function() {
  document.getElementById("admin-view").style.display = "none";
  document.getElementById("kiosk-view").style.display = "block";
};

// ─── TABS FIX ─────────────────────────
window.switchTab = function(tab) {
  document.getElementById("tab-inventory").style.display = "none";
  document.getElementById("tab-orders").style.display = "none";

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

  if (tab === "inventory") {
    document.getElementById("tab-inventory").style.display = "block";
    document.querySelectorAll(".tab-btn")[0].classList.add("active");
  } else {
    document.getElementById("tab-orders").style.display = "block";
    document.querySelectorAll(".tab-btn")[1].classList.add("active");
  }
};

// ─── ADMIN PRODUCTS ─────────────────────────
function renderAdminProducts() {
  const el = document.getElementById("admin-product-list");

  el.innerHTML = products.map(p => `
    <div class="admin-product-row">
      <div>${p.emoji}</div>
      <div class="admin-product-info">
        <div>${p.name}</div>
        <small>${p.unit}</small>
      </div>
      <div>₱${p.price}</div>

      <button onclick="editProduct('${p.id}')">Edit</button>
      <button onclick="deleteProduct('${p.id}')">Delete</button>
    </div>
  `).join('');
}

// ─── PRODUCT CRUD ─────────────────────────
window.deleteProduct = async function(id) {
  await deleteDoc(doc(db, "products", id));
};

window.editProduct = function(id) {
  const p = products.find(x => x.id === id);

  document.getElementById("edit-product-id").value = id;
  document.getElementById("product-name-input").value = p.name;
  document.getElementById("product-unit-input").value = p.unit;
  document.getElementById("product-price-input").value = p.price;
  document.getElementById("product-emoji-input").value = p.emoji;

  document.getElementById("product-modal").style.display = "flex";
};

window.openAddProduct = function() {
  document.getElementById("edit-product-id").value = "";
  document.getElementById("product-modal").style.display = "flex";
};

window.closeProductModal = function() {
  document.getElementById("product-modal").style.display = "none";
};

window.saveProduct = async function() {
  const id = document.getElementById("edit-product-id").value;

  const data = {
    name: document.getElementById("product-name-input").value,
    unit: document.getElementById("product-unit-input").value,
    price: Number(document.getElementById("product-price-input").value),
    emoji: document.getElementById("product-emoji-input").value
  };

  if (id) {
    await updateDoc(doc(db, "products", id), data);
  } else {
    await addDoc(collection(db, "products"), data);
  }

  closeProductModal();
};

// ─── ORDERS ─────────────────────────
function listenOrders() {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

  onSnapshot(q, snap => {
    const el = document.getElementById("admin-orders-list");

    el.innerHTML = snap.docs.map(d => {
      const o = d.data();

      return `
        <div class="order-card">
          <div>${o.customer}</div>
          <div>₱${o.total}</div>
        </div>
      `;
    }).join('');
  });
}

// ─── BOOT ─────────────────────────
(async () => {
  await seedIfEmpty();
  listenProducts();
  listenOrders();
})();