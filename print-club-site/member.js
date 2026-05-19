import {
  auth, db, $, onAuthStateChanged, doc, getDoc, collection, query, where, orderBy, onSnapshot,
  safeText, readableDate, badge, logoutNow
} from "./app-core.js";

$("logoutBtn").addEventListener("click", logoutNow);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  const profileSnap = await getDoc(doc(db, "users", user.uid));
  if (!profileSnap.exists()) {
    $("profileBox").innerHTML = `<div class="status bad">Profile missing. Sign up again or contact the owner.</div>`;
    return;
  }

  const profile = profileSnap.data();
  const codeBlock = profile.membershipStatus === "approved"
    ? `<div><span class="code-pill">${safeText(profile.memberCode)}</span></div>`
    : `<div class="status warn">Your code appears here after approval.</div>`;

  $("profileBox").innerHTML = `
    <div class="spread"><strong>${safeText(profile.name)}</strong>${badge(profile.membershipStatus)}</div>
    <div class="muted">${safeText(profile.email)}</div>
    ${codeBlock}
    <div class="muted">Request reason: ${safeText(profile.reason || "No reason provided")}</div>
  `;

  const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const rows = snapshot.docs.map((docSnap) => {
      const order = docSnap.data();
      return `
        <article class="order-card stack">
          <div class="spread"><h3>${safeText(order.productName)}</h3>${badge(order.status || "ordered")}</div>
          <div class="muted">Quantity: ${safeText(order.quantity)} · Code used: ${safeText(order.memberCode)}</div>
          <div class="muted">Notes: ${safeText(order.notes || "None")}</div>
          <small>${readableDate(order.createdAt)}</small>
        </article>`;
    }).join("");
    $("ordersList").innerHTML = rows || `<div class="empty">No orders yet.</div>`;
  });
});
