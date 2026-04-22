import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ─── FIREBASE ─────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCg78WsoPWQ--dTunQQNjhJGf7cpO6wpP4",
  authDomain: "dry-market-kiosk-f1e5e.firebaseapp.com",
  projectId: "dry-market-kiosk-f1e5e",
  storageBucket: "dry-market-kiosk-f1e5e.firebasestorage.app",
  messagingSenderId: "145444548340",
  appId: "1:145444548340:web:ee6b8cba9cd0f3df0ff8a1",
  measurementId: "G-D2D2DFQE83"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];
let products = [];

/* =======================
   LOAD PRODUCTS (FIXED UI)
======================= */
function loadProducts() {
  onSnapshot(collection(db, "products"), (snapshot) => {
    products = [];

    const grid = document.getElementById("products");
    const adminGrid = document.getElementById("adminProducts");

    grid.innerHTML = "";
    adminGrid.innerHTML = "";

    snapshot.forEach((docSnap) => {
      let data = docSnap.data();
      data.id = docSnap.id;
      products.push(data);

      // ─── KIOSK ITEM ─────────────────────
      grid.innerHTML += `
        <div class="item">
          <h3>${data.name}</h3>
          <p>₱${data.price} / kg</p>

          <input type="number"
                 step="0.01"
                 id="w-${data.id}"
                 placeholder="kg (e.g. 0.3)">

          <button onclick="addToCart('${data.id}')">
            Add to Basket
          </button>
        </div>
      `;

      // ─── ADMIN ITEM ─────────────────────
      adminGrid.innerHTML += `
        <div class="item">
          <h3>${data.name}</h3>

          <input type="number"
                 id="price-${data.id}"
                 value="${data.price}">

          <button onclick="updatePrice('${data.id}')">
            Update Price
          </button>
        </div>
      `;
    });
  });
}

/* =======================
   ADD TO CART (WEIGHT SYSTEM)
======================= */
window.addToCart = (id) => {
  const product = products.find(p => p.id === id);
  const input = document.getElementById("w-" + id);

  const weight = parseFloat(input.value);

  if (!weight || weight <= 0) {
    alert("Enter valid weight (e.g. 0.3 kg)");
    return;
  }

  const price = product.price * weight;

  cart.push({
    name: product.name,
    weight,
    price
  });

  input.value = "";
  renderCart();
};

/* =======================
   CART RENDER (FIXED FOR YOUR HTML)
======================= */
function renderCart() {
  const cartUI = document.getElementById("cart-items");
  const totalUI = document.getElementById("cart-total");

  let html = "";
  let total = 0;

  if (cart.length === 0) {
    cartUI.innerHTML = `
      <div class="empty-cart">
        <span>🥬</span>
        <p>Add items to your basket</p>
      </div>
    `;
    totalUI.textContent = "₱0.00";
    return;
  }

  cart.forEach(item => {
    html += `
      <div class="cart-item">
        <span>${item.name} (${item.weight} kg)</span>
        <span>₱${item.price.toFixed(2)}</span>
      </div>
    `;
    total += item.price;
  });

  cartUI.innerHTML = html;
  totalUI.textContent = `₱${total.toFixed(2)}`;
}

/* =======================
   CLEAR CART
======================= */
window.clearCart = () => {
  cart = [];
  renderCart();
};

/* =======================
   CHECKOUT
======================= */
window.checkout = async () => {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const snapshotCart = [...cart];
  const total = snapshotCart.reduce((a, b) => a + b.price, 0);
  const name = document.getElementById("customer-name").value;

  await addDoc(collection(db, "orders"), {
    items: snapshotCart,
    total,
    customerName: name,
    timestamp: Date.now()
  });

  showReceipt(snapshotCart, name, total);

  cart = [];
  renderCart();
};

/* =======================
   RECEIPT
======================= */
function showReceipt(items, name, total) {
  let html = "";

  items.forEach(i => {
    html += `
      <p>${i.name} (${i.weight} kg) - ₱${i.price.toFixed(2)}</p>
    `;
  });

  document.getElementById("receipt-items").innerHTML = html;
  document.getElementById("receipt-total").textContent = `₱${total.toFixed(2)}`;

  document.getElementById("order-modal").style.display = "flex";
}

/* =======================
   MODALS
======================= */
window.openOrderModal = () => {
  document.getElementById("order-modal").style.display = "flex";
};

window.closeOrderModal = () => {
  document.getElementById("order-modal").style.display = "none";
};

window.closeReceipt = () => {
  document.getElementById("order-modal").style.display = "none";
};

/* =======================
   ADMIN TOGGLE (FIXED)
======================= */
window.toggleAdmin = () => {
  document.getElementById("kiosk-view").classList.toggle("hidden");
  document.getElementById("admin-view").classList.toggle("hidden");
};

/* =======================
   UPDATE PRICE
======================= */
window.updatePrice = async (id) => {
  const price = document.getElementById("price-" + id).value;

  await updateDoc(doc(db, "products", id), {
    price: Number(price)
  });
};

/* =======================
   ORDERS
======================= */
function loadOrders() {
  onSnapshot(collection(db, "orders"), (snapshot) => {
    let html = "";

    snapshot.forEach(d => {
      const o = d.data();

      html += `
        <div class="item">
          <p>${o.customerName || "Guest"}</p>
          <p>₱${o.total.toFixed(2)}</p>
        </div>
      `;
    });

    document.getElementById("orders").innerHTML = html;
  });
}

/* =======================
   INIT
======================= */
loadProducts();
loadOrders();