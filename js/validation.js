// =========================
// FORM VALIDATION MODULE
// =========================

function validateForm() {

    // =========================
    // INPUT FIELDS
    // =========================

    const name =
        document.getElementById("name")?.value.trim() || "";

    const email =
        document.getElementById("email")?.value.trim() || "";

    const password =
        document.getElementById("password")?.value || "";

    const confirmPassword =
        document.getElementById("confirmPassword")?.value || "";

    const terms =
        document.getElementById("terms")?.checked || false;

    // =========================
    // ERROR ELEMENTS
    // =========================

    const emailError =
        document.getElementById("emailError");

    const passwordError =
        document.getElementById("passwordError");

    const confirmPasswordError =
        document.getElementById("confirmPasswordError");

    const termsError =
        document.getElementById("termsError");

    // =========================
    // CLEAR OLD ERRORS
    // =========================

    if (emailError) emailError.textContent = "";
    if (passwordError) passwordError.textContent = "";
    if (confirmPasswordError) confirmPasswordError.textContent = "";
    if (termsError) termsError.textContent = "";

    let isValid = true;

    // =========================
    // EMAIL VALIDATION
    // =========================

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailPattern.test(email)) {

        emailError.textContent =
            "Enter a valid email address";

        isValid = false;

    }

    // =========================
    // PASSWORD VALIDATION
    // =========================

    if (password && password.length < 8) {

        passwordError.textContent =
            "Password must be at least 8 characters";

        isValid = false;

    }

    // =========================
    // CONFIRM PASSWORD
    // =========================

    if (
        confirmPassword &&
        password !== confirmPassword
    ) {

        confirmPasswordError.textContent =
            "Passwords do not match";

        isValid = false;

    }

    // =========================
    // TERMS
    // =========================

    if (!terms) {

        termsError.textContent =
            "You must agree to the Terms and Conditions";

        isValid = false;

    }

    // =========================
    // ENABLE BUTTON
    // =========================

    const allFieldsFilled =

        name !== "" &&
        email !== "" &&
        password !== "" &&
        confirmPassword !== "" &&
        terms;

    const signupBtn =
        document.getElementById("signupBtn");

    if (signupBtn) {

        signupBtn.disabled =
            !(allFieldsFilled && isValid);

    }

}