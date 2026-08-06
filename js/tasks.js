// =========================
// TASK STORAGE KEY
// =========================

function getTaskKey() {

    const user = localStorage.getItem("currentUser");

    return user + "_tasks";

}


// =========================
// LOAD TASKS
// =========================

function loadTasks() {

    const taskList = document.getElementById("taskList");

    if (!taskList) return;

    taskList.innerHTML = "";

    const tasks =
        JSON.parse(localStorage.getItem(getTaskKey())) || [];

    let completed = 0;

    tasks.forEach((task, index) => {

        if (task.done) completed++;

        const li = document.createElement("li");

        if (task.done) {
            li.classList.add("completed");
        }

        // =========================
        // TASK INFO
        // =========================

        const info = document.createElement("div");

        info.className = "task-info";

        const title = document.createElement("strong");

        title.textContent =
            (task.done ? "✓ " : "") + task.text;

        const details = document.createElement("small");

        details.textContent =
            `⏰ ${task.time} | 🎯 ${task.priority}`;

        info.appendChild(title);
        info.appendChild(details);

        // =========================
        // DONE BUTTON
        // =========================

        const doneBtn =
            document.createElement("button");

        doneBtn.textContent =
            task.done ? "Undo" : "Done";

        doneBtn.onclick = function () {

            task.done = !task.done;

            localStorage.setItem(
                getTaskKey(),
                JSON.stringify(tasks)
            );

            loadTasks();

        };

        // =========================
        // DELETE BUTTON
        // =========================

        const deleteBtn =
            document.createElement("button");

        deleteBtn.textContent = "Delete";

        deleteBtn.onclick = function () {

            tasks.splice(index, 1);

            localStorage.setItem(
                getTaskKey(),
                JSON.stringify(tasks)
            );

            loadTasks();

        };

        // =========================
        // BUTTON GROUP
        // =========================

        const btnGroup =
            document.createElement("div");

        btnGroup.className = "task-actions";

        btnGroup.appendChild(doneBtn);
        btnGroup.appendChild(deleteBtn);

        li.appendChild(info);
        li.appendChild(btnGroup);

        taskList.appendChild(li);

    });

    // =========================
    // PRODUCTIVITY REMARKS
    // =========================

    const total = tasks.length;

    const percent =
        total === 0
            ? 0
            : Math.round((completed / total) * 100);

    let remark = "";

    if (percent === 100) {

        remark =
            "Excellent! All tasks completed!";

    } else if (percent >= 70) {

        remark =
            "👍 Good progress today!";

    } else if (percent >= 40) {

        remark =
            "⚠️ Average performance, improve focus.";

    } else {

        remark =
            "🚨 Low productivity, try planning better.";

    }

    const remarks =
        document.getElementById("remarks");

    if (remarks) {

        remarks.textContent =
            `Completion: ${percent}% - ${remark}`;

    }

}


// =========================
// ADD TASK
// =========================

function addTask() {

    const text =
        document.getElementById("taskInput").value.trim();

    const time =
        document.getElementById("taskTime").value;

    const priority =
        document.getElementById("taskPriority").value;

    if (!text || !time) {

        alert("Fill all fields");

        return;

    }

    const tasks =
        JSON.parse(localStorage.getItem(getTaskKey())) || [];

    // Duplicate check

    if (
        tasks.some(
            task =>
                task.text.toLowerCase() ===
                text.toLowerCase()
        )
    ) {

        alert("Task already exists");

        return;

    }

    const newTask = {

        text,

        time,

        priority,

        done: false

    };

    tasks.push(newTask);

    localStorage.setItem(
        getTaskKey(),
        JSON.stringify(tasks)
    );

    document.getElementById("taskInput").value = "";

    document.getElementById("taskTime").value = "";

    document.getElementById("taskPriority").selectedIndex = 0;

    loadTasks();

}