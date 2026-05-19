import {
  auth, db, $, onAuthStateChanged, collection, query, where, orderBy, onSnapshot,
  getDoc, doc, addDoc, serverTimestamp, safeText
} from "./app-core.js";

let currentUser = null;
let currentProfile = null;
let products = [];

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  currentProfile = null;
  if (user) {
    const snap = await getDoc(doc(db, "users", user.uid));
    currentProfile = snap.exists() ? snap.data() : null;
  }
  renderStatus();
  renderProducts();
});

const productsQuery = query(collection(db, "products"), where("active", "==", true), orderBy("createdAt", "desc"));
onSnapshot(productsQuery, (snapshot) => {
  products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  renderProducts();
});

function renderStatus() {
  const box = $("shopStatus");
  if (!currentUser) {
    box.className = "status warn";
    box.textContent = "Browse products freely. Log in to order.";
    return;
  }
  if (!currentProfile || currentProfile.membershipStatus !== "approved") {
    box.className = "status warn";
    box.textContent = "Your membership is not approved yet. You can browse, but checkout is locked.";
    return;
  }
  box.className = "status ok";
  box.textContent = `Approved member. Use code ${currentProfile.memberCode} to place orders.`;
}

function renderProducts() {
  const grid = $("productsGrid");
  if (!products.length) {
    grid.innerHTML = `<div class="empty">No products have been created yet.</div>`;
    return;
  }
  grid.innerHTML = products.map((product) => {
    const canOrder = currentUser && currentProfile?.membershipStatus === "approved";
    return `
      <article class="product-card">
        <div class="product-visual">${safeText(product.icon || "🧱")}</div>
        <div class="spread"><h3>${safeText(product.name)}</h3><span class="price-free">FREE</span></div>
        <div class="muted">${safeText(product.description || "No description")}</div>
        <small>Category: ${safeText(product.category || "General")}</small>
        ${canOrder ? `
          <form class="form-grid order-form" data-product-id="${safeText(product.id)}">
            <label>Quantity <input name="quantity" type="number" min="1" max="20" value="1" required /></label>
            <label>Member code <input name="memberCode" required placeholder="Your approved code" /></label>
            <label>Notes <textarea name="notes" maxlength="300" placeholder="Color, size, pickup note..."></textarea></label>
            <button class="btn btn-primary" type="submit">Place Order</button>
          </form>` : `<a class="btn" href="login.html">Log in / request approval</a>`}
      </article>`;
  }).join("");

  document.querySelectorAll(".order-form").forEach((form) => {
    form.addEventListener("submit", placeOrder);
  });
}

async function placeOrder(event) {
  event.preventDefault();
  if (!currentUser || currentProfile?.membershipStatus !== "approved") {
    alert("Approval required before ordering.");
    return;
  }

  const form = event.currentTarget;
  const product = products.find((item) => item.id === form.dataset.productId);
  const data = new FormData(form);
  const memberCode = String(data.get("memberCode") || "").trim().toUpperCase();
  const quantity = Number(data.get("quantity") || 1);
  const notes = String(data.get("notes") || "").trim();

  if (memberCode !== String(currentProfile.memberCode || "").toUpperCase()) {
    alert("That code does not match your approved member code.");
    return;
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    alert("Quantity must be from 1 to 20.");
    return;
  }

  await addDoc(collection(db, "orders"), {
    userId: currentUser.uid,
    userName: currentProfile.name,
    userEmail: currentProfile.email,
    memberCode,
    productId: product.id,
    productName: product.name,
    quantity,
    notes,
    status: "ordered",
    createdAt: serverTimestamp()
  });

  form.reset();
  alert("Order placed and saved.");
}
