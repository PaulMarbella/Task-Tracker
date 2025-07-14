document.addEventListener("DOMContentLoaded", () => {
  const toggleLink = document.getElementById("toggleForm");
  const wrapper = document.getElementById("formWrapper");
  const authTitle = document.getElementById("auth-title");
  let showingRegister = false;

  toggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    showingRegister = !showingRegister;
    wrapper.classList.toggle("slide-register", showingRegister);
    toggleLink.textContent = showingRegister ? "Back to Login" : "Register";
    if (showingRegister) {
      authTitle.textContent = "Register 🔐";
    } else {
      authTitle.textContent = "Log in 🔑";
    }
  });

  function showToast(message, isError = true) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#ff4d4f" : "#4CAF50"; // red for error, green for success
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // REGISTER
  document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("registerName").value;
    const password = document.getElementById("registerPassword").value;

    const fakeEmail = `${name.toLowerCase()}@task.com`;

    firebase
      .auth()
      .createUserWithEmailAndPassword(fakeEmail, password)
      .then((userCredential) => {
        showToast("Registered successfully!", false);

        window.location.href = "/pages/main.html";
      })
      .catch((err) => {
        showToast("Need better Password 😣", true);
      });
  });

  // LOGIN
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("loginName").value;
    const password = document.getElementById("loginPassword").value;

    const fakeEmail = `${name.toLowerCase()}@task.com`;

    firebase
      .auth()
      .signInWithEmailAndPassword(fakeEmail, password)
      .then(() => {
        showToast("Registered successfully!", false);

        window.location.href = "/pages/main.html";
      })
      .catch((err) => {
        showToast("Account Not Availabe 😣", true);
      });
  });
});
