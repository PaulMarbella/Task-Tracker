let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTask() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTask() {
  const list = {
    todo: document.getElementById("todoList"),
    inProgress: document.getElementById("inProgressList"),
    done: document.getElementById("doneList"),
  };

  if (!list.todo || !list.inProgress || !list.done) return;

  Object.values(list).forEach((l) => (l.innerHTML = ""));

  tasks.forEach((task, index) => {
    const taskDiv = document.createElement("div");
    taskDiv.className = "task";
    taskDiv.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <small>Due: ${task.dueDate}</small>
      <div class="task-buttons">
        ${task.status !== "todo" ? `<button class="todoButton" onclick="changeStatus(${index}, 'todo')">To Do</button>` : ""}
        ${task.status !== "inProgress" ? `<button class="progressButton" onclick="changeStatus(${index}, 'inProgress')">In Progress</button>` : ""}
        ${task.status !== "done" ? `<button class="doneButton" onclick="changeStatus(${index}, 'done')">Done</button>` : ""}
        <button onclick="deleteTask(${index})" class="delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
     if (list[task.status]) {
    list[task.status].appendChild(taskDiv);
  } else {
    console.warn("Invalid status:", task.status); 
  };
  });
}

function changeStatus(index, newStatus) {
  tasks[index].status = newStatus;
  saveTask();
  renderTask();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTask();
  renderTask();
}

const form = document.getElementById("taskForm");
if (form) {
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

    tasks.push(newTask);
    saveTask();

    // Clear inputs
    form.reset();
    alert("Task added!");
  });
}


if (document.getElementById("todoList")) {
  renderTask();
}
