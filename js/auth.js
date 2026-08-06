// =========================
// AUTHENTICATION MODULE
// Handles:
// - Sign Up
// - Login
// - Logout
// =========================


// =========================
// SIGN UP
// =========================
function signup() {

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!name || !email || !password) {
        alert("Fill all fields");
        return;
    }

    const user = {
        name,
        email,
        password
    };

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );

    alert("Account created successfully!");

    window.location.href = "index.html";

}


// =========================
// LOGIN
// =========================
function login() {

    const email =
        document.getElementById("loginEmail")?.value.trim();

    const password =
        document.getElementById("loginPassword")?.value;

    const user =
        JSON.parse(localStorage.getItem("user"));

    if (!user) {

        alert("No account found");

        return;

    }

    if (
        email === user.email &&
        password === user.password
    ) {

        localStorage.setItem("loggedIn", "true");

        localStorage.setItem(
            "currentUser",
            email
        );

        window.location.href =
            "dashboard.html";

    }

    else {

        alert("Invalid email or password");

    }

}


// =========================
// LOGOUT
// =========================
function logout() {

    localStorage.removeItem("loggedIn");

    localStorage.removeItem("currentUser");

    window.location.href =
        "index.html";

}