// ======================================================
// tasks.js
// Handles all task operations:
// - Add, Edit, Delete, Complete
// - Render task cards
// - Filter + Sort
// - Productivity stats
// - Streak tracking
// ======================================================


// ======================================================
// SANITIZE
// ======================================================
// Encodes user input before storing or rendering.
// Prevents XSS if content is ever inserted as HTML.
// ======================================================

function sanitize(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}


// ======================================================
// TASK STORAGE
// ======================================================

function getTaskKey() {
    const session = getSession();
    return session ? session.userId + "_tasks" : null;
}

function getTasks() {
    const key = getTaskKey();
    if (!key) return [];
    try {
        const stored = JSON.parse(localStorage.getItem(key)) || [];
        return migrateTasks(stored);
    } catch {
        return [];
    }
}

function saveTasks(tasks) {
    const key = getTaskKey();
    if (!key) return;
    try {
        localStorage.setItem(key, JSON.stringify(tasks));
    } catch (e) {
        if (e.name === "QuotaExceededError") {
            showToast(
                "Storage is full. Please delete some tasks to free up space.",
                "danger"
            );
        }
    }
}


// ======================================================
// TASK MIGRATION
// ======================================================
// Safely upgrades older task objects to the
// current schema without breaking existing data.
// ======================================================

function migrateTasks(tasks) {
    return tasks.map(task => {

        // Old "done" field → "completed"
        if (
            typeof task.completed === "undefined" &&
            typeof task.done !== "undefined"
        ) {
            task.completed = task.done;
            delete task.done;
        }

        // Fill in any missing fields
        if (typeof task.completed  === "undefined") task.completed  = false;
        if (typeof task.completedAt === "undefined") task.completedAt = null;
        if (typeof task.createdAt  === "undefined") task.createdAt  = Date.now();
        if (typeof task.updatedAt  === "undefined") task.updatedAt  = Date.now();
        if (typeof task.pomodoroCount === "undefined") task.pomodoroCount = 0;

        return task;
    });
}


// ======================================================
// TODAY STRING
// ======================================================
// Returns today's date as "YYYY-MM-DD"
// Used for scoping and overdue checks
// ======================================================

function getTodayString() {
    const now = new Date();
    const y   = now.getFullYear();
    const m   = String(now.getMonth() + 1).padStart(2, "0");
    const d   = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}


// ======================================================
// TODAY-SCOPED CHECK
// ======================================================
// PRD §8.6: Stats count only tasks where:
//   - dueDate = today, OR
//   - no dueDate and createdAt = today
// ======================================================

function isTodayScoped(task) {
    const today = getTodayString();

    if (task.dueDate) {
        return task.dueDate === today;
    }

    // No due date — check if created today
    const createdDate = new Date(task.createdAt)
        .toISOString()
        .split("T")[0];

    return createdDate === today;
}


// ======================================================
// TASK STATE
// ======================================================
// Returns: "completed" | "today" | "upcoming" | "overdue"
// ======================================================

function getTaskState(task) {
    if (task.completed) return "completed";

    const today = getTodayString();

    if (!task.dueDate || task.dueDate === today) return "today";
    if (task.dueDate > today) return "upcoming";
    return "overdue";
}


// ======================================================
// OVERDUE CHECK
// ======================================================

function isTaskOverdue(task) {
    return getTaskState(task) === "overdue";
}


// ======================================================
// DAYS OVERDUE COUNT
// ======================================================

function daysOverdue(dueDate) {
    const due   = new Date(dueDate + "T00:00:00");
    const today = new Date(getTodayString() + "T00:00:00");
    return Math.floor((today - due) / (1000 * 60 * 60 * 24));
}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString(undefined, {
        month: "short",
        day:   "numeric",
        year:  "numeric"
    });
}


// ======================================================
// FORMAT TIME
// ======================================================

function formatTime(timeString) {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return date.toLocaleTimeString(undefined, {
        hour:   "numeric",
        minute: "2-digit",
        hour12: true
    });
}


// ======================================================
// GENERATE TASK ID
// ======================================================

function generateTaskId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now() + "-" + Math.random().toString(36).substring(2, 11);
}


// ======================================================
// DEFAULT TASK DATE
// ======================================================

function setDefaultTaskDate() {
    const taskDate = document.getElementById("taskDate");
    if (!taskDate) return;
    const today = getTodayString();
    taskDate.value = today;
}


// ======================================================
// CURRENT FILTER & SORT STATE
// ======================================================

let currentFilter = "all";
let currentSort   = "dateAdded";


// ======================================================
// SET FILTER
// ======================================================

function setFilter(filter) {
    currentFilter = filter;

    // Update active tab styling
    document.querySelectorAll(".filter-tab").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.filter === filter
        );
        btn.setAttribute(
            "aria-selected",
            btn.dataset.filter === filter
        );
    });

    renderTasks();
}


// ======================================================
// SET SORT
// ======================================================

function setSort(value) {
    currentSort = value;
    renderTasks();
}


// ======================================================
// ADD TASK
// ======================================================

function addTask() {

    const taskInput    = document.getElementById("taskInput");
    const taskDate     = document.getElementById("taskDate");
    const taskTime     = document.getElementById("taskTime");
    const taskPriority = document.getElementById("taskPriority");
    const goalTag      = document.getElementById("goalTag");
    const titleError   = document.getElementById("taskTitleError");

    if (!taskInput) return;

    // Clear previous error
    if (titleError) titleError.textContent = "";

    const text     = taskInput.value.trim();
    const dueDate  = taskDate?.value   || "";
    const time     = taskTime?.value   || "";
    const priority = taskPriority?.value || "Medium";
    const goal     = goalTag?.value.trim() || "";

    // Validate title
    if (!text) {
        if (titleError) titleError.textContent = "Please enter a task title.";
        taskInput.focus();
        return;
    }

    // Enforce 200 char limit
    if (text.length > 200) {
        if (titleError) titleError.textContent = "Title cannot exceed 200 characters.";
        return;
    }

    // Build task object
    // sanitize() is applied to text inputs before storing
    const newTask = {
        id:           generateTaskId(),
        text:         sanitize(text),
        dueDate:      dueDate,
        time:         time,
        priority:     priority,
        goalTag:      sanitize(goal),
        completed:    false,
        createdAt:    Date.now(),
        completedAt:  null,
        updatedAt:    Date.now(),
        pomodoroCount: 0
    };

    const tasks = getTasks();
    tasks.push(newTask);
    saveTasks(tasks);

    // Clear form
    taskInput.value       = "";
    if (taskTime)     taskTime.value     = "";
    if (taskPriority) taskPriority.value = "Medium";
    if (goalTag)      goalTag.value      = "";
    if (titleError)   titleError.textContent = "";

    // Reset character counter
    const counter = document.getElementById("taskCounter");
    if (counter) {
        counter.textContent = "0/200";
        counter.classList.remove("counter-danger");
    }

    renderTasks();
    updateStats();
    renderChart();
}



// ======================================================
// RENDER TASKS
// ======================================================
// Applies current filter + sort then builds the list
// ======================================================

function renderTasks() {

    const taskList = document.getElementById("taskList");
    if (!taskList) return;

    taskList.innerHTML = "";

    let tasks = getTasks();

    // Save migrated data
    saveTasks(tasks);


    // ====================================================
    // APPLY FILTER
    // ====================================================

    const filtered = tasks.filter(task => {
        const state = getTaskState(task);
        if (currentFilter === "all")       return true;
        if (currentFilter === "today")     return state === "today";
        if (currentFilter === "upcoming")  return state === "upcoming";
        if (currentFilter === "overdue")   return state === "overdue";
        if (currentFilter === "completed") return state === "completed";
        return true;
    });


    // ====================================================
    // APPLY SORT
    // ====================================================

    const priorityOrder = { High: 0, Medium: 1, Low: 2 };

    filtered.sort((a, b) => {
        if (currentSort === "priority") {
            return (priorityOrder[a.priority] ?? 1) -
                   (priorityOrder[b.priority] ?? 1);
        }
        if (currentSort === "dueDate") {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return  1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        }
        if (currentSort === "alpha") {
            return a.text.localeCompare(b.text);
        }
        // Default: dateAdded (newest first)
        return b.createdAt - a.createdAt;
    });


    // ====================================================
    // EMPTY STATE
    // ====================================================

    if (filtered.length === 0) {
        taskList.appendChild(buildEmptyState(currentFilter));
        return;
    }


    // ====================================================
    // BUILD CARDS
    // ====================================================

    filtered.forEach(task => {
        taskList.appendChild(createTaskCard(task));
    });
}


// ======================================================
// EMPTY STATE
// ======================================================

function buildEmptyState(filter) {

    const states = {
        all: {
            icon:  "📝",
            title: "Nothing planned yet",
            sub:   "Add your first task and start building momentum."
        },
        today: {
            icon:  "☀️",
            title: "Nothing due today",
            sub:   "Add a task for today to get started."
        },
        upcoming: {
            icon:  "🗓",
            title: "No upcoming tasks",
            sub:   "Tasks with future due dates will appear here."
        },
        overdue: {
            icon:  "✅",
            title: "You're all caught up!",
            sub:   "No overdue tasks. Great job staying on top of things."
        },
        completed: {
            icon:  "🎉",
            title: "No completed tasks yet",
            sub:   "Mark a task done to see it here."
        }
    };

    const s   = states[filter] || states.all;
    const div = document.createElement("div");
    div.className = "empty-state";

    const icon  = document.createElement("div");
    icon.className = "empty-state-icon";
    icon.textContent = s.icon;

    const title = document.createElement("h4");
    title.className = "empty-state-title";
    title.textContent = s.title;

    const sub = document.createElement("p");
    sub.className = "empty-state-sub";
    sub.textContent = s.sub;

    div.appendChild(icon);
    div.appendChild(title);
    div.appendChild(sub);

    return div;
}


// ======================================================
// CREATE TASK CARD
// ======================================================

function createTaskCard(task) {

    const state = getTaskState(task);

    const li = document.createElement("li");
    li.className = "task-card";
    li.dataset.id = task.id;
    li.dataset.priority = task.priority || "Medium";

    if (task.completed) li.classList.add("completed");
    if (state === "overdue") li.classList.add("overdue");


    // ====================================================
    // LEFT: TASK INFO
    // ====================================================

    const info = document.createElement("div");
    info.className = "task-info";

    // Title — use textContent, never innerHTML
    const title = document.createElement("strong");
    title.className = "task-title";
    title.textContent = task.text;

    // Details row
    const details = document.createElement("div");
    details.className = "task-details";

    // Due date
    if (task.dueDate) {
        const dateEl = document.createElement("span");
        dateEl.className = "task-date";
        dateEl.textContent = "📅 " + formatDate(task.dueDate);
        details.appendChild(dateEl);
    }

    // Due time
    if (task.time) {
        const timeEl = document.createElement("span");
        timeEl.className = "task-time";
        timeEl.textContent = "🕐 " + formatTime(task.time);
        details.appendChild(timeEl);
    }

    // Priority badge
    const priorityEl = document.createElement("span");
    priorityEl.className =
        "priority-badge priority-" + (task.priority || "medium").toLowerCase();
    priorityEl.textContent = task.priority || "Medium";
    details.appendChild(priorityEl);

    // Goal tag
    if (task.goalTag) {
        const tagEl = document.createElement("span");
        tagEl.className = "goal-tag";
        tagEl.textContent = "🏷 " + task.goalTag;
        details.appendChild(tagEl);
    }

    // Pomodoro count badge
    if (task.pomodoroCount > 0) {
        const pomoEl = document.createElement("span");
        pomoEl.className = "pomo-badge";
        pomoEl.textContent = "🍅 " + task.pomodoroCount;
        details.appendChild(pomoEl);
    }

    // Overdue badge + days count
    if (state === "overdue") {
        const overdueEl = document.createElement("span");
        overdueEl.className = "overdue-badge";
        const days = daysOverdue(task.dueDate);
        overdueEl.textContent =
            "Overdue — " + days + " day" + (days !== 1 ? "s" : "");
        details.appendChild(overdueEl);

        // Move to Today button
        const moveBtn = document.createElement("button");
        moveBtn.type = "button";
        moveBtn.className = "move-today-btn";
        moveBtn.textContent = "Move to Today →";
        moveBtn.addEventListener("click", () => moveToToday(task.id));
        details.appendChild(moveBtn);
    }

    info.appendChild(title);
    info.appendChild(details);


    // ====================================================
    // INLINE EDIT FORM (hidden by default)
    // ====================================================

    const editForm = document.createElement("div");
    editForm.className = "task-edit-form";
    editForm.id = "editForm_" + task.id;
    editForm.style.display = "none";
    info.appendChild(editForm);


    // ====================================================
    // RIGHT: ACTION BUTTONS
    // ====================================================

    const actions = document.createElement("div");
    actions.className = "task-actions";

    // Complete button
    const completeBtn = document.createElement("button");
    completeBtn.type = "button";
    completeBtn.className = "task-complete-btn";
    completeBtn.textContent = task.completed ? "✓" : "○";
    completeBtn.setAttribute(
        "aria-label",
        task.completed ? "Mark task incomplete" : "Mark task complete"
    );
    completeBtn.addEventListener("click", () => toggleTaskComplete(task.id));

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "task-edit-btn";
    editBtn.textContent = "✎";
    editBtn.setAttribute("aria-label", "Edit task");
    editBtn.addEventListener("click", () => startEditTask(task.id));

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "task-delete-btn";
    deleteBtn.textContent = "🗑";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    // Pomodoro link button
    const pomoBtn = document.createElement("button");
    pomoBtn.type = "button";
    pomoBtn.className = "task-pomo-btn";
    pomoBtn.textContent = "⏱";
    pomoBtn.setAttribute("aria-label", "Start Pomodoro for this task");
    pomoBtn.addEventListener("click", () => linkTaskToPomodoro(task.id));

    actions.appendChild(completeBtn);
    actions.appendChild(editBtn);
    actions.appendChild(pomoBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(info);
    li.appendChild(actions);

    return li;
}


// ======================================================
// TOGGLE COMPLETE
// ======================================================

function toggleTaskComplete(taskId) {

    const tasks = getTasks();
    const task  = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed   = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    task.updatedAt   = Date.now();

    saveTasks(tasks);
    renderTasks();
    updateStats();
    updateStreak();
    updateInsight();
    renderChart();
}



// ======================================================
// DELETE TASK — with undo snackbar
// ======================================================

function deleteTask(taskId) {

    const tasks   = getTasks();
    const index   = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return;

    // Pull the task out but don't permanently
    // delete it yet — keep it for undo
    const removed = tasks[index];
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks();
    updateStats();

    // Show undo snackbar for 5 seconds
    // If user clicks Undo, restore the task
    showToast(
        "Task deleted.",
        "danger",
        5000,
        "Undo",
        () => {
            const current = getTasks();
            // Re-insert at original position if possible
            current.splice(index, 0, removed);
            saveTasks(current);
            renderTasks();
            updateStats();
        }
    );
}


// ======================================================
// MOVE TO TODAY
// ======================================================

function moveToToday(taskId) {
    const tasks = getTasks();
    const task  = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.dueDate   = getTodayString();
    task.updatedAt = Date.now();

    saveTasks(tasks);
    renderTasks();
    updateStats();
}


// ======================================================
// INLINE EDIT
// ======================================================

let currentEditId = null;

function startEditTask(taskId) {

    // If another card is being edited, cancel it first
    if (currentEditId && currentEditId !== taskId) {
        cancelEdit(currentEditId);
    }

    currentEditId = taskId;

    const tasks = getTasks();
    const task  = tasks.find(t => t.id === taskId);
    if (!task) return;

    const editForm = document.getElementById("editForm_" + taskId);
    if (!editForm) return;

    // Hide action buttons while editing
    const card    = editForm.closest(".task-card");
    const actions = card?.querySelector(".task-actions");
    if (actions) actions.style.display = "none";

    // Build edit form
    editForm.style.display = "flex";
    editForm.innerHTML = "";

    // Title input
    const titleInput = document.createElement("input");
    titleInput.type        = "text";
    titleInput.className   = "edit-input";
    titleInput.value       = task.text;
    titleInput.maxLength   = 200;
    titleInput.placeholder = "Task title";

    // Date input
    const dateInput = document.createElement("input");
    dateInput.type      = "date";
    dateInput.className = "edit-input";
    dateInput.value     = task.dueDate || "";

    // Time input
    const timeInput = document.createElement("input");
    timeInput.type      = "time";
    timeInput.className = "edit-input";
    timeInput.value     = task.time || "";

    // Save button
    const saveBtn = document.createElement("button");
    saveBtn.type      = "button";
    saveBtn.className = "edit-save-btn";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => saveEdit(taskId));

    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.type      = "button";
    cancelBtn.className = "edit-cancel-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => cancelEdit(taskId));

    // Keyboard shortcuts
    titleInput.addEventListener("keydown", e => {
        if (e.key === "Enter")  saveEdit(taskId);
        if (e.key === "Escape") cancelEdit(taskId);
    });

    editForm.appendChild(titleInput);
    editForm.appendChild(dateInput);
    editForm.appendChild(timeInput);
    editForm.appendChild(saveBtn);
    editForm.appendChild(cancelBtn);

    titleInput.focus();
}


function saveEdit(taskId) {

    const editForm   = document.getElementById("editForm_" + taskId);
    if (!editForm) return;

    const titleInput = editForm.querySelector("input[type='text']");
    const dateInput  = editForm.querySelector("input[type='date']");
    const timeInput  = editForm.querySelector("input[type='time']");

    const newTitle = titleInput?.value.trim() || "";

    if (!newTitle) {
        showToast("Task title cannot be empty.", "danger");
        return;
    }

    if (newTitle.length > 200) {
        showToast("Title cannot exceed 200 characters.", "danger");
        return;
    }

    const tasks = getTasks();
    const task  = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.text      = sanitize(newTitle);
    task.dueDate   = dateInput?.value  || task.dueDate;
    task.time      = timeInput?.value  || task.time;
    task.updatedAt = Date.now();

    saveTasks(tasks);
    currentEditId = null;
    renderTasks();
    updateStats();
}


function cancelEdit(taskId) {
    currentEditId = null;
    renderTasks();
}


// ======================================================
// LINK TASK TO POMODORO
// ======================================================
// Stores the task ID in sessionStorage so the
// Pomodoro timer can display and track it
// ======================================================

function linkTaskToPomodoro(taskId) {
    const tasks = getTasks();
    const task  = tasks.find(t => t.id === taskId);
    if (!task) return;

    sessionStorage.setItem("ff_pomo_task", JSON.stringify({
        id:   task.id,
        text: task.text
    }));

    showToast("Task linked to Pomodoro timer!", "success");

    // Scroll to timer panel if it exists
    const timerPanel = document.getElementById("pomodoroPanel");
    if (timerPanel) {
        timerPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}


// ======================================================
// UPDATE STATS
// ======================================================
// PRD §10: Stats count today-scoped tasks only
// ======================================================

function updateStats() {

    const tasks = getTasks();

    // Today-scoped tasks only
    const scoped    = tasks.filter(isTodayScoped);
    const total     = scoped.length;
    const completed = scoped.filter(t => t.completed).length;
    const percent   = total === 0
        ? null
        : Math.round((completed / total) * 100);

    // Stat cards
    const statTotal     = document.getElementById("statTotal");
    const statCompleted = document.getElementById("statCompleted");
    const statPercent   = document.getElementById("statPercent");

    if (statTotal)     statTotal.textContent     = total;
    if (statCompleted) statCompleted.textContent = completed;
    if (statPercent)   statPercent.textContent   =
        percent !== null ? percent + "%" : "—";

    // Progress bar
    const bar = document.getElementById("progressBar");
    if (bar) {
        const value = percent ?? 0;
        bar.style.width = value + "%";
        bar.setAttribute("aria-valuenow", value);

        // Color thresholds
        if (value <= 30)      bar.className = "progress-fill danger";
        else if (value <= 69) bar.className = "progress-fill warning";
        else                  bar.className = "progress-fill success";
    }

    // Motivation message
    updateMotivation(percent, total);

    // Announce to screen readers
    const announce = document.getElementById("statsAnnounce");
    if (announce && percent !== null) {
        announce.textContent =
            `Productivity updated: ${percent}% — ${completed} of ${total} tasks complete.`;
    }
}


// ======================================================
// MOTIVATION MESSAGE
// ======================================================

function updateMotivation(percent, total) {

    const el = document.getElementById("motivationMsg");
    if (!el) return;

    let msg = "";

    if (percent === null || total === 0) {
        msg = "Let's get started — add your first task for today.";
    } else if (percent === 0) {
        msg = "Let's get started — you've got this!";
    } else if (percent <= 25) {
        msg = "Every task completed is a step forward. Keep going!";
    } else if (percent <= 50) {
        msg = "You're building momentum. Keep pushing!";
    } else if (percent <= 74) {
        msg = "You're doing great — solid progress today!";
    } else if (percent <= 89) {
        msg = "Outstanding effort! You're almost there!";
    } else if (percent < 100) {
        msg = "Excellent work today! Finish strong!";
    } else {
        msg = "🏆 Perfect day! Every task crushed!";
    }

    el.textContent = msg;
}


// ======================================================
// STREAK
// ======================================================

function updateStreak() {

    const session = getSession();
    if (!session) return;

    const key    = session.userId + "_streak";
    const streak = JSON.parse(localStorage.getItem(key)) || {
        count:          0,
        lastActiveDate: null
    };

    const today     = getTodayString();
    const yesterday = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split("T")[0];
    })();

    // Has the user completed any task today?
    const tasks            = getTasks();
    const completedToday   = tasks.some(t =>
        t.completed &&
        t.completedAt &&
        new Date(t.completedAt).toISOString().split("T")[0] === today
    );

    if (!completedToday) return;

    if (streak.lastActiveDate === today) {
        // Already counted today — no change
    } else if (streak.lastActiveDate === yesterday) {
        // Continuing streak
        streak.count++;
    } else {
        // Streak broken — reset
        streak.count = 1;
    }

    streak.lastActiveDate = today;
    localStorage.setItem(key, JSON.stringify(streak));

    // Update streak display
    const statStreak = document.getElementById("statStreak");
    if (statStreak) statStreak.textContent = streak.count + "d";

    // Milestone check
    checkStreakMilestone(streak.count);
}


// ======================================================
// STREAK MILESTONE
// ======================================================

function checkStreakMilestone(count) {
    const milestones = [3, 7, 14, 30];
    if (milestones.includes(count)) {
        showToast(
            `🔥 ${count}-day streak! You're on fire!`,
            "success",
            4000
        );
    }
}


// ======================================================
// AI INSIGHT
// ======================================================

function updateInsight() {

    const el = document.getElementById("insightText");
    if (!el) return;

    const tasks  = getTasks();
    const scoped = tasks.filter(isTodayScoped);
    const total  = scoped.length;
    const done   = scoped.filter(t => t.completed).length;
    const pct    = total > 0 ? Math.round((done / total) * 100) : null;
    const hour   = new Date().getHours();

    const pomoData = JSON.parse(
        localStorage.getItem(getSession()?.userId + "_pomo") || "{}"
    );
    const pomoSessions = pomoData.sessionsToday || 0;

    let text = "";

    if (total === 0) {
        text = "No tasks yet today. Start by adding your top 3 goals for the day.";
    } else if (pct === 100) {
        text = "All tasks done! Reflect on what helped you succeed today.";
    } else if (pomoSessions >= 4) {
        text = "Excellent focus discipline today! Make sure to take a proper rest break.";
    } else if (pct !== null && pct < 30 && hour >= 14) {
        text = "Your productivity is low for this time of day. Try completing one small task to build momentum.";
    } else if (pct !== null && pct >= 30 && pct < 60) {
        text = "Your productivity is moderate today. Reducing distractions could help you push further.";
    } else if (pct !== null && pct > 60) {
        text = "You're performing well today! Consider tackling a high-priority task while your focus is strong.";
    } else {
        text = "Start with your highest-priority task while your energy is fresh.";
    }

    el.textContent = text;
}


// ======================================================
// TOAST NOTIFICATION
// ======================================================
// Shows a temporary message at the bottom of the screen.
// Supports an optional undo action button.
// ======================================================

function showToast(message, type = "info", duration = 3500, undoLabel = null, undoFn = null) {

    let container = document.getElementById("toastContainer");

    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;

    const msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    // Undo button (for delete)
    if (undoLabel && undoFn) {
        const undoBtn = document.createElement("button");
        undoBtn.type      = "button";
        undoBtn.className = "toast-undo-btn";
        undoBtn.textContent = undoLabel;
        undoBtn.addEventListener("click", () => {
            undoFn();
            toast.remove();
        });
        toast.appendChild(undoBtn);
    }

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add("toast-hide");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}


// ======================================================
// INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    setDefaultTaskDate();
    renderTasks();
    updateStats();
    updateInsight();
});
