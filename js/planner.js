/*
  planner.js — the Academic Planner (planner.html).

  HOW IT WORKS
  ------------
  • All tasks live in ONE array called `tasks`. Each task is an object:
      { id, title, course, dueDate, completed, createdAt }
  • Every change follows the same three steps:
      1. change the `tasks` array        (addTask, toggleTask, deleteTask)
      2. save the array to localStorage  (saveTasks)
      3. redraw the list from the array  (renderTasks)
    The page is always a picture of the array, so it can never get out of step.
  • `currentFilter` remembers which button (All / Pending / Completed) is active.
*/

const STORAGE_KEY = "cos106-planner-tasks";

let tasks = [];
let currentFilter = "all";
let storageAvailable = true;

// Elements we use more than once.
const taskForm = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const courseInput = document.getElementById("task-course");
const dueInput = document.getElementById("task-due");
const titleError = document.getElementById("task-title-error");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const statusMessage = document.getElementById("planner-status");
const storageWarning = document.getElementById("storage-warning");
const filterButtons = document.querySelectorAll(".filter-btn");

/* ---------- Saving and loading ---------- */

/* Creates a unique id. crypto.randomUUID() exists in modern browsers;
   the fallback mixes the time with a random number. */
function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return "task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

/* Checks that something read from storage really looks like a task.
   Anything else (edited by hand, from an old version, corrupted) is skipped. */
function isValidTask(item) {
  return item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" && item.id !== "" &&
    typeof item.title === "string" && item.title.trim() !== "" &&
    typeof item.completed === "boolean";
}

/* Reads the saved tasks. Never throws: if storage is blocked or the data is
   broken, the planner still works, starting from an empty list. */
function loadTasks() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    storageAvailable = false;
    showStorageWarning("Your browser is blocking storage, so tasks will disappear when you leave this page.");
    return [];
  }

  if (saved === null) {
    return [];   // first visit
  }

  let parsed;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    showStorageWarning("Saved tasks could not be read, so the planner started with an empty list.");
    return [];
  }

  if (!Array.isArray(parsed)) {
    showStorageWarning("Saved tasks could not be read, so the planner started with an empty list.");
    return [];
  }

  const validTasks = parsed.filter(isValidTask).map(function (item) {
    return {
      id: item.id,
      title: item.title.trim().slice(0, 120),
      course: typeof item.course === "string" ? item.course.slice(0, 40) : "",
      dueDate: typeof item.dueDate === "string" ? item.dueDate : "",
      completed: item.completed,
      createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now()
    };
  });

  if (validTasks.length < parsed.length) {
    showStorageWarning("Some saved tasks were damaged and have been skipped.");
  }
  return validTasks;
}

/* Writes the whole array to localStorage as a JSON string. */
function saveTasks() {
  if (!storageAvailable) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    storageAvailable = false;
    showStorageWarning("Tasks could not be saved (storage is full or blocked). They will be lost when you leave this page.");
  }
}

function showStorageWarning(message) {
  storageWarning.textContent = message;
  storageWarning.hidden = false;
}

/* ---------- Changing the array ---------- */

function addTask(title, course, dueDate) {
  tasks.push({
    id: createId(),
    title: title,
    course: course,
    dueDate: dueDate,
    completed: false,
    createdAt: Date.now()
  });
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(function (item) { return item.id === id; });
  if (!task) {
    return;
  }
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
  announce(task.completed ? "Task marked as completed." : "Task marked as pending.");

  // Redrawing replaced the button the user pressed. Put keyboard focus back on
  // the new one if the task is still shown, otherwise on the title field.
  const sameButton = taskList.querySelector('button[data-action="toggle"][data-id="' + CSS.escape(id) + '"]');
  (sameButton || titleInput).focus();
}

function deleteTask(id) {
  tasks = tasks.filter(function (item) { return item.id !== id; });
  saveTasks();
  renderTasks();
  announce("Task deleted.");
  titleInput.focus();   // the deleted button is gone, so move focus somewhere useful
}

/* ---------- Drawing the page ---------- */

/* Returns only the tasks the current filter should show. */
function getVisibleTasks() {
  if (currentFilter === "pending") {
    return tasks.filter(function (task) { return !task.completed; });
  }
  if (currentFilter === "completed") {
    return tasks.filter(function (task) { return task.completed; });
  }
  return tasks;
}

/* Turns "2026-11-20" into a readable local date, e.g. "20 Nov 2026". */
function formatDueDate(isoDate) {
  const parts = isoDate.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  if (parts.length !== 3 || Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) {
    return false;
  }
  const today = new Date();
  const todayText = today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");
  return task.dueDate < todayText;   // YYYY-MM-DD strings compare correctly as text
}

/* Builds the <li> for one task. All user text goes in with textContent,
   so typing something like <script> just shows those characters. */
function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = "task-item" + (task.completed ? " is-complete" : "");

  const text = document.createElement("div");
  text.className = "task-text";

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;
  text.appendChild(title);

  const meta = document.createElement("span");
  meta.className = "task-meta";
  const details = [];
  if (task.course) details.push(task.course);
  if (task.dueDate) details.push("Due " + formatDueDate(task.dueDate));
  details.push(task.completed ? "Completed" : "Pending");
  meta.textContent = details.join(" · ");
  if (isOverdue(task)) {
    const overdue = document.createElement("span");
    overdue.className = "overdue";
    overdue.textContent = " · Overdue";
    meta.appendChild(overdue);
  }
  text.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "btn btn--outline btn--small";
  toggleButton.dataset.action = "toggle";
  toggleButton.dataset.id = task.id;
  toggleButton.textContent = task.completed ? "Reopen" : "Mark complete";
  toggleButton.setAttribute("aria-label",
    (task.completed ? "Mark as pending: " : "Mark as completed: ") + task.title);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn btn--danger btn--small";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.id = task.id;
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", "Delete task: " + task.title);

  actions.append(toggleButton, deleteButton);
  item.append(text, actions);
  return item;
}

/* Redraws the counts, the filter buttons and the list from the array. */
function renderTasks() {
  const completedCount = tasks.filter(function (task) { return task.completed; }).length;
  document.getElementById("count-total").textContent = tasks.length;
  document.getElementById("count-completed").textContent = completedCount;
  document.getElementById("count-pending").textContent = tasks.length - completedCount;

  filterButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter));
  });

  taskList.textContent = "";   // remove the old list items
  const visibleTasks = getVisibleTasks();
  visibleTasks.forEach(function (task) {
    taskList.appendChild(createTaskElement(task));
  });

  // Show a helpful message when there is nothing to list.
  if (visibleTasks.length === 0) {
    if (tasks.length === 0) {
      emptyState.textContent = "No tasks yet. Add your first assignment, reading or revision task using the form.";
    } else if (currentFilter === "pending") {
      emptyState.textContent = "Nothing pending – every task is completed. Well done!";
    } else {
      emptyState.textContent = "No completed tasks yet. Mark a task complete when you finish it.";
    }
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }
}

function announce(message) {
  statusMessage.textContent = message;
}

/* ---------- Event listeners ---------- */

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (title === "") {
    titleError.textContent = "Please enter a task title (spaces on their own don’t count).";
    titleInput.setAttribute("aria-invalid", "true");
    titleInput.focus();
    return;
  }

  titleError.textContent = "";
  titleInput.removeAttribute("aria-invalid");

  addTask(title, courseInput.value.trim(), dueInput.value);
  announce("Task added: " + title);
  taskForm.reset();
  titleInput.focus();
});

// Clear the error as soon as the user starts typing a real title.
titleInput.addEventListener("input", function () {
  if (titleInput.value.trim() !== "") {
    titleError.textContent = "";
    titleInput.removeAttribute("aria-invalid");
  }
});

/* One listener on the list handles every task's buttons ("event delegation"),
   so buttons created later by renderTasks work without extra listeners. */
taskList.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  if (button.dataset.action === "toggle") {
    toggleTask(button.dataset.id);
  } else if (button.dataset.action === "delete") {
    deleteTask(button.dataset.id);
  }
});

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

/* ---------- Start ---------- */
tasks = loadTasks();
renderTasks();
