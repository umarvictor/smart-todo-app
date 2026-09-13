// ======================================================
// verify.js
// Handles email verification flow:
// - Displays simulated code preview
// - Auto-advances between digit inputs
// - Validates code against sessionStorage
// - Handles resend with 60s cooldown
// ======================================================


// ======================================================
// ON PAGE LOAD
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // ====================================================
    // SHOW PENDING EMAIL IN SUBTITLE
    // ====================================================

    const pendingEmail =
        sessionStorage.getItem("ff_pending_email");

    // If no pending email, user shouldn't be here
    if (!pendingEmail) {
        window.location.href = "signup.html";
        return;
    }

    const subtitle = document.getElementById("verifySubtitle");
    if (subtitle) {
        subtitle.textContent =
            `Enter the 6-digit code sent to ${pendingEmail}.`;
    }


    // ====================================================
    // SHOW SIMULATED CODE PREVIEW
    // ====================================================

    const previewCode =
        sessionStorage.getItem("ff_preview_code");

    const previewEl =
        document.getElementById("previewCode");

    if (previewEl && previewCode) {
        previewEl.textContent = previewCode;
    }


    // ====================================================
    // WIRE UP DIGIT INPUTS
    // ====================================================

    const inputs = document.querySelectorAll(".verify-input");

    inputs.forEach((input, index) => {

        // Auto-advance on valid digit entry
        input.addEventListener("input", (e) => {

            // Only allow digits
            const val = e.target.value.replace(/\D/g, "");
            e.target.value = val.slice(0, 1);

            // Move to next input if a digit was entered
            if (val && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }

            // Auto-submit when all 6 digits are filled
            if (index === inputs.length - 1 && val) {
                setTimeout(submitCode, 200);
            }
        });


        // Backspace moves to previous input
        input.addEventListener("keydown", (e) => {

            if (e.key === "Backspace" && !input.value && index > 0) {
                inputs[index - 1].focus();
            }

        });

    });


    // ====================================================
    // PASTE TOGGLE
    // ====================================================

    const pasteToggle =
        document.getElementById("pasteToggle");

    const pasteModeWrap =
        document.getElementById("pasteModeWrap");

    if (pasteToggle && pasteModeWrap) {

        pasteToggle.addEventListener("click", (e) => {

            e.preventDefault();

            const isVisible =
                pasteModeWrap.style.display !== "none";

            pasteModeWrap.style.display =
                isVisible ? "none" : "block";

        });

    }

});


// ======================================================
// GET ENTERED CODE FROM INPUTS
// ======================================================

function getEnteredCode() {
    return Array.from(
        document.querySelectorAll(".verify-input")
    )
    .map(input => input.value)
    .join("");
}


// ======================================================
// CLEAR INPUTS
// ======================================================

function clearInputs() {
    document.querySelectorAll(".verify-input")
        .forEach(input => {
            input.value = "";
        });

    // Focus first input
    const first =
        document.querySelector(".verify-input");

    if (first) first.focus();
}


// ======================================================
// SHOW ERROR
// ======================================================

function showVerifyError(msg) {
    const el = document.getElementById("verifyError");
    if (el) el.textContent = msg;
}


// ======================================================
// CLEAR ERROR
// ======================================================

function clearVerifyError() {
    const el = document.getElementById("verifyError");
    if (el) el.textContent = "";
}


// ======================================================
// SUBMIT CODE (from digit inputs)
// ======================================================

function submitCode() {

    const entered = getEnteredCode();

    if (entered.length < 6) return;

    validateCode(entered);
}


// ======================================================
// SUBMIT PASTED CODE
// ======================================================

function submitPastedCode() {

    const input = document.getElementById("pasteInput");
    const val   = input?.value.trim() || "";

    if (val.length !== 6) {
        showVerifyError("Please enter a 6-digit code.");
        return;
    }

    validateCode(val);
}


// ======================================================
// VALIDATE CODE
// ======================================================
// Checks the entered code against what is stored
// in sessionStorage. Tracks attempts and expires
// after 3 failures or 10 minutes.
// ======================================================

function validateCode(entered) {

    clearVerifyError();

    // Get stored verification data
    const raw = sessionStorage.getItem("ff_verification");

    if (!raw) {
        showVerifyError(
            "No verification code found. Please sign up again."
        );
        return;
    }

    const stored = JSON.parse(raw);


    // ====================================================
    // CHECK EXPIRY
    // ====================================================

    if (Date.now() > stored.expiresAt) {

        sessionStorage.removeItem("ff_verification");
        sessionStorage.removeItem("ff_preview_code");

        showVerifyError(
            "Code expired. Click Resend to get a new one."
        );

        clearInputs();
        return;
    }


    // ====================================================
    // INCREMENT ATTEMPT COUNT
    // ====================================================

    stored.attempts = (stored.attempts || 0) + 1;
    sessionStorage.setItem("ff_verification", JSON.stringify(stored));


    // ====================================================
    // TOO MANY ATTEMPTS
    // ====================================================

    if (stored.attempts > 3) {

        sessionStorage.removeItem("ff_verification");
        sessionStorage.removeItem("ff_preview_code");

        showVerifyError(
            "Too many incorrect attempts. Click Resend to get a new code."
        );

        clearInputs();
        return;
    }


    // ====================================================
    // WRONG CODE
    // ====================================================

    if (entered !== stored.code) {

        const remaining = 3 - stored.attempts;

        showVerifyError(
            `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
        );

        clearInputs();
        return;
    }


    // ====================================================
    // SUCCESS — mark user as verified
    // ====================================================

    const users = getUsers();
    const idx   = users.findIndex(u => u.email === stored.email);

    if (idx > -1) {
        users[idx].verified = true;
        saveUsers(users);
    }


    // Clean up sessionStorage
    sessionStorage.removeItem("ff_verification");
    sessionStorage.removeItem("ff_preview_code");


    // Create session for this user
    const user    = users[idx];
    const session = {
        userId:     user.id,
        name:       user.name,
        email:      user.email,
        loginAt:    Date.now(),
        persistent: false
    };

    sessionStorage.setItem(
        "ff_session",
        JSON.stringify(session)
    );


    // Redirect to dashboard
    window.location.href = "dashboard.html";
}


// ======================================================
// RESEND CODE
// ======================================================
// Generates a new code, resets the expiry and attempt
// counter, and starts a 60-second resend cooldown.
// ======================================================

function resendCode() {

    const pendingEmail =
        sessionStorage.getItem("ff_pending_email");

    if (!pendingEmail) {
        window.location.href = "signup.html";
        return;
    }

    // Generate new code
    const code =
        Math.floor(100000 + Math.random() * 900000).toString();

    // Reset verification data
    sessionStorage.setItem("ff_verification", JSON.stringify({
        email:     pendingEmail,
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts:  0
    }));

    // Update preview
    sessionStorage.setItem("ff_preview_code", code);
    const previewEl = document.getElementById("previewCode");
    if (previewEl) previewEl.textContent = code;

    // Clear inputs and error
    clearInputs();
    clearVerifyError();

    // ====================================================
    // START 60-SECOND RESEND COOLDOWN
    // ====================================================

    const resendBtn   = document.getElementById("resendBtn");
    const resendTimer = document.getElementById("resendTimer");

    if (resendBtn)   resendBtn.style.display   = "none";
    if (resendTimer) resendTimer.style.display = "inline";

    let seconds = 60;

    const countdown = setInterval(() => {

        seconds--;

        if (resendTimer) {
            resendTimer.textContent = `Resend in ${seconds}s`;
        }

        if (seconds <= 0) {
            clearInterval(countdown);
            if (resendBtn)   resendBtn.style.display   = "inline";
            if (resendTimer) resendTimer.style.display = "none";
        }

    }, 1000);
}
