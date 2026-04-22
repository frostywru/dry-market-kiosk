// ╔══════════════════════════════════════════════════════════╗
// ║          TINDAHAN NI ALING NENA — app.js                ║
// ║  Firebase Firestore + Kiosk Logic                       ║
// ╚══════════════════════════════════════════════════════════╝

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── PASTE YOUR FIREBASE CONFIG HERE ─────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCg78WsoPWQ--dTunQQNjhJGf7cpO6wpP4",
  authDomain: "dry-market-kiosk-f1e5e.firebaseapp.com",
  projectId: "dry-market-kiosk-f1e5e",
  storageBucket: "dry-market-kiosk-f1e5e.firebasestorage.app",
  messagingSenderId: "145444548340",
  appId: "1:145444548340:web:ee6b8cba9cd0f3df0ff8a1",
  measurementId: "G-D2D2DFQE83"
};
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "admin1234"; // ← CHANGE THIS

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════
let products = [];       // [{id, name, unit, price, emoji}, ...]
let cart     = {};       // { productId: qty }

// ════════════════════════════════════════════════════════════
//  INIT — seed default products if collection is empty
// ════════════════════════════════════════════════════════════
const DEFAULT_PRODUCTS = [
  { name: "Garlic",      unit: "per kilo",   price: 80,  emoji: "🧄" },
  { name: "Onion",       unit: "per kilo",   price: 90,  emoji: "🧅" },
  { name: "Tomato",      unit: "per kilo",   price: 60,  emoji: "🍅" },
  { name: "Ginger",      unit: "per kilo",   price: 120, emoji: "🫚" },
  { name: "Potato",      unit: "per kilo",   price: 75,  emoji: "🥔" },
  { name: "Carrot",      unit: "per kilo",   price: 70,  emoji: "🥕" },
  { name: "Cabbage",     unit: "per head",   price: 40,  emoji: "🥬" },
  { name: "Sitaw",       unit: "per bundle", price: 20,  emoji: "🫘" },
  { name: "Kangkong",    unit: "per bundle", price: 15,  emoji: "🌿" },
  { name: "Ampalaya",    unit: "per piece",  price: 25,  emoji: "🥒" },
];

async function seedIfEmpty() {
  const snap = await getDocs(collection(db, "products"));
  if (snap.empty) {
    for (const p of DEFAULT_PRODUCTS) {
      await addDoc(collection(db, "products"), p);
    }
  }
}

// ════════════════════════════════════════════════════════════
//  REAL-TIME PRODUCT LISTENER
// ════════════════════════════════════════════════════════════
function listenProducts() {
  onSnapshot(collection(db, "products"), (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.name.localeCompare(b.name));
    renderProductGrid();
    renderAdminProducts();
  });
}

// ════════════════════════════════════════════════════════════
//  RENDER — KIOSK PRODUCT GRID
// ════════════════════════════════════════════════════════════
function renderProductGrid() {
  const grid = document.getElementById("product-grid");
  if (!products.length) {
    grid.innerHTML = `<div class="loading-spinner">No products yet.</div>`;
    return;
  }
  grid.innerHTML = products.map(p => {
    const qty = cart[p.id] || 0;
    return `
    <div class="product-card" id="card-${p.id}">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-unit">${p.unit}</div>
      <div class="product-price">₱${Number(p.price).toFixed(2)}</div>
      <div class="qty-controls">
        <button class="qty-btn minus" onclick="changeQty('${p.id}', -1)" ${qty===0?'disabled':''}>−</button>
        <span class="qty-value" id="qty-${p.id}">${qty}</span>
        <button class="qty-btn plus" onclick="changeQty('${p.id}', 1)">+</button>
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════════════════════
//  CART LOGIC
// ════════════════════════════════════════════════════════════
window.changeQty = function(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  updateCartDisplay();
  updateProductCard(id);
};

function updateProductCard(id) {
  const qty = cart[id] || 0;
  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) {
    qtyEl.textContent = qty;
    const minusBtn = qtyEl.previousElementSibling;
    if (minusBtn) minusBtn.disabled = qty === 0;
  }
}

function updateCartDisplay() {
  const cartItemsEl = document.getElementById("cart-items");
  const totalEl     = document.getElementById("cart-total");
  const orderBtn    = document.getElementById("order-btn");

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
        <div class="cart-item-qty">${qty} × ₱${Number(p.price).toFixed(2)}</div>
      </div>
      <span class="cart-item-price">₱${sub.toFixed(2)}</span>
      <button class="cart-item-remove" onclick="removeFromCart('${id}')" title="Remove">✕</button>
    </div>`;
  }).join('');

  totalEl.textContent  = `₱${total.toFixed(2)}`;
  orderBtn.disabled    = false;
}

window.removeFromCart = function(id) {
  delete cart[id];
  updateCartDisplay();
  updateProductCard(id);
};

window.clearCart = function() {
  const ids = Object.keys(cart);
  cart = {};
  updateCartDisplay();
  ids.forEach(updateProductCard);
};

// ════════════════════════════════════════════════════════════
//  ORDER MODAL
// ════════════════════════════════════════════════════════════
window.openOrderModal = function() {
  const entries = Object.entries(cart);
  let total = 0;
  document.getElementById("receipt-items").innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    if (!p) return '';
    const sub = p.price * qty;
    total += sub;
    return `
    <div class="receipt-item-row">
      <span>${p.emoji} ${p.name} × ${qty}</span>
      <span>₱${sub.toFixed(2)}</span>
    </div>`;
  }).join('');
  document.getElementById("receipt-total").textContent = `₱${total.toFixed(2)}`;
  document.getElementById("customer-name").value = "";
  document.getElementById("order-modal").style.display = "flex";
};

window.closeOrderModal = function() {
  document.getElementById("order-modal").style.display = "none";
};

window.confirmOrder = async function() {
  const name  = document.getElementById("customer-name").value.trim() || "Walk-in Customer";
  const entries = Object.entries(cart);
  let total = 0;
  const items = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    const sub = p ? p.price * qty : 0;
    total += sub;
    return { name: p?.name, emoji: p?.emoji, qty, unitPrice: p?.price, subtotal: sub };
  });

  try {
    await addDoc(collection(db, "orders"), {
      customer: name,
      items,
      total,
      createdAt: serverTimestamp()
    });

    closeOrderModal();
    document.getElementById("success-msg").textContent =
      `Order for ${name} totaling ₱${total.toFixed(2)} has been placed.`;
    document.getElementById("success-modal").style.display = "flex";
    window.clearCart();
  } catch (e) {
    alert("Error saving order. Check your Firebase config.");
    console.error(e);
  }
};

window.closeSuccessModal = function() {
  document.getElementById("success-modal").style.display = "none";
};

// ════════════════════════════════════════════════════════════
//  ADMIN LOGIN
// ════════════════════════════════════════════════════════════
window.openAdminLogin = function() {
  document.getElementById("admin-password-input").value = "";
  document.getElementById("login-error").style.display = "none";
  document.getElementById("admin-login-modal").style.display = "flex";
  setTimeout(() => document.getElementById("admin-password-input").focus(), 100);
};
window.closeAdminLogin = function() {
  document.getElementById("admin-login-modal").style.display = "none";
};
window.checkAdminLogin = function() {
  const pw = document.getElementById("admin-password-input").value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById("admin-login-modal").style.display = "none";
    enterAdmin();
  } else {
    document.getElementById("login-error").style.display = "block";
  }
};

// ════════════════════════════════════════════════════════════
//  ADMIN VIEW
// ════════════════════════════════════════════════════════════
function enterAdmin() {
  document.getElementById("kiosk-view").style.display = "none";
  document.getElementById("admin-view").style.display = "block";
  loadAdminOrders();
}
window.exitAdmin = function() {
  document.getElementById("admin-view").style.display = "none";
  document.getElementById("kiosk-view").style.display = "block";
};

window.switchTab = function(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
  document.getElementById("tab-inventory").style.display = tab === "inventory" ? "block" : "none";
  document.getElementById("tab-orders").style.display    = tab === "orders"    ? "block" : "none";
  if (tab === "orders") loadAdminOrders();
};

// ─── ADMIN PRODUCT LIST ───────────────────────────────────
function renderAdminProducts() {
  const list = document.getElementById("admin-product-list");
  if (!list) return;
  if (!products.length) {
    list.innerHTML = `<div class="loading-spinner">No products.</div>`;
    return;
  }
  list.innerHTML = products.map(p => `
    <div class="admin-product-row">
      <span class="admin-product-emoji">${p.emoji}</span>
      <div class="admin-product-info">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-unit">${p.unit}</div>
      </div>
      <div class="admin-product-price">₱${Number(p.price).toFixed(2)}</div>
      <div class="admin-row-btns">
        <button class="edit-btn" onclick="openEditProduct('${p.id}')">✏ Edit</button>
        <button class="delete-btn" onclick="deleteProduct('${p.id}', '${p.name}')">🗑 Delete</button>
      </div>
    </div>`).join('');
}

// ─── PRODUCT MODAL (Add / Edit) ───────────────────────────
window.openAddProduct = function() {
  document.getElementById("product-modal-title").textContent = "Add Product";
  document.getElementById("edit-product-id").value   = "";
  document.getElementById("product-name-input").value  = "";
  document.getElementById("product-unit-input").value  = "";
  document.getElementById("product-price-input").value = "";
  document.getElementById("product-emoji-input").value = "";
  document.getElementById("product-form-error").style.display = "none";
  document.getElementById("product-modal").style.display = "flex";
};

window.openEditProduct = function(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById("product-modal-title").textContent = "Edit Product";
  document.getElementById("edit-product-id").value   = id;
  document.getElementById("product-name-input").value  = p.name;
  document.getElementById("product-unit-input").value  = p.unit;
  document.getElementById("product-price-input").value = p.price;
  document.getElementById("product-emoji-input").value = p.emoji;
  document.getElementById("product-form-error").style.display = "none";
  document.getElementById("product-modal").style.display = "flex";
};

window.closeProductModal = function() {
  document.getElementById("product-modal").style.display = "none";
};

window.saveProduct = async function() {
  const id    = document.getElementById("edit-product-id").value;
  const name  = document.getElementById("product-name-input").value.trim();
  const unit  = document.getElementById("product-unit-input").value.trim();
  const price = parseFloat(document.getElementById("product-price-input").value);
  const emoji = document.getElementById("product-emoji-input").value.trim() || "🛒";

  if (!name || !unit || isNaN(price) || price < 0) {
    document.getElementById("product-form-error").style.display = "block";
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, "products", id), { name, unit, price, emoji });
    } else {
      await addDoc(collection(db, "products"), { name, unit, price, emoji });
    }
    closeProductModal();
  } catch (e) {
    alert("Error saving product.");
    console.error(e);
  }
};

window.deleteProduct = async function(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (e) {
    alert("Error deleting product.");
    console.error(e);
  }
};

// ─── ADMIN ORDERS ─────────────────────────────────────────
async function loadAdminOrders() {
  const list = document.getElementById("admin-orders-list");
  list.innerHTML = `<div class="loading-spinner">Loading orders…</div>`;
  try {
    const q    = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    document.getElementById("orders-count").textContent = `${snap.size} order${snap.size!==1?'s':''}`;

    if (snap.empty) {
      list.innerHTML = `<div class="no-orders">📋 No orders yet.</div>`;
      return;
    }
    list.innerHTML = snap.docs.map(d => {
      const o = d.data();
      const dateStr = o.createdAt?.toDate
        ? o.createdAt.toDate().toLocaleString("en-PH", { dateStyle:"medium", timeStyle:"short" })
        : "—";
      const itemLines = (o.items || []).map(i =>
        `${i.emoji || ''} ${i.name} × ${i.qty} — ₱${Number(i.subtotal).toFixed(2)}`
      ).join("<br>");
      return `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div class="order-card-name">👤 ${o.customer}</div>
            <div class="order-card-meta">🕐 ${dateStr}</div>
          </div>
          <div class="order-card-total">₱${Number(o.total).toFixed(2)}</div>
        </div>
        <div class="order-card-items">${itemLines}</div>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = `<div class="no-orders">Error loading orders.</div>`;
    console.error(e);
  }
}

// ════════════════════════════════════════════════════════════
//  BOOTSTRAP
// ════════════════════════════════════════════════════════════
(async () => {
  try {
    await seedIfEmpty();
    listenProducts();
  } catch (e) {
    console.error("Firebase init error:", e);
    document.getElementById("product-grid").innerHTML =
      `<div class="loading-spinner" style="color:#e74c3c">
        ⚠️ Could not connect to database.<br>
        Please check your Firebase config in <code>app.js</code>.
      </div>`;
  }
})();