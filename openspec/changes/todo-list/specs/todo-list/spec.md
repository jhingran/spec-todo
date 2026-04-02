## ADDED Requirements

### Requirement: Add a todo item
The system SHALL allow users to create a new todo item by entering text and submitting.
The user will enter the date the task is due in free form, like "run 5 miles this weekend", or "call AT&T by April 6th". The due date must be parsed and separated

#### Scenario: Successful add
- **WHEN** user enters non-empty text in the input field and submits
- **THEN** a new todo item SHALL appear in the list with the entered text, marked as incomplete

#### Scenario: Empty input rejected
- **WHEN** user submits with an empty or whitespace-only input
- **THEN** no todo item SHALL be created and the input SHALL remain focused

### Requirement: Display todo items
The system SHALL display all existing todo items in the order they were created. And display their parsed due date in the US format of DD/MM

#### Scenario: List shown on load
- **WHEN** the application loads
- **THEN** all previously saved todo items SHALL be displayed

#### Scenario: Empty state
- **WHEN** no todo items exist
- **THEN** the system SHALL display an empty-state message indicating no todos

### Requirement: Mark todo as complete
The system SHALL allow users to toggle the completion status of a todo item.

#### Scenario: Mark complete
- **WHEN** user toggles the checkbox on an incomplete todo
- **THEN** the todo SHALL be visually marked as complete (e.g., strikethrough text)

#### Scenario: Mark incomplete
- **WHEN** user toggles the checkbox on a complete todo
- **THEN** the todo SHALL revert to the incomplete visual state

### Requirement: Delete a todo item
The system SHALL allow users to permanently remove a todo item.

#### Scenario: Delete item
- **WHEN** user clicks the delete control on a todo item
- **THEN** the todo item SHALL be removed from the list immediately

### Requirement: Persist todos across sessions
The system SHALL save todo items to Firebase so they survive page refreshes.

#### Scenario: Persistence on reload
- **WHEN** user adds or modifies todos and then reloads the page
- **THEN** the same todo items SHALL be present with their completion state intact

### Requirement: Authenticate before accessing data
The system SHALL sign the user in anonymously on load before reading or writing any todos.

#### Scenario: Silent sign-in on load
- **WHEN** the application loads
- **THEN** the system SHALL complete anonymous sign-in before rendering or accepting any todos

#### Scenario: Auth failure surfaced to user
- **WHEN** anonymous sign-in fails (e.g. Anonymous Auth not enabled in Firebase Console)
- **THEN** the system SHALL display an error message explaining the failure and that Anonymous Auth must be enabled

### Requirement: Block unauthenticated access
The system SHALL enforce Firestore security rules that deny all reads and writes from unauthenticated clients.

#### Scenario: Unauthenticated write rejected
- **WHEN** a client without a valid auth token attempts to write to the `todos` collection
- **THEN** Firestore SHALL reject the request with a permission-denied error

#### Scenario: Unauthenticated read rejected
- **WHEN** a client without a valid auth token attempts to read the `todos` collection
- **THEN** Firestore SHALL reject the request with a permission-denied error
