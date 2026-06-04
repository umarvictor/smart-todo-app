// =========================
// SIGNUP
// =========================
function signup(){

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if(!name || !email || !password){
        alert("Fill all fields");
        return;
    }

    const user = { name, email, password };

    localStorage.setItem("user", JSON.stringify(user));

    alert("Account created");

    window.location.href = "index.html";
}


// =========================
// LOGIN
// =========================
function login(){

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const user = JSON.parse(localStorage.getItem("user"));

    if(!user){
        alert("No account found");
        return;
    }

    if(email === user.email && password === user.password){

        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("currentUser", email);

        window.location.href = "dashboard.html";

    } else {
        alert("Invalid credentials");
    }
}


// =========================
// DASHBOARD PROTECTION
// =========================
if(window.location.pathname.includes("dashboard.html")){

    const loggedIn = localStorage.getItem("loggedIn");

    if(loggedIn !== "true"){
        window.location.href = "index.html";
    }

    const user = JSON.parse(localStorage.getItem("user"));
    document.getElementById("welcome").textContent =
        "Welcome " + user.name;

    loadTasks();
}


// =========================
// TODO SYSTEM (PER USER)
// =========================

function getTaskKey(){
    const user = localStorage.getItem("currentUser");
    return user + "_tasks";
}


// LOAD TASKS
function loadTasks(){

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    const tasks = JSON.parse(localStorage.getItem(getTaskKey())) || [];

    let completed = 0;

    tasks.forEach((task, index) => {

        if(task.done) completed++;

        const li = document.createElement("li");

        // LEFT SIDE INFO
        const info = document.createElement("div");
        info.className = "task-info";

        info.innerHTML = `
            <strong>${task.text}</strong>
            <small>⏰ ${task.time} | 🎯 ${task.priority}</small>
        `;

        // DONE BUTTON
        const doneBtn = document.createElement("button");
        doneBtn.textContent = task.done ? "Undo" : "Done";

        doneBtn.onclick = function(){
            task.done = !task.done;
            localStorage.setItem(getTaskKey(), JSON.stringify(tasks));
            loadTasks();
        };

        // DELETE BUTTON
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";

        deleteBtn.onclick = function(){
            tasks.splice(index, 1);
            localStorage.setItem(getTaskKey(), JSON.stringify(tasks));
            loadTasks();
        };

        li.appendChild(info);
        li.appendChild(doneBtn);
        li.appendChild(deleteBtn);

        taskList.appendChild(li);
    });

    // PERFORMANCE REMARKS
    const total = tasks.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    let remark = "";

    if(percent === 100){
        remark = "🔥 Excellent! All tasks completed!";
    } else if(percent >= 70){
        remark = "👍 Good progress today!";
    } else if(percent >= 40){
        remark = "⚠️ Average performance, improve focus.";
    } else {
        remark = "🚨 Low productivity, try planning better.";
    }

    document.getElementById("remarks").textContent =
        `Completion: ${percent}% - ${remark}`;
}


// ADD TASK
function addTask(){

    const text = document.getElementById("taskInput").value;
    const time = document.getElementById("taskTime").value;
    const priority = document.getElementById("taskPriority").value;

    if(!text || !time){
        alert("Fill all fields");
        return;
    }

    const tasks = JSON.parse(localStorage.getItem(getTaskKey())) || [];

    const newTask = {
        text,
        time,
        priority,
        done: false
    };

    if(tasks.some(t => t.text === text)){
        alert("Task already exists");
        return;
    }

    tasks.push(newTask);

    localStorage.setItem(getTaskKey(), JSON.stringify(tasks));

    document.getElementById("taskInput").value = "";
    document.getElementById("taskTime").value = "";

    loadTasks();
}

// =========================
// LOGOUT
// =========================
function logout(){
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("currentUser");

    window.location.href = "index.html";
}