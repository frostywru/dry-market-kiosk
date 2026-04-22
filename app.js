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

// ─── PRODUCTS LISTENER ─────────────────────────
function listenProducts() {
  onSnapshot(collection(db, "products"), (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProductGrid();
    renderAdminProducts();
  });
}

// ─── PRODUCT GRID (KIOSK) ─────────────────────────
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

// ─── FIXED CART UPDATE (IMPORTANT) ─────────────────────────
function updateCart() {
  const el = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const orderBtn = document.getElementById("order-btn");

  if (!cart.length) {
    el.innerHTML = `<div class="empty-cart"><span>🥬</span><p>Add items to your basket</p></div>`;
    totalEl.innerText = "₱0.00";
    orderBtn.disabled = true;
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
        <span>₱${sub.toFixed(2)}</span>
      </div>
    `;
  }).join('');

  totalEl.innerText = "₱" + total.toFixed(2);
  orderBtn.disabled = false;
}

// ─── 🧹 CLEAR BASKET (FIXED) ─────────────────────────
window.clearCart = function () {
  cart = [];
  updateCart();
};

// ─── 🧾 ORDER MODAL ─────────────────────────
window.openOrderModal = function () {
  if (!cart.length) return;

  const modal = document.getElementById("order-modal");
  const receipt = document.getElementById("receipt-items");
  const totalEl = document.getElementById("receipt-total");

  let total = 0;

  receipt.innerHTML = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    const sub = p.price * item.qty;
    total += sub;

    return `
      <div class="receipt-item-row">
        <span>${p.emoji} ${p.name} × ${item.qty}kg</span>
        <span>₱${sub.toFixed(2)}</span>
      </div>
    `;
  }).join('');

  totalEl.innerText = "₱" + total.toFixed(2);

  modal.style.display = "flex";
};

window.closeOrderModal = function () {
  document.getElementById("order-modal").style.display = "none";
};

// ─── ✅ CONFIRM ORDER (NOW WORKING) ─────────────────────────
window.confirmOrder = async function () {
  const name = document.getElementById("customer-name").value;

  let total = 0;

  const items = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    const sub = p.price * item.qty;
    total += sub;

    return {
      id: item.id,
      name: p.name,
      emoji: p.emoji,
      qty: item.qty,
      subtotal: sub.toFixed(2)
    };
  });

  await addDoc(collection(db, "orders"), {
    customer: name || "Walk-in",
    items,
    total: total.toFixed(2),
    createdAt: serverTimestamp()
  });

  cart = [];
  updateCart();
  closeOrderModal();

  document.getElementById("success-msg").innerText =
    `Thank you ${name || "Customer"}!`;

  document.getElementById("success-modal").style.display = "flex";
};

// ─── SUCCESS MODAL ─────────────────────────
window.closeSuccessModal = function () {
  document.getElementById("success-modal").style.display = "none";
};

// ─── ADMIN LOGIN ─────────────────────────
window.openAdminLogin = function () {
  document.getElementById("admin-login-modal").style.display = "flex";
};

window.closeAdminLogin = function () {
  document.getElementById("admin-login-modal").style.display = "none";
};

window.checkAdminLogin = function () {
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

window.exitAdmin = function () {
  document.getElementById("admin-view").style.display = "none";
  document.getElementById("kiosk-view").style.display = "block";
};

// ─── TABS ─────────────────────────
window.switchTab = function (tab) {
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
      <div class="admin-product-emoji">${p.emoji}</div>

      <div class="admin-product-info">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-unit">${p.unit}</div>
      </div>

      <div class="admin-product-price">₱${p.price}</div>

      <div class="admin-row-btns">
        <button class="edit-btn" onclick="editProduct('${p.id}')">Edit</button>
        <button class="delete-btn" onclick="deleteProduct('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// ─── EDIT PRODUCT ─────────────────────────
window.editProduct = function (id) {
  const p = products.find(x => x.id === id);

  document.getElementById("edit-product-id").value = id;
  document.getElementById("product-name-input").value = p.name;
  document.getElementById("product-unit-input").value = p.unit;
  document.getElementById("product-price-input").value = p.price;
  document.getElementById("product-emoji-input").value = p.emoji;

  document.getElementById("product-modal").style.display = "flex";
};

// ─── DELETE PRODUCT ─────────────────────────
window.deleteProduct = async function (id) {
  if (!confirm("Delete this product?")) return;
  await deleteDoc(doc(db, "products", id));
};

// ─── SAVE PRODUCT ─────────────────────────
window.saveProduct = async function () {
  const id = document.getElementById("edit-product-id").value;

  const data = {
    name: document.getElementById("product-name-input").value,
    unit: document.getElementById("product-unit-input").value,
    price: parseFloat(document.getElementById("product-price-input").value),
    emoji: document.getElementById("product-emoji-input").value
  };

  if (id) {
    await updateDoc(doc(db, "products", id), data);
  } else {
    await addDoc(collection(db, "products"), data);
  }

  closeProductModal();
};

// ─── MODAL CLOSE ─────────────────────────
window.closeProductModal = function () {
  document.getElementById("product-modal").style.display = "none";
};

// ─── ORDERS ─────────────────────────
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

// ─── VIEW ORDER ─────────────────────────
window.viewOrder = async function (id) {
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

      ${o.items.map(i => `
        <div class="receipt-item-row">
          <span>${i.emoji} ${i.name} × ${i.qty}kg</span>
          <span>₱${i.subtotal}</span>
        </div>
      `).join('')}

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
  await getDocs(collection(db, "products"));
  listenProducts();
  listenOrders();
})();