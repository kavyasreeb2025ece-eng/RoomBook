const REGISTER_URL = "/api/users/register";

document.addEventListener("DOMContentLoaded", () => {

    const registerForm = document.getElementById("registerForm");

    if (!registerForm) {
        console.error("registerForm not found");
        return;
    }

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        if (!name || !email || !password || !role) {
            alert("Please fill all the fields.");
            return;
        }

        const registerButton = registerForm.querySelector(
            "button[type='submit']"
        );

        registerButton.disabled = true;
        registerButton.textContent = "Registering...";

        try {

            const response = await fetch(REGISTER_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    role: role
                })
            });

            const result = await response.json();

            if (response.ok) {

                alert(result.message || "Registration successful!");

                // Go to login page
                window.location.href = "login.html";

            } else {

                alert(result.message || "Registration failed.");

            }

        } catch (error) {

            console.error("Registration error:", error);
            alert("Unable to connect to the server.");

        } finally {

            registerButton.disabled = false;
            registerButton.textContent = "Register";

        }
    });
});