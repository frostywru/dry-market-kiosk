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
          <button class="qty-btn minus"
            onclick="changeQty('${p.id}', -1)"
            ${qty === 0 ? "disabled" : ""}>−</button>

          <span class="qty-value" id="qty-${p.id}">${qty}</span>

          <button class="qty-btn plus"
            onclick="changeQty('${p.id}', 1)">+</button>
        </div>
      </div>
    `;
  }).join("");
}

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
  }
}

function updateCartDisplay() {
  const cartItemsEl = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const orderBtn = document.getElementById("order-btn");

  const entries = Object.entries(cart);

  if (!entries.length) {
    cartItemsEl.innerHTML = `
      <div class="empty-cart">
        <span>🥬</span><p>Add items to your basket</p>
      </div>
    `;
    totalEl.textContent = "₱0.00";
    orderBtn.disabled = true;
    return;
  }

  let total = 0;

  cartItemsEl.innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    if (!p) return "";

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

        <button class="cart-item-remove" onclick="removeFromCart('${id}')">✕</button>
      </div>
    `;
  }).join("");

  totalEl.textContent = `₱${total.toFixed(2)}`;
  orderBtn.disabled = false;
}

window.removeFromCart = function(id) {
  delete cart[id];
  updateCartDisplay();
  updateProductCard(id);
};

window.clearCart = function() {
  cart = {};
  updateCartDisplay();
};

window.openOrderModal = function() {
  const entries = Object.entries(cart);
  let total = 0;

  document.getElementById("receipt-items").innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    if (!p) return "";

    const sub = p.price * qty;
    total += sub;

    return `
      <div class="receipt-item-row">
        <span>${p.emoji} ${p.name} × ${qty}</span>
        <span>₱${sub.toFixed(2)}</span>
      </div>
    `;
  }).join("");

  document.getElementById("receipt-total").textContent = `₱${total.toFixed(2)}`;
  document.getElementById("order-modal").style.display = "flex";
};

window.confirmOrder = async function() {
  const name = document.getElementById("customer-name").value.trim() || "Walk-in Customer";

  const entries = Object.entries(cart);
  let total = 0;

  const items = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    const sub = p.price * qty;
    total += sub;

    return {
      name: p.name,
      emoji: p.emoji,
      qty,
      unitPrice: p.price,
      subtotal: sub
    };
  });

  await addDoc(collection(db, "orders"), {
    customer: name,
    items,
    total,
    createdAt: serverTimestamp()
  });

  alert(`Order placed for ${name} - ₱${total.toFixed(2)}`);

  cart = {};
  updateCartDisplay();
  document.getElementById("order-modal").style.display = "none";
};