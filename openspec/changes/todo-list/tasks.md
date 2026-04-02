## 1. Project Setup & Data Model

- [x] 1.1 Create project file structure (index.html, style.css, app.js, dateParser.js)
- [x] 1.2 Define the todo item data structure (`id`, `text`, `dueDate`, `completed`, `createdAt`)
- [x] 1.3 Set up Firebase config placeholder and initialize Firestore

## 2. Due Date Parsing

- [x] 2.1 Implement `parseDueDate(text)` — extract and parse a due date from free-form text input
- [x] 2.2 Implement `formatDueDate(date)` — format a parsed date as DD/MM for display

## 3. Firebase Persistence & Auth

- [x] 3.1 Implement `loadTodos()` — real-time listener on Firestore `todos` collection
- [x] 3.2 Implement `addTodo(text)` — parse due date, generate ID, write to Firestore
- [x] 3.3 Implement `toggleTodo(id, completed)` — update `completed` field in Firestore
- [x] 3.4 Implement `deleteTodo(id)` — delete document from Firestore
- [x] 3.5 Add anonymous auth — `signInAnonymously()` on app load before accessing Firestore
- [x] 3.6 Define `firestore.rules` with `allow read, write: if request.auth != null`
- [x] 3.7 Deploy rules via `firebase deploy --only firestore:rules --project todo-25b76`
- [x] 3.8 Enable Anonymous Auth in Firebase Console (Authentication → Sign-in method → Anonymous)

## 4. Core UI

- [x] 4.1 Render `TodoInput` — text input with submit handler, rejects empty/whitespace input
- [x] 4.2 Render `TodoItem` — displays text, due date (DD/MM), checkbox, delete button
- [x] 4.3 Render `TodoList` — renders all items or empty-state message
- [x] 4.4 Wire `TodoApp` — owns state from Firestore listener, connects all handlers

## 5. Styling & UX

- [x] 5.1 Apply strikethrough style to completed todo items
- [x] 5.2 Clear input and return focus after successful submission

## 6. Tests & Verification

- [x] 6.1 Write unit tests for `dateParser.js` (Node built-in test runner, no emulator needed)
- [x] 6.2 Write Firebase integration tests using Admin SDK against local emulator (`tests/firebase.test.js`)
- [x] 6.3 Write Firestore rules tests using `@firebase/rules-unit-testing` — enforces rules as browser client would (`tests/rules.test.js`)
- [x] 6.4 Upgrade Java to 21+ (required by Firebase emulator)
- [x] 6.5 Verify empty-input rejection (no todo created, input stays focused)
- [x] 6.6 Verify Firebase persistence: todos survive page reload with completion state
- [x] 6.7 Verify delete removes item immediately from the list
- [x] 6.8 Verify unauthenticated clients are denied by Firestore rules
