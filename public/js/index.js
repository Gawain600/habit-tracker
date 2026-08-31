const accountButton = document.getElementById("account-button");
const accountButton2 = document.getElementById("account-button2");

const token = getToken();

if (token) {
  accountButton.textContent = "Dashboard";
  accountButton2.textContent = "Dashboard";

  accountButton.href = "/dashboard.html";
  accountButton2.href = "/dashboard.html";
}
