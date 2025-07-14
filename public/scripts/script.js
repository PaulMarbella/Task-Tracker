let tasks = [];

// Load tasks from Firestore for logged-in user
function loadUserTasks(userId) {
  firebase
    .firestore()
    .collection("users")
    .doc(userId)
    .collection("tasks")
    .get()
    .then((querySnapshot) => {
      tasks = [];
      querySnapshot.forEach((doc) => {
        const task = doc.data();
        task.id = doc.id;
        tasks.push(task);
      });
      console.log(userId);
      renderTask();
    })
    .catch((err) => {
      console.error("Error loading tasks:", err.message);
    });
}

// Save or update task in Firestore
function saveTaskToFirestore(userId, task, taskId = null) {
  const userTasksRef = firebase
    .firestore()
    .collection("users")
    .doc(userId)
    .collection("tasks");
  return taskId
    ? userTasksRef.doc(taskId).set(task) // update
    : userTasksRef.add(task); // create
}

// Delete task
function deleteTask(index) {
  const task = tasks[index];
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("tasks")
        .doc(task.id)
        .delete()
        .then(() => {
          tasks.splice(index, 1);
          renderTask();
        })
        .catch((err) => console.error("Delete error:", err));
    }
  });
}

// Auth check and form setup
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "/pages/auth.html";
  } else {
    const greeting = document.getElementById("greeting");
    let name = user.displayName || user.email.split("@")[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (greeting) greeting.textContent = ` ${name} 👋`;

    loadUserTasks(user.uid);

    const form = document.getElementById("taskForm");
    if (form) {
      const editData = localStorage.getItem("editTaskData");
      const editId = localStorage.getItem("editTaskId");

      if (editData && editId) {
        const task = JSON.parse(editData);
        document.getElementById("title").value = task.title;
        document.getElementById("dueDate").value = task.dueDate;
        document.getElementById("description").value = task.description;

        const submitBtn = document.getElementById("submitBtn");
        if (submitBtn) submitBtn.textContent = "Update Task";
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        const title = document.getElementById("title").value;
        const dueDate = document.getElementById("dueDate").value;
        const description = document.getElementById("description").value;

        const newTask = {
          title,
          dueDate,
          description,
          status: "todo",
        };

        const editId = localStorage.getItem("editTaskId");

        if (editId) {
          saveTaskToFirestore(user.uid, newTask, editId).then(() => {
            alert("Task updated!");
            localStorage.removeItem("editTaskData");
            localStorage.removeItem("editTaskId");
            form.reset();
            window.location.href = "task.html";
          });
        } else {
          saveTaskToFirestore(user.uid, newTask).then(() => {
            alert("Task added!");
            form.reset();
            window.location.href = "task.html";
          });
        }

        const submitBtn = document.getElementById("submitBtn");
        if (submitBtn) submitBtn.textContent = "Add Task";
      });
    }
  }
});

// Edit task (save to localStorage temporarily)
function editTask(index) {
  const task = tasks[index];
  localStorage.setItem("editTaskData", JSON.stringify(task));
  localStorage.setItem("editTaskId", task.id);
  window.location.href = "main.html";
}

// Change status and update Firestore
function changeStatus(index, newStatus) {
  const task = tasks[index];
  task.status = newStatus;

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      saveTaskToFirestore(user.uid, task, task.id).then(() => {
        renderTask();
      });
    }
  });
}

// Render tasks
function renderTask() {
  const list = {
    todo: document.getElementById("todoList"),
    inProgress: document.getElementById("inProgressList"),
    done: document.getElementById("doneList"),
  };

  if (!list.todo || !list.inProgress || !list.done) return;

  Object.values(list).forEach((l) => {
    l.innerHTML = '<div class="loading">Loading tasks...</div>';
  });

  setTimeout(() => {
    Object.values(list).forEach((l) => (l.innerHTML = ""));

    let countTodo = 0;
    let countInProgress = 0;
    let countDone = 0;
    let countDueToday = 0;
    let countOverDue = 0;

    const filter = document.getElementById("filter")?.value || "all";
    const today = new Date().toLocaleDateString("en-CA");

    let notified = sessionStorage.getItem("notifiedToday") === "true";

    let tasksShown = {
      todo: 0,
      inProgress: 0,
      done: 0,
    };

    tasks.forEach((task, index) => {
      const dueDate = task.dueDate;
      const isOverdue = dueDate < today && task.status !== "done";
      const isDueToday = dueDate === today && task.status !== "done";

      if (task.status === "todo") countTodo++;
      if (task.status === "inProgress") countInProgress++;
      if (task.status === "done") countDone++;
      if (isDueToday) countDueToday++;
      if (isOverdue) countOverDue++;

      if (
        (filter === "overdue" && !isOverdue) ||
        (filter === "today" && !isDueToday)
      ) {
        return;
      }

      if ((isOverdue || isDueToday) && !notified) {
        if (Notification.permission === "granted") {
          const message = isOverdue
            ? "You have overdue tasks!"
            : "You have tasks due today!";
          new Notification("Task Tracker", { body: message });
          sessionStorage.setItem("notifiedToday", "true");
          notified = true;
        }
      }

      const taskDiv = document.createElement("div");
      taskDiv.className = "task";
      setTimeout(() => taskDiv.classList.add("move"), 10);

      const dueStyle = isOverdue ? 'style="color: red;"' : "";

      taskDiv.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <small ${dueStyle}>Due: ${task.dueDate} ${
        isOverdue ? "(Overdue!)" : isDueToday ? "(Today!)" : ""
      }</small>
        <div class="task-buttons">
          ${
            task.status !== "todo"
              ? `<button onclick="changeStatus(${index}, 'todo')" class="todoButton">To Do</button>`
              : ""
          }
          ${
            task.status !== "inProgress"
              ? `<button onclick="changeStatus(${index}, 'inProgress')" class="progressButton">In Progress</button>`
              : ""
          }
          ${
            task.status !== "done"
              ? `<button onclick="changeStatus(${index}, 'done')" class="doneButton">Done</button>`
              : ""
          }
          ${
            task.status === "todo"
              ? `<button onclick="editTask(${index})" class="todoButton"><i class="fa-solid fa-pen-to-square"></i></button>`
              : ""
          }
          <button onclick="deleteTask(${index})" class="delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      list[task.status]?.appendChild(taskDiv);
      taskDiv.addEventListener("animationend", () =>
        taskDiv.classList.remove("move")
      );

      tasksShown[task.status]++;
    });

    for (const status in list) {
      if (tasksShown[status] === 0) {
        const noData = document.createElement("div");
        noData.className = "no-tasks";
        noData.textContent = "Nothing to show";
        list[status].appendChild(noData);
      }
    }

    const stats = document.getElementById("taskStats");
    if (stats) {
      stats.innerHTML = `
        <p><strong>Stats</strong></p>
        <ul>
          <li>To Do: ${countTodo}</li>
          <li>In Progress: ${countInProgress}</li>
          <li>Done: ${countDone}</li>
          <li>Due Today: ${countDueToday}</li>
          <li>Overdue: ${countOverDue}</li>
        </ul>
      `;
    }
  }, 500);
}

// Stats dropdown toggle
const checkStats = document.getElementById("drop-stats");
if (checkStats) {
  checkStats.addEventListener("click", () => {
    const stats = document.getElementById("stats");
    stats.classList.toggle("active");

    checkStats.innerText = stats.classList.contains("active")
      ? "Close"
      : "See Task >";
  });
}

// Logout
const logoutLink = document.getElementById("logoutLink");
if (logoutLink) {
  logoutLink.addEventListener("click", function (e) {
    e.preventDefault();
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      firebase
        .auth()
        .signOut()
        .then(() => {
          window.location.href = "/pages/auth.html";
        });
    }
  });
}

// responsive
const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("menu");

hamburger.addEventListener("click", () => {
  menu.classList.toggle("show");
});

function scrollToSection(id) {
  const status = document.getElementById(id);
  if (status) {
    status.scrollIntoView({ behavior: "smooth" });
  }
}
