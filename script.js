import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsf_IgEEci-NbSXDGLB7mQZvP_SRGMD6o",
  authDomain: "appmobile-c561a.firebaseapp.com",
  databaseURL: "https://appmobile-c561a-default-rtdb.firebaseio.com",
  projectId: "appmobile-c561a",
  storageBucket: "appmobile-c561a.appspot.com",
  messagingSenderId: "75581709372",
  appId: "1:75581709372:web:484cde5c4141fc7aef3739",
  measurementId: "G-2EPN2ZZM8M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(error => {
      alert("Đăng nhập thất bại: " + error.message);
    });
};
