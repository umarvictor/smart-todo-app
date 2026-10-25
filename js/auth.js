// ======================================================
// auth.js
// Handles: Sign Up, Login, Logout, Session Check
// ======================================================


// ======================================================
// PBKDF2 HELPERS
// ======================================================
// PBKDF2 is a password hashing algorithm built into
// the browser's Web Crypto API. It is slow by design —
// that's what makes it hard to crack.
//
// How it works:
//   1. Generate a random "salt" (16 random bytes).
//      Salt ensures two users with the same password
//      get completely different hashes.
//   2. Run the password + salt through SHA-256
//      100,000 times (iterations).
//   3. Store the resulting hash + the salt.
//      Never store the plaintext password.
//
// On login, we repeat the same process with the
// stored salt and compare the result.
// ======================================================

// Converts a Uint8Array of bytes into a hex string
// e.g. [255, 16] → "ff10"
function uint8ToHex(arr) {
    return Array.from(arr)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}


// Converts a hex string back into a Uint8Array
// e.g. "ff10" → [255, 16]
function hexToUint8(hex) {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return arr;
}


// Generates a cryptographically random 16-byte salt
// and returns it as a hex string
function generateSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return uint8ToHex(arr);
}


// Hashes a plaintext password using PBKDF2-SHA256
// Returns a hex string of the derived key
async function hashPassword(password, saltHex) {

    const encoder = new TextEncoder();

    // Step 1: Import the raw password as a key
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );

    // Step 2: Derive 256 bits using the salt + 100k iterations
    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: hexToUint8(saltHex),
            iterations: 100000
        },
        keyMaterial,
        256
    );

    // Step 3: Convert result to hex string and return
    return uint8ToHex(new Uint8Array(bits));
}


// ======================================================
// USER STORAGE HELPERS
// ======================================================
// We store all users as an array under "ff_users".
// This supports multiple accounts on the same browser,
// unlike the old approach that used a single "user" key.
// ======================================================

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem("ff_users")) || [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem("ff_users", JSON.stringify(users));
}


// ======================================================
// SANITIZE
// ======================================================
// Encodes user input as plain text before storing.
// Prevents XSS if content is ever rendered as HTML.
// ======================================================

function sanitize(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}


// ======================================================
// SIGN UP
// ======================================================

async function signup() {

    const nameInput     = document.getElementById("name");
    const emailInput    = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const termsInput    = document.getElementById("terms");

    const nameError     = document.getElementById("nameError");
    const emailError    = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const termsError    = document.getElementById("termsError");

    // Clear old errors
    [nameError, emailError, passwordError, termsError].forEach(el => {
        if (el) el.textContent = "";
    });

    const name     = nameInput?.value.trim() || "";
    const email    = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    const terms    = termsInput?.checked || false;

    let valid = true;

    // Name
    if (name.length < 2) {
        if (nameError) nameError.textContent = "Name must be at least 2 characters.";
        valid = false;
    }

    // Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        if (emailError) emailError.textContent = "Please enter a valid email address.";
        valid = false;
    }

    // Password: min 8 chars, 1 uppercase, 1 number, 1 special char
    const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPattern.test(password)) {
        if (passwordError) passwordError.textContent =
            "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.";
        valid = false;
    }

    // Terms
    if (!terms) {
        if (termsError) termsError.textContent = "You must agree to the Terms and Conditions.";
        valid = false;
    }

    if (!valid) return;

    // Check if email already registered
    const users = getUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
        if (emailError) emailError.textContent = "An account with this email already exists.";
        return;
    }

    // Hash the password
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    // Build user object — never store the plaintext password
    const newUser = {
        id:            "u_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        name:          sanitize(name),
        email:         email.toLowerCase(),
        passwordHash:  hash,
        passwordSalt:  salt,
        verified:      false,
        agreedToTerms: true,
        agreedAt:      Date.now(),
        createdAt:     Date.now()
    };

    // Generate a 6-digit verification code
    // Store it in sessionStorage (not localStorage)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem("ff_verification", JSON.stringify({
        email:     email.toLowerCase(),
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts:  0
    }));

    // Save new user
    users.push(newUser);
    saveUsers(users);

    sessionStorage.setItem("ff_pending_email", email.toLowerCase());
    sessionStorage.setItem("ff_preview_code", code);

    window.location.href = "verify.html";
}


// ======================================================
// LOGIN
// ======================================================

async function login() {

    const emailInput    = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const rememberMe    = document.getElementById("rememberMe");
    const errorEl       = document.getElementById("loginError");

    if (errorEl) errorEl.textContent = "";

    const email    = emailInput?.value.trim().toLowerCase() || "";
    const password = passwordInput?.value || "";
    const remember = rememberMe?.checked || false;

    // Basic presence check
    if (!email || !password) {
        if (errorEl) errorEl.textContent = "Please enter your email and password.";
        return;
    }

    // Lockout check
    const lockout = JSON.parse(sessionStorage.getItem("ff_lockout") || "{}");
    if (lockout.until && Date.now() < lockout.until) {
        const secsLeft = Math.ceil((lockout.until - Date.now()) / 1000);
        if (errorEl) errorEl.textContent = `Too many attempts. Try again in ${secsLeft}s.`;
        return;
    }

    const users = getUsers();
    const user  = users.find(u => u.email === email);

    // Always hash even if user not found (prevents timing attacks)
    const saltToUse = user ? user.passwordSalt : generateSalt();
    const hash      = await hashPassword(password, saltToUse);
    const match     = user && hash === user.passwordHash;

    if (!match) {
        const fails = (lockout.fails || 0) + 1;
        if (fails >= 5) {
            sessionStorage.setItem("ff_lockout", JSON.stringify({
                fails,
                until: Date.now() + 30 * 1000
            }));
            if (errorEl) errorEl.textContent = "Too many attempts. Please wait 30 seconds.";
        } else {
            sessionStorage.setItem("ff_lockout", JSON.stringify({ fails }));
            if (errorEl) errorEl.textContent = "Incorrect email or password.";
        }
        return;
    }

    // Reset lockout on success
    sessionStorage.removeItem("ff_lockout");

    // Check email verification
    if (!user.verified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        sessionStorage.setItem("ff_verification", JSON.stringify({
            email:     user.email,
            code,
            expiresAt: Date.now() + 10 * 60 * 1000,
            attempts:  0
        }));
        sessionStorage.setItem("ff_pending_email", user.email);
        sessionStorage.setItem("ff_preview_code", code);
        window.location.href = "verify.html";
        return;
    }

    // Create session
    const session = {
        userId:     user.id,
        name:       user.name,
        email:      user.email,
        loginAt:    Date.now(),
        persistent: remember
    };

    if (remember) {
        localStorage.setItem("ff_session", JSON.stringify(session));
    }
    sessionStorage.setItem("ff_session", JSON.stringify(session));

    window.location.href = "dashboard.html";
}


// ======================================================
// GET CURRENT SESSION
// ======================================================

function getSession() {
    try {
        const ss = sessionStorage.getItem("ff_session");
        if (ss) return JSON.parse(ss);
        const ls = localStorage.getItem("ff_session");
        if (ls) return JSON.parse(ls);
    } catch {
        return null;
    }
    return null;
}


// ======================================================
// LOGOUT
// ======================================================

function logout() {
    localStorage.removeItem("ff_session");
    sessionStorage.removeItem("ff_session");
    window.location.href = "index.html";
}


// ======================================================
// REDIRECT IF NOT LOGGED IN
// ======================================================

function requireAuth() {
    const session = getSession();
    if (!session) {
        window.location.href = "index.html";
        return null;
    }
    return session;
}


// ======================================================
// SEED DEMO ACCOUNT
// ======================================================
// Creates a default demo account on first visit so
// reviewers can log in without signing up.
//
// Credentials:
//   Email:    demo@focusflow.app
//   Password: Demo@1234
//
// The account is pre-verified so no email
// verification step is required.
// ======================================================

async function seedDemoAccount() {

    const users = getUsers();

    // Only seed if demo account doesn't already exist
    const exists = users.find(
        u => u.email === "demo@focusflow.app"
    );

    if (exists) return;

    const salt = generateSalt();
    const hash = await hashPassword("Demo@1234", salt);

    const demoUser = {
        id:            "demo_user",
        name:          "Demo User",
        email:         "demo@focusflow.app",
        passwordHash:  hash,
        passwordSalt:  salt,
        verified:      true,
        agreedToTerms: true,
        agreedAt:      Date.now(),
        createdAt:     Date.now()
    };

    users.push(demoUser);
    saveUsers(users);

}

// Seed runs on every page load but only
// creates the account once
seedDemoAccount();