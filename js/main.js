// =========================
// MAIN APPLICATION ENTRY
// =========================


// ======================================================
// TASK TITLE CHARACTER COUNTER
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const taskInput =
        document.getElementById("taskInput");

    const taskCounter =
        document.getElementById("taskCounter");


    // If this is not the dashboard page,
    // there is nothing to initialize.
    if (!taskInput || !taskCounter) {
        return;
    }


    function updateCounter() {

        const length =
            taskInput.value.length;


        taskCounter.textContent =
            `${length}/200`;


        // Turn counter red when limit is reached
        if (length >= 200) {

            taskCounter.classList.add(
                "counter-danger"
            );

        } else {

            taskCounter.classList.remove(
                "counter-danger"
            );

        }

    }


    // Listen for changes to task title
    taskInput.addEventListener(
        "input",
        updateCounter
    );


    // Initialize counter
    updateCounter();

});

// ======================================================
// SHOW TOAST FROM PREVIOUS PAGE
// ======================================================
// Used to display success messages after redirects
// e.g. "Password updated" after forgot password flow
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const msg = sessionStorage.getItem("ff_toast");

    if (msg) {
        sessionStorage.removeItem("ff_toast");
        const el = document.getElementById("loginToast");
        if (el) {
            el.textContent    = msg;
            el.style.display  = "block";
        }
    }

});
