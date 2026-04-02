// ─── Firebase Configuration ──────────────────────────────────────────────────
// Replace these placeholder values with your Firebase project's config.
// Find them at: Firebase Console → Project Settings → Your apps → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyCXucffjU4n6TfvnusJikD2aoeRLPxldoU",
  authDomain: "todo-25b76.firebaseapp.com",
  projectId: "todo-25b76",
  storageBucket: "todo-25b76.firebasestorage.app",
  messagingSenderId: "865032794041",
  appId: "1:865032794041:web:34606a380b598f6a425068"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const todosRef = db.collection("todos");

// ─── Data Model ───────────────────────────────────────────────────────────────
// Todo item shape:
// {
//   id: string (Firestore doc ID),
//   text: string (cleaned text with date phrase removed),
//   dueDate: string | null (ISO date string, e.g. "2026-04-06"),
//   completed: boolean,
//   createdAt: Firestore.Timestamp,
// }

// ─── Firebase Persistence ─────────────────────────────────────────────────────

/**
 * Set up a real-time listener on the todos collection.
 * Calls `onUpdate(todos)` whenever data changes.
 * Returns the unsubscribe function.
 */
function loadTodos(onUpdate) {
  return todosRef
    .orderBy("createdAt", "asc")
    .onSnapshot((snapshot) => {
      const todos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      onUpdate(todos);
    });
}

/** Add a new todo. Parses due date from free-form text. */
async function addTodo(rawText) {
  const trimmed = rawText.trim();
  if (!trimmed) return false;

  const { cleanText, dueDate } = parseDueDate(trimmed);

  try {
    await todosRef.add({
      text: cleanText,
      dueDate: dueDate,        // ISO date string or null
      completed: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("Failed to add todo:", err);
    alert(`Could not save todo: ${err.message}`);
    return false;
  }
}

/** Toggle the completed state of a todo. */
async function toggleTodo(id, completed) {
  try {
    await todosRef.doc(id).update({ completed });
  } catch (err) {
    console.error("Failed to toggle todo:", err);
    alert(`Could not update todo: ${err.message}`);
  }
}

/** Permanently delete a todo. */
async function deleteTodo(id) {
  try {
    await todosRef.doc(id).delete();
  } catch (err) {
    console.error("Failed to delete todo:", err);
    alert(`Could not delete todo: ${err.message}`);
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────

const todoListEl = document.getElementById("todo-list");
const emptyStateEl = document.getElementById("empty-state");

function renderTodoItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item" + (todo.completed ? " completed" : "");
  li.dataset.id = todo.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.addEventListener("change", () => toggleTodo(todo.id, checkbox.checked));

  const textSpan = document.createElement("span");
  textSpan.className = "todo-text";
  textSpan.textContent = todo.text;

  const dueDateSpan = document.createElement("span");
  dueDateSpan.className = "due-date";
  if (todo.dueDate) {
    dueDateSpan.textContent = formatDueDate(todo.dueDate);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "×";
  deleteBtn.setAttribute("aria-label", "Delete todo");
  deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

  li.appendChild(checkbox);
  li.appendChild(textSpan);
  if (todo.dueDate) li.appendChild(dueDateSpan);
  li.appendChild(deleteBtn);

  return li;
}

function renderTodoList(todos) {
  todoListEl.innerHTML = "";
  if (todos.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }
  emptyStateEl.hidden = true;
  todos.forEach((todo) => todoListEl.appendChild(renderTodoItem(todo)));
}

// ─── TodoInput ────────────────────────────────────────────────────────────────

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value;
  const added = await addTodo(text);
  if (added) {
    input.value = "";
    input.focus();
  } else {
    // Empty or whitespace — keep focus, don't add
    input.focus();
  }
});

// ─── App Init ─────────────────────────────────────────────────────────────────

firebase.auth().signInAnonymously()
  .then(() => loadTodos(renderTodoList))
  .catch((err) => {
    console.error("Auth failed:", err);
    alert(`Authentication failed: ${err.message}\n\nMake sure Anonymous Auth is enabled in your Firebase Console (Authentication → Sign-in method → Anonymous).`);
  });
