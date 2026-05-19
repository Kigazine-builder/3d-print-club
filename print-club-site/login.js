import {
  auth, db, $, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  doc, setDoc, serverTimestamp
} from "./app-core.js";

const loginForm = $("loginForm");
const signupForm = $("signupForm");

function show(id, message, type = "ok") {
  const el = $(id);
  el.className = `status ${type}`;
  el.textContent = message;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, $("loginEmail").value.trim(), $("loginPassword").value);
    location.href = "member.html";
  } catch (error) {
    show("loginStatus", error.message, "bad");
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim().toLowerCase();
  const password = $("signupPassword").value;
  const reason = $("signupReason").value.trim();

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
      name,
      email,
      reason,
      role: "member",
      membershipStatus: "pending",
      memberCode: null,
      createdAt: serverTimestamp(),
      approvedAt: null
    });
    show("signupStatus", "Request sent. The owner can approve it in the admin page. Once approved, your member code appears in the Member Area.", "ok");
    signupForm.reset();
    setTimeout(() => location.href = "member.html", 900);
  } catch (error) {
    show("signupStatus", error.message, "bad");
  }
});
