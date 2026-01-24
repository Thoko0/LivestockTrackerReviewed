

document.getElementById("loginButton").addEventListener("click", async () => {
    // Get values using id
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:8000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            // Show error message
            const errorMsg = document.getElementById("errorMsg");
            errorMsg.textContent = "Invalid username or password";
            errorMsg.classList.remove("hidden");
            return;
        }

        const data = await response.json();
        // For now, store a dummy token (replace with JWT later)
        localStorage.setItem("access_token", "dummy-token");

        // Redirect to dashboard
        window.location.href = "/main.html";    

    } catch (error) {
        console.error(error);
        const errorMsg = document.getElementById("errorMsg");
    }
});