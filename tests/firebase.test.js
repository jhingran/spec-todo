/**
 * Firebase / Firestore integration tests.
 * Runs against the local Firestore emulator — does NOT touch your real database.
 *
 * Prerequisites (run once):
 *   npx firebase init emulators   (select Firestore, accept default port 8080)
 *
 * To run:
 *   Terminal 1: npx firebase emulators:start --only firestore
 *   Terminal 2: npm test
 */

const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// Point the Admin SDK at the local emulator instead of real Firebase.
// Must be set before firebase-admin is initialised.
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

const admin = require("firebase-admin");

// Initialise with a dummy project ID — emulator doesn't validate credentials.
admin.initializeApp({ projectId: "todo-25b76" });
const db = admin.firestore();
const todosRef = db.collection("todos");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a todo document directly via Admin SDK (mirrors app.js addTodo logic). */
async function createTodo(text, dueDate = null) {
  const ref = await todosRef.add({
    text,
    dueDate,
    completed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/** Fetch a single todo by id. */
async function getTodo(id) {
  const doc = await todosRef.doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/** Delete all docs in the todos collection (test isolation). */
async function clearTodos() {
  const snap = await todosRef.get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

before(async () => {
  // Verify emulator is reachable before running any tests.
  try {
    await db.collection("_ping").doc("_ping").set({ ok: true });
    await db.collection("_ping").doc("_ping").delete();
  } catch (err) {
    console.error(
      "\n[firebase.test.js] Could not reach Firestore emulator at 127.0.0.1:8080.\n" +
      "Start it with: npx firebase emulators:start --only firestore\n"
    );
    process.exit(1);
  }
});

beforeEach(async () => {
  await clearTodos();
});

after(async () => {
  await admin.app().delete();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("addTodo — store a new todo", () => {
  test("creates document with correct fields", async () => {
    const id = await createTodo("call AT&T", "2026-04-06");
    const todo = await getTodo(id);

    assert.ok(todo, "document should exist");
    assert.equal(todo.text, "call AT&T");
    assert.equal(todo.dueDate, "2026-04-06");
    assert.equal(todo.completed, false);
    assert.ok(todo.createdAt, "createdAt should be set");
  });

  test("creates document with null dueDate when no date given", async () => {
    const id = await createTodo("buy groceries");
    const todo = await getTodo(id);

    assert.equal(todo.dueDate, null);
  });

  test("multiple todos are all stored independently", async () => {
    await createTodo("task one");
    await createTodo("task two");
    await createTodo("task three");

    const snap = await todosRef.get();
    assert.equal(snap.size, 3);
  });
});

describe("loadTodos — read all todos", () => {
  test("returns todos ordered by createdAt ascending", async () => {
    // Insert sequentially to guarantee ordering
    await createTodo("first");
    await new Promise((r) => setTimeout(r, 50));
    await createTodo("second");
    await new Promise((r) => setTimeout(r, 50));
    await createTodo("third");

    const snap = await todosRef.orderBy("createdAt", "asc").get();
    const texts = snap.docs.map((d) => d.data().text);

    assert.deepEqual(texts, ["first", "second", "third"]);
  });

  test("returns empty array when no todos exist", async () => {
    const snap = await todosRef.get();
    assert.equal(snap.size, 0);
  });
});

describe("toggleTodo — update completed state", () => {
  test("marks an incomplete todo as complete", async () => {
    const id = await createTodo("run 5 miles");
    await todosRef.doc(id).update({ completed: true });

    const todo = await getTodo(id);
    assert.equal(todo.completed, true);
  });

  test("marks a complete todo back to incomplete", async () => {
    const id = await createTodo("run 5 miles");
    await todosRef.doc(id).update({ completed: true });
    await todosRef.doc(id).update({ completed: false });

    const todo = await getTodo(id);
    assert.equal(todo.completed, false);
  });

  test("toggling does not change text or dueDate", async () => {
    const id = await createTodo("dentist", "2026-04-03");
    await todosRef.doc(id).update({ completed: true });

    const todo = await getTodo(id);
    assert.equal(todo.text, "dentist");
    assert.equal(todo.dueDate, "2026-04-03");
  });
});

describe("deleteTodo — remove a todo", () => {
  test("deletes the document permanently", async () => {
    const id = await createTodo("temporary task");
    await todosRef.doc(id).delete();

    const todo = await getTodo(id);
    assert.equal(todo, null, "document should no longer exist");
  });

  test("deleting one todo does not affect others", async () => {
    const id1 = await createTodo("keep me");
    const id2 = await createTodo("delete me");

    await todosRef.doc(id2).delete();

    const snap = await todosRef.get();
    assert.equal(snap.size, 1);
    assert.equal(snap.docs[0].id, id1);
  });
});

describe("persistence — data survives a new connection", () => {
  test("todo written in one session is readable in a new db instance", async () => {
    const id = await createTodo("persist me", "2026-04-06");

    // Simulate a new session with a fresh Firestore reference
    const db2 = admin.firestore();
    const doc = await db2.collection("todos").doc(id).get();

    assert.ok(doc.exists, "todo should exist in new session");
    assert.equal(doc.data().text, "persist me");
    assert.equal(doc.data().dueDate, "2026-04-06");
  });
});
