import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, doc, onSnapshot
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
   LOAD PRODUCTS
======================= */
function loadProducts() {
  onSnapshot(collection(db, "products"), (snapshot) => {
    products = [];

    document.getElementById("products").innerHTML = "";
    document.getElementById("adminProducts").innerHTML = "";

    snapshot.forEach((docSnap) => {
      let data = docSnap.data();
      data.id = docSnap.id;
      products.push(data);

      // KIOSK
      document.getElementById("products").innerHTML += `
        <div class="item">
          <h3>${data.name}</h3>
          <p>₱${data.price} / kg</p>

          <input type="number" step="0.01" id="w-${data.id}" placeholder="kg (e.g. 0.3)">

          <div class="quick-buttons">
            <button onclick="quickAdd('${data.id}', 0.1)">100g</button>
            <button onclick="quickAdd('${data.id}', 0.25)">250g</button>
            <button onclick="quickAdd('${data.id}', 0.5)">500g</button>
            <button onclick="quickAdd('${data.id}', 1)">1kg</button>
          </div>

          <button onclick="addWeighted('${data.id}')">Add</button>
        </div>
      `;

      // ADMIN
      document.getElementById("adminProducts").innerHTML += `
        <div class="item">
          <h3>${data.name}</h3>
          <input type="number" id="price-${data.id}" value="${data.price}">
          <button onclick="updatePrice('${data.id}')">Update</button>
        </div>
      `;
    });
  });
}

/* =======================
   QUICK ADD
======================= */
window.quickAdd = (id, weight) => {
  let p = products.find(x => x.id === id);

  cart.push({
    name: p.name,
    weight,
    price: p.price * weight
  });

  renderCart();
};

/* =======================
   MANUAL ADD
======================= */
window.addWeighted = (id) => {
  let p = products.find(x => x.id === id);
  let weight = parseFloat(document.getElementById("w-" + id).value);

  if (!weight || weight <= 0) {
    alert("Invalid weight");
    return;
  }

  cart.push({
    name: p.name,
    weight,
    price: p.price * weight
  });

  renderCart();
};

/* =======================
   CART RENDER
======================= */
function renderCart() {
  let html = "";
  let total = 0;

  cart.forEach(i => {
    html += `
      <div>
        ${i.name} - ${i.weight}kg = ₱${i.price.toFixed(2)}
      </div>
    `;
    total += i.price;
  });

  document.getElementById("cartItems").innerHTML = html;
  document.getElementById("total").innerText = total.toFixed(2);
}

/* =======================
   CHECKOUT (FIXED)
======================= */
window.checkout = async () => {
  if (cart.length === 0) return alert("Cart is empty");

  let snapshotCart = [...cart]; // IMPORTANT FIX
  let total = snapshotCart.reduce((a, b) => a + b.price, 0);
  let name = document.getElementById("customerName").value;

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
   RECEIPT (FIXED)
======================= */
function showReceipt(items, name, total) {
  let html = "";

  items.forEach(i => {
    html += `<p>${i.name} (${i.weight}kg) - ₱${i.price.toFixed(2)}</p>`;
  });

  document.getElementById("receipt").innerHTML = `
    <p><b>Name:</b> ${name || "Guest"}</p>
    ${html}
    <h3>Total: ₱${total.toFixed(2)}</h3>
  `;

  document.getElementById("receiptModal").classList.remove("hidden");
}

window.closeReceipt = () => {
  document.getElementById("receiptModal").classList.add("hidden");
};

/* =======================
   ADMIN
======================= */
window.updatePrice = async (id) => {
  let price = document.getElementById("price-" + id).value;

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
      let o = d.data();

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
   ADMIN TOGGLE
======================= */
window.toggleAdmin = () => {
  document.getElementById("kiosk").classList.toggle("hidden");
  document.getElementById("admin").classList.toggle("hidden");
};

/* =======================
   INIT
======================= */
loadProducts();
loadOrders();