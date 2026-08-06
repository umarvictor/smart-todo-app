// =========================
// DASHBOARD INITIALIZATION
// =========================

if (window.location.pathname.includes("dashboard.html")) {

    const loggedIn = localStorage.getItem("loggedIn");

    if (loggedIn !== "true") {
        window.location.href = "index.html";
    }

    const user = JSON.parse(localStorage.getItem("user"));

    // Welcome text
    if (user && document.getElementById("welcome")) {
        document.getElementById("welcome").textContent =
            "Welcome " + user.name;
    }

    // Avatar initials
    if (user && document.getElementById("avatar")) {

        const initials = user.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase();

        document.getElementById("avatar").textContent =
            initials;
    }

    loadTasks();

}


// =========================
// FOCUS MODE
// =========================

const focusBtn = document.getElementById("focusModeBtn");

if (focusBtn) {

    // Restore previous state
    if (sessionStorage.getItem("focusMode") === "true") {

        document.body.classList.add("focus-mode");

        focusBtn.textContent =
            "Exit Focus Mode";
    }

    focusBtn.addEventListener("click", () => {

        document.body.classList.toggle("focus-mode");

        const enabled =
            document.body.classList.contains("focus-mode");

        focusBtn.textContent =
            enabled
                ? "Exit Focus Mode"
                : "Enter Focus Mode";

        sessionStorage.setItem(
            "focusMode",
            enabled
        );

    });

}


// =========================
// LIVE DATE & TIME
// =========================

function updateDateTime() {

    const now = new Date();

    const dateOptions = {

        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"

    };

    const currentDate =
        document.getElementById("currentDate");

    const currentTime =
        document.getElementById("currentTime");

    if (currentDate) {

        currentDate.textContent =
            now.toLocaleDateString(
                undefined,
                dateOptions
            );

    }

    if (currentTime) {

        currentTime.textContent =
            now.toLocaleTimeString([], {

                hour: "2-digit",
                minute: "2-digit"

            });

    }

}

updateDateTime();

setInterval(updateDateTime, 1000);