// ======================================================
// timer.js
// Pomodoro Timer System
// Handles:
// - 25min focus / 5min short break / 15min long break
// - Start, Pause, Reset
// - Session counter (long break after 4 sessions)
// - Linked task display
// - Web Audio beep on completion
// - Browser notification on completion
// - State persisted in sessionStorage
// ======================================================


// ======================================================
// TIMER CONFIGURATION
// ======================================================

const TIMER_CONFIG = {
    focus:      25 * 60,  // 25 minutes
    shortBreak:  5 * 60,  //  5 minutes
    longBreak:  15 * 60   // 15 minutes
};

const PHASE_LABELS = {
    focus:      "Focus",
    shortBreak: "Short Break",
    longBreak:  "Long Break"
};


// ======================================================
// TIMER STATE
// ======================================================

let timerState = {
    phase:         "focus",
    remaining:     TIMER_CONFIG.focus,
    running:       false,
    sessionCount:  0,
    linkedTaskId:  null,
    linkedTaskText: null,
    startedAt:     null
};

let timerInterval = null;


// ======================================================
// SAVE / RESTORE STATE
// ======================================================
// Timer state is saved to sessionStorage so it
// survives page refreshes within the same tab.
// ======================================================

function saveTimerState() {
    sessionStorage.setItem(
        "ff_timer",
        JSON.stringify(timerState)
    );
}

function restoreTimerState() {

    const raw = sessionStorage.getItem("ff_timer");
    if (!raw) return;

    try {

        const saved = JSON.parse(raw);

        // If timer was running when page was refreshed,
        // calculate how much time has elapsed and subtract
        if (saved.running && saved.startedAt) {
            const elapsed = Math.floor(
                (Date.now() - saved.startedAt) / 1000
            );
            saved.remaining = Math.max(0, saved.remaining - elapsed);
        }

        timerState = saved;

        // Resume interval if it was running
        if (timerState.running) {
            startTimerInterval();
        }

    } catch {
        // Corrupted state — reset cleanly
        sessionStorage.removeItem("ff_timer");
    }
}


// ======================================================
// FORMAT TIME
// ======================================================
// Converts seconds into MM:SS display string
// e.g. 1500 → "25:00", 90 → "01:30"
// ======================================================

function formatTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (
        String(m).padStart(2, "0") +
        ":" +
        String(s).padStart(2, "0")
    );
}


// ======================================================
// UPDATE UI
// ======================================================

function updateTimerUI() {

    const {
        phase,
        remaining,
        running,
        sessionCount,
        linkedTaskText
    } = timerState;

    const total = TIMER_CONFIG[phase];


    // ====================================================
    // TIME DISPLAY
    // ====================================================

    const displayEl = document.getElementById("timerDisplay");
    if (displayEl) {
        displayEl.textContent = formatTimerDisplay(remaining);
    }


    // ====================================================
    // PHASE LABEL
    // ====================================================

    const phaseEl = document.getElementById("timerPhaseLabel");
    if (phaseEl) {
        phaseEl.textContent = PHASE_LABELS[phase];
    }


    // ====================================================
    // SESSION COUNTER
    // ====================================================

    const sessionEl = document.getElementById("timerSessionCount");
    if (sessionEl) {
        const display = (sessionCount % 4) + 1;
        sessionEl.textContent = `Session ${display} of 4`;
    }


    // ====================================================
    // SVG RING PROGRESS
    // ====================================================
    // The ring circumference is 2 * PI * radius
    // We set strokeDashoffset to show remaining time
    // ====================================================

    const ring = document.getElementById("timerRing");
    if (ring) {
        const radius        = 54;
        const circumference = 2 * Math.PI * radius;
        const progress      = remaining / total;
        const offset        = circumference * (1 - progress);

        ring.style.strokeDasharray  = circumference;
        ring.style.strokeDashoffset = offset;

        // Ring colour changes per phase
        const colours = {
            focus:      "#3b82f6",
            shortBreak: "#22c55e",
            longBreak:  "#f59e0b"
        };
        ring.style.stroke = colours[phase] || "#3b82f6";
    }


    // ====================================================
    // START / PAUSE BUTTON LABEL
    // ====================================================

    const startBtn = document.getElementById("timerStartBtn");
    if (startBtn) {
        startBtn.textContent = running ? "⏸ Pause" : "▶ Start";
        startBtn.setAttribute(
            "aria-label",
            running ? "Pause timer" : "Start timer"
        );
    }


    // ====================================================
    // PHASE DOTS
    // ====================================================
    // 4 dots representing the 4 focus sessions
    // before a long break
    // ====================================================

    const dots = document.querySelectorAll(".phase-dot");
    dots.forEach((dot, i) => {
        dot.classList.remove("done", "current");
        const pos = sessionCount % 4;
        if (i < pos)  dot.classList.add("done");
        if (i === pos) dot.classList.add("current");
    });


    // ====================================================
    // LINKED TASK DISPLAY
    // ====================================================

    const linkedEl = document.getElementById("timerLinkedTask");
    if (linkedEl) {
        linkedEl.textContent = linkedTaskText
            ? "Focusing on: " + linkedTaskText
            : "";
    }
}


// ======================================================
// START TIMER INTERVAL
// ======================================================

function startTimerInterval() {

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        if (timerState.remaining > 0) {

            timerState.remaining--;
            timerState.startedAt = Date.now();
            updateTimerUI();
            saveTimerState();

        } else {

            onTimerComplete();

        }

    }, 1000);
}


// ======================================================
// TOGGLE START / PAUSE
// ======================================================

function timerToggle() {

    if (timerState.running) {

        // PAUSE
        timerState.running   = false;
        timerState.startedAt = null;
        clearInterval(timerInterval);
        timerInterval = null;

    } else {

        // START
        timerState.running   = true;
        timerState.startedAt = Date.now();
        startTimerInterval();

    }

    saveTimerState();
    updateTimerUI();
}


// ======================================================
// RESET TIMER
// ======================================================

function timerReset() {

    clearInterval(timerInterval);
    timerInterval = null;

    timerState.running   = false;
    timerState.startedAt = null;
    timerState.remaining = TIMER_CONFIG[timerState.phase];

    saveTimerState();
    updateTimerUI();
}


// ======================================================
// ON TIMER COMPLETE
// ======================================================

function onTimerComplete() {

    clearInterval(timerInterval);
    timerInterval        = null;
    timerState.running   = false;
    timerState.startedAt = null;

    playBeep();

    if (timerState.phase === "focus") {

        // ================================================
        // FOCUS SESSION COMPLETE
        // ================================================

        timerState.sessionCount++;

        // Log pomodoro session against linked task
        logPomodoroSession();

        // Determine next break type
        const isLongBreak = timerState.sessionCount % 4 === 0;
        timerState.phase  = isLongBreak ? "longBreak" : "shortBreak";

        // Show completion modal
        showTimerModal(
            "⏱ Focus Session Complete!",
            isLongBreak
                ? "Great work! Time for a 15-minute long break. You've earned it!"
                : "Nice work! Take a 5-minute break."
        );

        sendTimerNotification(
            "⏱ Focus session complete!",
            "Time for a break."
        );

    } else {

        // ================================================
        // BREAK COMPLETE
        // ================================================

        timerState.phase = "focus";

        const next = (timerState.sessionCount % 4) + 1;

        showTimerModal(
            "☕ Break Over!",
            `Ready for focus session ${next}? Let's go!`
        );

        sendTimerNotification(
            "☕ Break's over!",
            "Ready for your next focus session?"
        );

    }

    timerState.remaining = TIMER_CONFIG[timerState.phase];
    saveTimerState();
    updateTimerUI();
}


// ======================================================
// LOG POMODORO SESSION
// ======================================================
// Records completed session against the linked task
// and increments the task's pomodoroCount badge
// ======================================================

function logPomodoroSession() {

    const session = getSession();
    if (!session) return;

    const key  = session.userId + "_pomo";
    const pomo = JSON.parse(localStorage.getItem(key) || "{}");

    pomo.sessionsToday = (pomo.sessionsToday || 0) + 1;
    pomo.lastSession   = Date.now();

    localStorage.setItem(key, JSON.stringify(pomo));

    // Increment pomodoroCount on the linked task
    if (timerState.linkedTaskId) {

        const tasks = getTasks();
        const task  = tasks.find(t => t.id === timerState.linkedTaskId);

        if (task) {
            task.pomodoroCount = (task.pomodoroCount || 0) + 1;
            task.updatedAt     = Date.now();
            saveTasks(tasks);
            renderTasks();
        }

    }

    // Update insight since pomo count changed
    if (typeof updateInsight === "function") {
        updateInsight();
    }
}


// ======================================================
// LINK TASK TO TIMER
// ======================================================
// Called from tasks.js when user clicks ⏱ on a card
// ======================================================

function linkTaskToPomodoro(taskId) {

    const tasks = getTasks();
    const task  = tasks.find(t => t.id === taskId);
    if (!task) return;

    timerState.linkedTaskId   = task.id;
    timerState.linkedTaskText = task.text;
    timerState.phase          = "focus";
    timerState.remaining      = TIMER_CONFIG.focus;
    timerState.running        = false;

    clearInterval(timerInterval);
    timerInterval = null;

    saveTimerState();
    updateTimerUI();

    showToast("Task linked to Pomodoro! Hit Start when ready.", "success");

    // Scroll to timer
    const panel = document.getElementById("pomodoroPanel");
    if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}


// ======================================================
// PLAY BEEP
// ======================================================
// Uses Web Audio API to generate a tone.
// No audio file needed.
// ======================================================

function playBeep() {
    try {

        const ctx  = new (window.AudioContext || window.webkitAudioContext)();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.8
        );

        osc.start();
        osc.stop(ctx.currentTime + 0.8);

    } catch (e) {
        // Audio not available — fail silently
    }
}


// ======================================================
// SEND BROWSER NOTIFICATION
// ======================================================

function sendTimerNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
}


// ======================================================
// TIMER MODAL
// ======================================================

function showTimerModal(title, body) {

    const modal = document.getElementById("timerModal");
    const titleEl = document.getElementById("timerModalTitle");
    const bodyEl  = document.getElementById("timerModalBody");

    if (!modal) return;

    if (titleEl) titleEl.textContent = title;
    if (bodyEl)  bodyEl.textContent  = body;

    modal.style.display = "flex";
}

function closeTimerModal() {
    const modal = document.getElementById("timerModal");
    if (modal) modal.style.display = "none";
}


// ======================================================
// INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // Restore any saved timer state
    restoreTimerState();

    // Check if a task was linked via the task card button
    const linked = sessionStorage.getItem("ff_pomo_task");
    if (linked) {
        try {
            const task = JSON.parse(linked);
            timerState.linkedTaskId   = task.id;
            timerState.linkedTaskText = task.text;
            sessionStorage.removeItem("ff_pomo_task");
        } catch {
            // ignore
        }
    }

    // Initial UI render
    updateTimerUI();

    // Cleanup intervals on page unload
    window.addEventListener("beforeunload", () => {
        clearInterval(timerInterval);
    });
});
