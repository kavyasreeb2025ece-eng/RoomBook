const API_URL = "/api/auth/login";

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Please enter username and password.");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.text();

        if (!response.ok) {
            alert(result || "Incorrect username or password.");
            return;
        }

        console.log("Login response:", result);

        // Store login information
        sessionStorage.setItem("username", username);

        // If your backend returns the role
        try {
            const data = JSON.parse(result);

            if (data.role) {
                sessionStorage.setItem("role", data.role);
            }
        } catch {
            // Backend returned plain text
        }

        sessionStorage.setItem("loggedIn", "true");

        // Go to dashboard
        window.location.href = "index.html";

    } catch (error) {
        console.error(error);
        alert("Unable to connect to the server.");
    }
});