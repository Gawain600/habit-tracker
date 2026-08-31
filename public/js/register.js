const nameInput = document.getElementById("name");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const message = document.getElementById("message");
const registerButton = document.getElementById("register-button");

const token = getToken();
if (token) {
  window.location.replace("/dashboard.html");
}

function registerOnEnter(event) {
  if (event.key === "Enter") {
    registerButton.click;
  }
}
nameInput.addEventListener("keydown", registerOnEnter);
email.addEventListener("keydown", registerOnEnter);
password.addEventListener("keydown", registerOnEnter);
confirmPassword.addEventListener("keydown", registerOnEnter);

registerButton.addEventListener("click", async function () {
  try {
    if (
      nameInput.value.trim() === "" ||
      email.value.trim() === "" ||
      password.value.trim() === ""
    ) {
      throw new Error("Missing field inputs");
    }

    if (password.value.trim() !== confirmPassword.value.trim()) {
      throw new Error("Passwords do not match");
    }

    registerButton.disabled = true;
    registerButton.textContent = "loading...";

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value,
        password: password.value,
        email: email.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not create account");
    }
    saveToken(data.token);
    window.location.replace("/dashboard.html");
  } catch (error) {
    console.error(error);
    message.textContent = error.messsage || "Could not connect to the server";
  } finally {
    registerButton.disable = false;
    registerButton.textContent = "Create account";
  }
});
