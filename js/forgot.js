// ======================================================
// forgot.js
// Handles forgot password flow:
// - Step 1: User enters email, gets simulated reset link
// - Step 2: User sets new password
// - Token stored in sessionStorage with 15min expiry
// ======================================================


// ======================================================
// STEP 1 — REQUEST RESET
// ======================================================

function requestReset() {

    const emailInput = document.getElementById("forgotEmail");
    const emailError = document.getElementById("forgotEmailError");
    const successMsg = document.getElementById("requestSuccessMsg");
    const preview    = document.getElementById("resetPreview");
    const linkEl     = document.getElementById("resetLinkDisplay");

    // Clear previous state
    if (emailError) emailError.textContent = "";
    if (successMsg) successMsg.style.display = "none";
    if (preview)    preview.style.display    = "none";

    const email = emailInput?.value.trim().toLowerCase() || "";

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        if (emailError) {
            emailError.textContent =
                "Please enter a valid email address.";
        }
        return;
    }


    // ====================================================
    // ALWAYS show the same success message
    // regardless of whether the email exists.
    // This prevents user enumeration attacks —
    // an attacker cannot tell which emails are registered.
    // ====================================================

    if (successMsg) {
        successMsg.textContent =
            "If this email is registered, you'll receive a reset link.";
        successMsg.style.display = "block";
    }


    // ====================================================
    // Only generate a token if the email IS registered
    // ====================================================

    const users = getUsers();
    const user  = users.find(u => u.email === email);

    if (user) {

        // Generate secure 32-character alphanumeric token
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const arr   = new Uint8Array(32);
        crypto.getRandomValues(arr);
        const token = Array.from(arr)
            .map(b => chars[b % chars.length])
            .join("");

        // Store token in sessionStorage — 15 minute expiry
        sessionStorage.setItem("ff_reset_token", JSON.stringify({
            email,
            token,
            expiresAt: Date.now() + 15 * 60 * 1000
        }));

        // Show simulated reset link preview
       if (linkEl) {
    const fullUrl =
        window.location.origin +
        window.location.pathname +
        "?token=" + token;

    linkEl.innerHTML = "";

    const link = document.createElement("a");
    link.href        = fullUrl;
    link.textContent = "Click here to reset your password";
    link.style.color = "#60a5fa";

    linkEl.appendChild(link);
}

        if (preview) {
            preview.style.display = "block";
        }

        // Store token in URL so clicking it works
        // In production this would be a full URL in an email
        window._resetToken = token;

    }

}


// ======================================================
// CHECK FOR TOKEN IN URL ON PAGE LOAD
// ======================================================
// When the user clicks the simulated reset link,
// the token appears in the URL as ?token=...
// We read it and show Step 2 if it's valid.
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");

    if (token) {
        validateResetToken(token);
    }

});


// ======================================================
// VALIDATE RESET TOKEN
// ======================================================

function validateResetToken(token) {

    const raw = sessionStorage.getItem("ff_reset_token");

    if (!raw) {
        showResetError("Reset link is invalid or has expired.");
        return;
    }

    try {

        const stored = JSON.parse(raw);

        // Check expiry
        if (Date.now() > stored.expiresAt) {
            sessionStorage.removeItem("ff_reset_token");
            showResetError(
                "Reset link has expired. Please request a new one."
            );
            return;
        }

        // Check token matches
        if (stored.token !== token) {
            showResetError("Reset link is invalid.");
            return;
        }

        // Valid — show Step 2
        document.getElementById("stepRequest").style.display = "none";
        document.getElementById("stepReset").style.display   = "block";

    } catch {
        showResetError("Something went wrong. Please try again.");
    }

}


// ======================================================
// SHOW RESET ERROR
// ======================================================

function showResetError(msg) {
    const el = document.getElementById("forgotEmailError");
    if (el) {
        el.textContent = msg;
        el.style.display = "block";
    }
}


// ======================================================
// STEP 2 — SUBMIT NEW PASSWORD
// ======================================================

async function submitNewPassword() {

    const passwordInput = document.getElementById("resetPassword");
    const confirmInput  = document.getElementById("resetConfirm");
    const passwordError = document.getElementById("resetPasswordError");
    const confirmError  = document.getElementById("resetConfirmError");

    if (passwordError) passwordError.textContent = "";
    if (confirmError)  confirmError.textContent  = "";

    const password = passwordInput?.value || "";
    const confirm  = confirmInput?.value  || "";

    let valid = true;

    // Password strength check
    const passwordPattern =
        /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordPattern.test(password)) {
        if (passwordError) {
            passwordError.textContent =
                "Password must be at least 8 characters with " +
                "1 uppercase, 1 number, and 1 special character.";
        }
        valid = false;
    }

    // Confirm match
    if (password !== confirm) {
        if (confirmError) {
            confirmError.textContent = "Passwords do not match.";
        }
        valid = false;
    }

    if (!valid) return;


    // ====================================================
    // GET STORED TOKEN + EMAIL
    // ====================================================

    const raw = sessionStorage.getItem("ff_reset_token");
    if (!raw) {
        showResetError(
            "Reset session expired. Please request a new link."
        );
        document.getElementById("stepRequest").style.display = "block";
        document.getElementById("stepReset").style.display   = "none";
        return;
    }

    const stored = JSON.parse(raw);


    // ====================================================
    // HASH NEW PASSWORD WITH FRESH SALT
    // ====================================================

    const salt = generateSalt();
    const hash = await hashPassword(password, salt);


    // ====================================================
    // UPDATE USER RECORD
    // ====================================================

    const users = getUsers();
    const idx   = users.findIndex(u => u.email === stored.email);

    if (idx > -1) {
        users[idx].passwordHash = hash;
        users[idx].passwordSalt = salt;
        saveUsers(users);
    }


    // Clean up token
    sessionStorage.removeItem("ff_reset_token");


    // Redirect to login with success message
    sessionStorage.setItem(
        "ff_toast",
        "Password updated successfully. Please sign in."
    );

    window.location.href = "index.html";

}
