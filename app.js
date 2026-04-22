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

// ─── FIREBASE ─────────────────────────
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

// ─── PRODUCTS ─────────────────────────
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
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });

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
      </div>
    `;
  }).join('');

  totalEl.innerText = "₱" + total.toFixed(2);
}

// ─── ADMIN LOGIN (FIXED ROBUST) ─────────────────────────
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

// ─── TABS ─────────────────────────
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
    </div>
  `).join('');
}

// ─── ORDERS LIST ─────────────────────────
function listenOrders() {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

  onSnapshot(q, snap => {
    const el = document.getElementById("admin-orders-list");

    if (snap.empty) {
      el.innerHTML = `<div class="no-orders">No orders yet</div>`;
      return;
    }

    el.innerHTML = snap.docs.map(d => {
      const o = d.data();
      const id = d.id;

      return `
        <div class="order-card" onclick="viewOrder('${id}')">
          <div class="order-card-header">
            <div>
              <div class="order-card-name">${o.customer || "Walk-in"}</div>
              <div class="order-card-meta">Tap to view receipt</div>
            </div>
            <div class="order-card-total">₱${o.total}</div>
          </div>
        </div>
      `;
    }).join('');
  });
}

// ─── VIEW FULL ORDER RECEIPT ─────────────────────────
window.viewOrder = async function(id) {
  const ref = doc(db, "orders", id);
  const snap = await getDocs(collection(db, "orders"));

  const orderDoc = snap.docs.find(d => d.id === id);
  const o = orderDoc.data();

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.style.display = "flex";

  modal.innerHTML = `
    <div class="modal-box">
      <h2 class="modal-title">🧾 Receipt</h2>

      <div style="margin-bottom:10px;font-weight:700">
        Customer: ${o.customer || "Walk-in"}
      </div>

      <div>
        ${o.items.map(i => `
          <div class="receipt-item-row">
            <span>${i.emoji} ${i.name} × ${i.qty}kg</span>
            <span>₱${i.subtotal}</span>
          </div>
        `).join('')}
      </div>

      <div class="receipt-total-row">
        <span>Total</span>
        <span>₱${o.total}</span>
      </div>

      <button class="confirm-btn" onclick="this.closest('.modal-overlay').remove()">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(modal);
};

// ─── BOOT ─────────────────────────
(async () => {
  await getDocs(collection(db, "products")); // warm start
  listenProducts();
  listenOrders();
})();