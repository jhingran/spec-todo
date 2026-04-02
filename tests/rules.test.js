/**
 * Firestore security rules tests.
 * Uses @firebase/rules-unit-testing — runs the CLIENT SDK against the emulator,
 * so rules are enforced exactly as they would be in the browser.
 *
 * This is what firebase.test.js (Admin SDK) cannot catch: permission errors.
 *
 * Prerequisites:
 *   npx firebase emulators:start --only firestore
 */

const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const PROJECT_ID = "todo-25b76";
const RULES_PATH = resolve(__dirname, "../firestore.rules");

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Firestore client as an unauthenticated user (what the browser app uses today). */
function unauthClient() {
  return testEnv.unauthenticatedContext().firestore();
}

/** Firestore client as an authenticated user (for future auth-gated rules). */
function authClient(uid = "user-abc") {
  return testEnv.authenticatedContext(uid).firestore();
}

function todosCol(db) {
  return db.collection("todos");
}

const sampleTodo = {
  text: "call AT&T",
  dueDate: "2026-04-06",
  completed: false,
  createdAt: new Date(),
};

// ─── Current rules: open read/write ──────────────────────────────────────────

describe("rules — unauthenticated client (current app behaviour)", () => {
  test("can create a todo", async () => {
    const db = unauthClient();
    await assertSucceeds(todosCol(db).add(sampleTodo));
  });

  test("can read todos", async () => {
    // Seed a doc via admin so the read has something to return
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("todos").add(sampleTodo);
    });

    const db = unauthClient();
    await assertSucceeds(todosCol(db).get());
  });

  test("can update a todo", async () => {
    let docId;
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await ctx.firestore().collection("todos").add(sampleTodo);
      docId = ref.id;
    });

    const db = unauthClient();
    await assertSucceeds(todosCol(db).doc(docId).update({ completed: true }));
  });

  test("can delete a todo", async () => {
    let docId;
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await ctx.firestore().collection("todos").add(sampleTodo);
      docId = ref.id;
    });

    const db = unauthClient();
    await assertSucceeds(todosCol(db).doc(docId).delete());
  });
});

// ─── Placeholder: what rules SHOULD look like with auth ──────────────────────
// These tests are skipped for now. When you add authentication, change the
// rules to `allow read, write: if request.auth != null` and unskip them.

describe("rules — what auth-gated rules would enforce (skipped until auth added)", () => {
  // To activate: update firestore.rules to require auth, then remove the
  // `if (true) return` lines below.

  test("unauthenticated user cannot create a todo (with auth rules)", async () => {
    if (true) return; // remove this line after adding auth to the app
    const db = unauthClient();
    await assertFails(todosCol(db).add(sampleTodo));
  });

  test("authenticated user can create a todo (with auth rules)", async () => {
    if (true) return;
    const db = authClient();
    await assertSucceeds(todosCol(db).add(sampleTodo));
  });

  test("authenticated user can read their todos (with auth rules)", async () => {
    if (true) return;
    const db = authClient();
    await assertSucceeds(todosCol(db).get());
  });

  test("unauthenticated user cannot read todos (with auth rules)", async () => {
    if (true) return;
    const db = unauthClient();
    await assertFails(todosCol(db).get());
  });
});
