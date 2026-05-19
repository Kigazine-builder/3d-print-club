import {
  auth, db, $, ownerEmail, onAuthStateChanged, doc, getDoc, addDoc, collection,
  serverTimestamp, query, where, orderBy, onSnapshot, updateDoc, deleteDoc,
  safeText, readableDate, generateMemberCode, badge, logoutNow
} from "./app-core.js";

$("logoutBtn").addEventListener("click", logoutNow);

function show(id, message, type = "ok") {
  const el = $(id);
  el.className = `status ${type}`;
  el.textContent = message;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  if ((user.email || "").toLowerCase() !== ownerEmail) {
    $("adminGate").className = "status bad";
    $("adminGate").textContent = "Admin access denied. This page is for the club owner email configured in firebase-config.js.";
    return;
  }

  $("adminGate").className = "status ok";
  $("adminGate").textContent = `Admin access granted for ${user.email}.`;
  $("adminApp").classList.remove("hidden");
  bindAdminStreams();
});

$("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await addDoc(collection(db, "products"), {
      name: $("productName").value.trim(),
      icon: $("productIcon").value.trim() || "🧱",
      category: $("productCategory").value.trim() || "General",
      description: $("productDescription").value.trim(),
      active: true,
      createdAt: serverTimestamp()
    });
    event.currentTarget.reset();
    show("productStatus", "Product created and saved in Firestore.", "ok");
  } catch (error) {
    show("productStatus", error.message, "bad");
  }
});

function bindAdminStreams() {
  const requestQuery = query(collection(db, "users"), where("membershipStatus", "==", "pending"), orderBy("createdAt", "asc"));
  onSnapshot(requestQuery, (snapshot) => {
    $("requestsList").innerHTML = snapshot.docs.map((item) => {
      const user = item.data();
      return `<article class="request-card stack">
        <div class="spread"><h3>${safeText(user.name)}</h3>${badge("pending")}</div>
        <div class="muted">${safeText(user.email)}</div>
        <div class="muted">Reason: ${safeText(user.reason || "None")}</div>
        <small>${readableDate(user.createdAt)}</small>
        <div class="inline-actions">
          <button class="btn btn-success approve-btn" data-id="${item.id}" data-name="${safeText(user.name)}">Approve + Generate Code</button>
          <button class="btn btn-danger reject-btn" data-id="${item.id}">Reject</button>
        </div>
      </article>`;
    }).join("") || `<div class="empty">No pending member requests.</div>`;
    hookRequestButtons();
  });

  const productQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
  onSnapshot(productQuery, (snapshot) => {
    $("adminProducts").innerHTML = snapshot.docs.map((item) => {
      const p = item.data();
      return `<article class="product-card stack">
        <div class="spread"><h3>${safeText(p.icon || "🧱")} ${safeText(p.name)}</h3>${badge(p.active ? "approved" : "cancelled")}</div>
        <div class="muted">${safeText(p.category || "General")} · ${safeText(p.description || "")}</div>
        <div class="inline-actions">
          <button class="btn btn-warning toggle-product-btn" data-id="${item.id}" data-active="${String(!!p.active)}">${p.active ? "Hide Product" : "Show Product"}</button>
          <button class="btn btn-danger delete-product-btn" data-id="${item.id}">Delete</button>
        </div>
      </article>`;
    }).join("") || `<div class="empty">No products created yet.</div>`;
    hookProductButtons();
  });

  const orderQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  onSnapshot(orderQuery, (snapshot) => {
    $("ordersAdmin").innerHTML = snapshot.docs.map((item) => {
      const order = item.data();
      return `<article class="order-card stack">
        <div class="spread"><h3>${safeText(order.productName)}</h3>${badge(order.status || "ordered")}</div>
        <div class="muted">${safeText(order.userName)} · ${safeText(order.userEmail)}</div>
        <div class="muted">Qty: ${safeText(order.quantity)} · Code: ${safeText(order.memberCode)}</div>
        <div class="muted">Notes: ${safeText(order.notes || "None")}</div>
        <small>${readableDate(order.createdAt)}</small>
        <div class="inline-actions">
          <button class="btn btn-success status-order-btn" data-id="${item.id}" data-status="ready">Mark Ready</button>
          <button class="btn btn-warning status-order-btn" data-id="${item.id}" data-status="ordered">Mark Ordered</button>
          <button class="btn btn-danger status-order-btn" data-id="${item.id}" data-status="cancelled">Cancel</button>
        </div>
      </article>`;
    }).join("") || `<div class="empty">No orders yet.</div>`;
    hookOrderButtons();
  });
}

function hookRequestButtons() {
  document.querySelectorAll(".approve-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const memberCode = generateMemberCode(button.dataset.name);
      await updateDoc(doc(db, "users", button.dataset.id), {
        membershipStatus: "approved",
        memberCode,
        approvedAt: serverTimestamp()
      });
    });
  });
  document.querySelectorAll(".reject-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await updateDoc(doc(db, "users", button.dataset.id), {
        membershipStatus: "rejected",
        memberCode: null,
        approvedAt: null
      });
    });
  });
}

function hookProductButtons() {
  document.querySelectorAll(".toggle-product-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await updateDoc(doc(db, "products", button.dataset.id), {
        active: button.dataset.active !== "true"
      });
    });
  });
  document.querySelectorAll(".delete-product-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await deleteDoc(doc(db, "products", button.dataset.id));
    });
  });
}

function hookOrderButtons() {
  document.querySelectorAll(".status-order-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await updateDoc(doc(db, "orders", button.dataset.id), {
        status: button.dataset.status
      });
    });
  });
}
