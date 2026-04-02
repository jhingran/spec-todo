## Context

A todo list is a self-contained feature with no existing implementation. The persistence mechanism is Firebase and the frontend app should run on github pages; this design covers decisions applicable to a typical web application context.

## Goals / Non-Goals

**Goals:**
- Provide CRUD operations for todo items (create, read, update/complete, delete)
- Persist todos across page refreshes
- Keep the implementation simple and self-contained

**Non-Goals:**
- Multi-user support or sharing
- Categories, tags, priorities, or due dates

## Decisions

**1. Persistence in Firebase**
- Store todos as documents in a Firestore `todos` collection
- Real-time `onSnapshot` listener keeps the UI in sync without polling

**2. Anonymous authentication**
- The app calls `firebase.auth().signInAnonymously()` on load before accessing Firestore
- Why: Firestore rules require `request.auth != null`, blocking unauthenticated access
- Each browser session gets a persistent anonymous identity automatically — no login UI needed
- Alternative considered: open rules (`if true`) — rejected because anyone with the project ID could read/write

**3. Firestore security rules**
- Rules defined in `firestore.rules`, deployed via `firebase deploy --only firestore:rules`
- Rule: `allow read, write: if request.auth != null` — any signed-in user (including anonymous) can access the `todos` collection
- Deployed to Firebase; also loaded by the emulator for local testing

**4. Flat data model**
Each todo item is a Firestore document:
```json
{ "text": "...", "dueDate": "YYYY-MM-DD | null", "completed": false, "createdAt": "<Timestamp>" }
```
- Firestore generates the document ID; `createdAt` uses `serverTimestamp()` for consistent ordering

**5. Component structure (vanilla JS)**
- `TodoApp` — signs in anonymously, sets up Firestore listener, owns state
- `TodoInput` — controlled input + submit button for adding items
- `TodoList` — renders list of `TodoItem` components
- `TodoItem` — checkbox (toggle complete), label, due date badge, delete button

## Risks / Trade-offs

- **Anonymous sessions are per-browser** — todos are not shared across devices; acceptable per non-goals
- **Anonymous auth can be lost** if the user clears browser storage; no recovery path in v1


