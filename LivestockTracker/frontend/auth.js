const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

async function checkUser() {
  const res = await fetch("http://localhost:8000/dashboard", {
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  if (!res.ok) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  const data = await res.json();
  document.getElementById("status").innerText = `Hello, ${data.username}`;
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

checkUser();
