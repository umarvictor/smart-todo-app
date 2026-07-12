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
// DASHBOARD INIT (SAFE)
// =========================
if(window.location.pathname.includes("dashboard.html")){

    const loggedIn = localStorage.getItem("loggedIn");

    if(loggedIn !== "true"){
        window.location.href = "index.html";
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if(user && document.getElementById("welcome")){
        document.getElementById("welcome").textContent =
            "Welcome " + user.name;
    }

    loadTasks();
}


// =========================
// TODO SYSTEM KEY
// =========================
function getTaskKey(){
    const user = localStorage.getItem("currentUser");
    return user + "_tasks";
}


// =========================
// LOAD TASKS
// =========================
function loadTasks(){

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    const tasks = JSON.parse(localStorage.getItem(getTaskKey())) || [];

    let completed = 0;

    tasks.forEach((task, index) => {

        if(task.done) completed++;

        const li = document.createElement("li");

        // TASK INFO
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

        // BUTTON GROUP (FIX FOR MOBILE LAYOUT)
        const btnGroup = document.createElement("div");
        btnGroup.style.display = "flex";
        btnGroup.style.gap = "5px";

        btnGroup.appendChild(doneBtn);
        btnGroup.appendChild(deleteBtn);

        li.appendChild(info);
        li.appendChild(btnGroup);

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

    const remarksEl = document.getElementById("remarks");
    if(remarksEl){
        remarksEl.textContent =
            `Completion: ${percent}% - ${remark}`;
    }
}

//VALIDATION LOGIC
function validateForm() {

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    // Error elements
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    const termsError = document.getElementById("termsError");

    // Clear previous errors
    emailError.textContent = "";
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
    termsError.textContent = "";

    let isValid = true;

    // Email validation
    if (email && !email.includes("@")) {
        emailError.textContent = "Enter a valid email address";
        isValid = false;
    }

    // Password validation
    if (password && password.length < 8) {
        passwordError.textContent =
            "Password must be at least 8 characters";
        isValid = false;
    }

    // Confirm password validation
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordError.textContent =
            "Passwords do not match";
        isValid = false;
    }

    // Terms validation
    if (!terms) {
        termsError.textContent =
            "You must agree to the Terms and Conditions";
        isValid = false;
    }

    // Enable button only when everything is filled
    const allFieldsFilled =
        name &&
        email &&
        password &&
        confirmPassword &&
        terms;

    document.getElementById("signupBtn").disabled =
        !(allFieldsFilled && isValid);
}





// =========================
// ADD TASK
// =========================
function addTask(){

    const text = document.getElementById("taskInput").value;
    const time = document.getElementById("taskTime").value;
    const priority = document.getElementById("taskPriority").value;

    if(!text || !time){
        alert("Fill all fields");
        return;
    }

    const tasks = JSON.parse(localStorage.getItem(getTaskKey())) || [];

    // CASE-INSENSITIVE DUPLICATE CHECK
    if(tasks.some(t => t.text.toLowerCase() === text.toLowerCase())){
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

    localStorage.setItem(getTaskKey(), JSON.stringify(tasks));

    document.getElementById("taskInput").value = "";
    document.getElementById("taskTime").value = "";

    loadTasks();
}
//LISTENER
document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("name")) {

        document
            .getElementById("name")
            .addEventListener("input", validateForm);

        document
            .getElementById("email")
            .addEventListener("input", validateForm);

        document
            .getElementById("password")
            .addEventListener("input", validateForm);

        document
            .getElementById("confirmPassword")
            .addEventListener("input", validateForm);

        document
            .getElementById("terms")
            .addEventListener("change", validateForm);

    }

});



// =========================
// LOGOUT
// =========================
function logout(){
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("currentUser");

    window.location.href = "index.html";
}