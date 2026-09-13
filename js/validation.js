// =========================
// FORM VALIDATION MODULE
// =========================

function validateForm() {

    // =========================
    // GET INPUT FIELDS
    // =========================

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput =
        document.getElementById("confirmPassword");
    const termsInput = document.getElementById("terms");

    const signupBtn =
        document.getElementById("signupBtn");


    // =========================
    // STOP IF NOT ON SIGNUP PAGE
    // =========================

    if (
        !nameInput ||
        !emailInput ||
        !passwordInput ||
        !confirmPasswordInput ||
        !termsInput ||
        !signupBtn
    ) {
        return;
    }


    // =========================
    // GET VALUES
    // =========================

    const name =
        nameInput.value.trim();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;

    const terms =
        termsInput.checked;


    // =========================
    // ERROR ELEMENTS
    // =========================

    const nameError =
        document.getElementById("nameError");

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

    if (nameError) {
        nameError.textContent = "";
    }

    if (emailError) {
        emailError.textContent = "";
    }

    if (passwordError) {
        passwordError.textContent = "";
    }

    if (confirmPasswordError) {
        confirmPasswordError.textContent = "";
    }

    if (termsError) {
        termsError.textContent = "";
    }


    // =========================
    // VALIDATION STATE
    // =========================

    let isValid = true;


    // =========================
    // FULL NAME VALIDATION
    // =========================

    if (name === "") {

        if (nameError) {
            nameError.textContent =
                "Please enter your full name";
        }

        isValid = false;
    }


    // =========================
    // EMAIL VALIDATION
    // =========================

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === "") {

        if (emailError) {
            emailError.textContent =
                "Please enter your email address";
        }

        isValid = false;

    } else if (!emailPattern.test(email)) {

        if (emailError) {
            emailError.textContent =
                "Enter a valid email address";
        }

        isValid = false;
    }


    // =========================
    // PASSWORD VALIDATION
    // =========================

    if (password === "") {

        if (passwordError) {
            passwordError.textContent =
                "Please enter a password";
        }

        isValid = false;
} else {

    const passwordPattern =
        /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordPattern.test(password)) {

        if (passwordError) {
            passwordError.textContent =
                "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.";
        }

        isValid = false;
    }
}


    // =========================
    // CONFIRM PASSWORD
    // =========================

    if (confirmPassword === "") {

        if (confirmPasswordError) {
            confirmPasswordError.textContent =
                "Please confirm your password";
        }

        isValid = false;

    } else if (password !== confirmPassword) {

        if (confirmPasswordError) {
            confirmPasswordError.textContent =
                "Passwords do not match";
        }

        isValid = false;
    }


    // =========================
    // TERMS & CONDITIONS
    // =========================

    if (!terms) {

        if (termsError) {
            termsError.textContent =
                "You must agree to the Terms and Conditions";
        }

        isValid = false;
    }


    // =========================
    // ENABLE / DISABLE BUTTON
    // =========================

    const allFieldsFilled =
        name !== "" &&
        email !== "" &&
        password !== "" &&
        confirmPassword !== "" &&
        terms === true;


    signupBtn.disabled =
        !(allFieldsFilled && isValid);
}
// ======================================================
// SIGNUP VALIDATION LISTENERS
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const name =
        document.getElementById("name");

    const email =
        document.getElementById("email");

    const password =
        document.getElementById("password");

    const confirmPassword =
        document.getElementById("confirmPassword");

    const terms =
        document.getElementById("terms");


    // Not the signup page
    if (
        !name ||
        !email ||
        !password ||
        !confirmPassword ||
        !terms
    ) {
        return;
    }


    // Listen for changes
    name.addEventListener(
        "input",
        validateForm
    );

    email.addEventListener(
        "input",
        validateForm
    );

    password.addEventListener(
        "input",
        validateForm
    );

    confirmPassword.addEventListener(
        "input",
        validateForm
    );

    terms.addEventListener(
        "change",
        validateForm
    );


    // Check initial state
    validateForm();

});
