

document.getElementById("loginButton").addEventListener("click", async () => {
    const username = document.querySelector("input[name='username']").value;
    const password = document.querySelector("input[name='password']").value;

    try {
        const response = await fetch("http://localhost:8000/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            alert("Invalid username or password");
            return;
        }

        const data = await response.json();
        localStorage.setItem("access_token", "dummy-token"); // or JWT later
        window.location.href = "/dashboard.html"; // redirect to main page
    } catch (error) {
        console.error(error);
        alert("Server error");
    }
});
