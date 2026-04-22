import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, updateDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCg78WsoPWQ--dTunQQNjhJGf7cpO6wpP4",
  authDomain: "dry-market-kiosk-f1e5e.firebaseapp.com",
  projectId: "dry-market-kiosk-f1e5e",
  storageBucket: "dry-market-kiosk-f1e5e.firebasestorage.app",
  messagingSenderId: "145444548340",
  appId: "1:145444548340:web:ee6b8cba9cd0f3df0ff8a1",
  measurementId: "G-D2D2DFQE83"
};;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];
let products = [];

// LOAD PRODUCTS LIVE
function loadProducts() {
  onSnapshot(collection(db, "products"), (snapshot) => {
    products = [];
    document.getElementById("products").innerHTML = "";
    document.getElementById("adminProducts").innerHTML = "";

    snapshot.forEach((docSnap) => {
      let data = docSnap.data();
      data.id = docSnap.id;
      products.push(data);

      // kiosk UI
      document.getElementById("products").innerHTML += `
        <div class="item">
          <h3>${data.name}</h3>
          <p>₱${data.price}/kg</p>
          <button onclick="addToCart('${data.id}')">Add</button>
        </div>
      `;

      // admin UI
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

// ADD TO CART
window.addToCart = (id) => {
  let item = products.find(p => p.id === id);
  cart.push(item);
  renderCart();
};

function renderCart() {
  let html = "";
  let total = 0;

  cart.forEach(item => {
    html += `<p>${item.name} - ₱${item.price}</p>`;
    total += item.price;
  });

  document.getElementById("cartItems").innerHTML = html;
  document.getElementById("total").innerText = total;
}

// CHECKOUT
window.checkout = async () => {
  let total = cart.reduce((sum, i) => sum + i.price, 0);
  let name = document.getElementById("customerName").value;

  await addDoc(collection(db, "orders"), {
    items: cart,
    total,
    customerName: name,
    timestamp: Date.now()
  });

  showReceipt(name, total);
  cart = [];
  renderCart();
};

// RECEIPT
function showReceipt(name, total) {
  document.getElementById("receipt").innerHTML = `
    <p>Name: ${name || "Guest"}</p>
    <h3>Total: ₱${total}</h3>
  `;
  document.getElementById("receiptModal").classList.remove("hidden");
}

window.closeReceipt = () => {
  document.getElementById("receiptModal").classList.add("hidden");
};

// ADMIN
window.updatePrice = async (id) => {
  let newPrice = document.getElementById("price-" + id).value;

  await updateDoc(doc(db, "products", id), {
    price: Number(newPrice)
  });
};

// LOAD ORDERS
function loadOrders() {
  onSnapshot(collection(db, "orders"), (snapshot) => {
    let html = "";

    snapshot.forEach(docSnap => {
      let o = docSnap.data();
      html += `
        <div class="item">
          <p>${o.customerName || "Guest"}</p>
          <p>Total: ₱${o.total}</p>
        </div>
      `;
    });

    document.getElementById("orders").innerHTML = html;
  });
}

// TOGGLE ADMIN
window.toggleAdmin = () => {
  document.getElementById("kiosk").classList.toggle("hidden");
  document.getElementById("admin").classList.toggle("hidden");
};

loadProducts();
loadOrders();