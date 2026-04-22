import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCg78WsoPWQ--dTunQQNjhJGf7cpO6wpP4",
  authDomain: "dry-market-kiosk-f1e5e.firebaseapp.com",
  projectId: "dry-market-kiosk-f1e5e",
  storageBucket: "dry-market-kiosk-f1e5e.firebasestorage.app",
  messagingSenderId: "145444548340",
  appId: "1:145444548340:web:ee6b8cba9cd0f3df0ff8a1"
};

const ADMIN_PASSWORD = "7602";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let products = [];
let cart = {};

const DEFAULT_PRODUCTS = [
  { name: "Garlic", unit: "per kilo", price: 80, emoji: "🧄" },
  { name: "Onion", unit: "per kilo", price: 90, emoji: "🧅" },
];

async function seedIfEmpty() {
  const snap = await getDocs(collection(db, "products"));
  if (snap.empty) {
    for (const p of DEFAULT_PRODUCTS) {
      await addDoc(collection(db, "products"), p);
    }
  }
}

function listenProducts() {
  onSnapshot(collection(db, "products"), (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProductGrid();
    renderAdminProducts();
  });
}

/* ===================== PRODUCTS ===================== */
function renderProductGrid() {
  const grid = document.getElementById("product-grid");

  grid.innerHTML = products.map(p => {
    const qty = cart[p.id] || 0;

    return `
    <div class="product-card">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">₱${p.price}</div>

      <div class="qty-controls">
        <button onclick="changeQty('${p.id}', -1)" ${qty===0?'disabled':''}>-</button>
        <span>${qty}</span>
        <button onclick="changeQty('${p.id}', 1)">+</button>
      </div>
    </div>
    `;
  }).join("");
}

/* ===================== CART ===================== */
window.changeQty = function(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  updateCart();
};

function updateCart() {
  const el = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const btn = document.getElementById("order-btn");

  let total = 0;

  const items = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    const sub = p.price * qty;
    total += sub;

    return `<div>${p.name} x${qty} = ₱${sub}</div>`;
  });

  el.innerHTML = items.length ? items.join("") : "Empty cart";
  totalEl.textContent = `₱${total}`;
  btn.disabled = !items.length;
}

/* ===================== ORDER ===================== */
window.openOrderModal = function() {
  document.getElementById("order-modal").style.display = "flex";
};

window.closeOrderModal = function() {
  document.getElementById("order-modal").style.display = "none";
};

window.confirmOrder = async function() {
  await addDoc(collection(db, "orders"), {
    cart,
    createdAt: serverTimestamp()
  });

  cart = {};
  updateCart();
  closeOrderModal();

  document.getElementById("success-modal").style.display = "flex";
};

window.closeSuccessModal = function() {
  document.getElementById("success-modal").style.display = "none";
};

/* ===================== ADMIN ===================== */
window.openAdminLogin = () => {
  document.getElementById("admin-login-modal").style.display = "flex";
};

window.closeAdminLogin = () => {
  document.getElementById("admin-login-modal").style.display = "none";
};

window.checkAdminLogin = () => {
  const val = document.getElementById("admin-password-input").value;

  if (val === ADMIN_PASSWORD) {
    document.getElementById("kiosk-view").style.display = "none";
    document.getElementById("admin-view").style.display = "block";
    closeAdminLogin();
  } else {
    alert("Wrong password");
  }
};

window.exitAdmin = () => {
  document.getElementById("admin-view").style.display = "none";
  document.getElementById("kiosk-view").style.display = "block";
};

/* ✅ FIXED TAB SWITCH */
window.switchTab = function(tab, el) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");

  document.getElementById("tab-inventory").style.display = tab === "inventory" ? "block" : "none";
  document.getElementById("tab-orders").style.display = tab === "orders" ? "block" : "none";
};

/* ===================== ADMIN PRODUCTS ===================== */
function renderAdminProducts() {
  const list = document.getElementById("admin-product-list");
  if (!list) return;

  list.innerHTML = products.map(p => `
    <div>
      ${p.name} - ₱${p.price}
      <button onclick="deleteProduct('${p.id}')">Delete</button>
    </div>
  `).join("");
}

window.deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id));
};

/* ===================== INIT ===================== */
(async () => {
  await seedIfEmpty();
  listenProducts();
})();