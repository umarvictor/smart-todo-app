// ======================================================
// dashboard.js
// Dashboard initialization and UI setup
// ======================================================


// ======================================================
// AUTH GUARD
// ======================================================
// Must be the first thing that runs.
// Redirects to login if no valid session found.
// ======================================================

const session = requireAuth();

if (session) {

    // ====================================================
    // WELCOME MESSAGE
    // ====================================================

    const welcomeEl = document.getElementById("welcome");
    if (welcomeEl) {
        welcomeEl.textContent = "Welcome, " + session.name;
    }


    // ====================================================
    // AVATAR INITIALS
    // ====================================================

    const avatarEl = document.getElementById("avatar");
    if (avatarEl) {
        const initials = session.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        avatarEl.textContent = initials;
    }


    // ====================================================
    // STREAK DISPLAY ON LOAD
    // ====================================================

    const streakData = JSON.parse(
        localStorage.getItem(session.userId + "_streak") || "{}"
    );
    const streakEl = document.getElementById("statStreak");
    if (streakEl) {
        streakEl.textContent = (streakData.count || 0) + "d";
    }

}


// ======================================================
// FOCUS MODE
// ======================================================

const focusBtn = document.getElementById("focusModeBtn");

if (focusBtn) {

    // Restore previous focus mode state
    if (sessionStorage.getItem("focusMode") === "true") {
        document.body.classList.add("focus-mode");
        focusBtn.textContent = "Exit Focus Mode";
        focusBtn.setAttribute("aria-pressed", "true");
    }

    focusBtn.addEventListener("click", () => {

        const enabled =
            document.body.classList.toggle("focus-mode");

        focusBtn.textContent =
            enabled ? "Exit Focus Mode" : "Enter Focus Mode";

        focusBtn.setAttribute(
            "aria-pressed",
            String(enabled)
        );

        sessionStorage.setItem("focusMode", String(enabled));

    });

}


// ======================================================
// LIVE DATE & TIME
// ======================================================

function updateDateTime() {

    const now = new Date();

    const currentDate =
        document.getElementById("currentDate");

    const currentTime =
        document.getElementById("currentTime");

    if (currentDate) {
        currentDate.textContent = now.toLocaleDateString(
            undefined,
            {
                weekday: "long",
                year:    "numeric",
                month:   "long",
                day:     "numeric"
            }
        );
    }

    if (currentTime) {
        currentTime.textContent = now.toLocaleTimeString([], {
            hour:   "2-digit",
            minute: "2-digit"
        });
    }

}

updateDateTime();
setInterval(updateDateTime, 1000);
