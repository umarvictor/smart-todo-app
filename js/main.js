// =========================
// MAIN APPLICATION ENTRY
// =========================

document.addEventListener("DOMContentLoaded", () => {

    initializeSignupValidation();

});


// =========================
// INITIALIZE SIGNUP PAGE
// =========================

function initializeSignupValidation() {

    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const terms = document.getElementById("terms");

    // If we're not on the signup page, stop here.
    if (!name) return;

    name.addEventListener("input", validateForm);
    email.addEventListener("input", validateForm);
    password.addEventListener("input", validateForm);
    confirmPassword.addEventListener("input", validateForm);
    terms.addEventListener("change", validateForm);

    // Run once so the button starts in the correct state
    validateForm();

}