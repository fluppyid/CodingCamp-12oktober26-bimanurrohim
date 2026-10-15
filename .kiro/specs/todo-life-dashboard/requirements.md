# Requirements Document

## Introduction

The **To-do List Life Dashboard** is a standalone, client-side web application built with HTML, CSS, and Vanilla JavaScript. It serves as a personal productivity hub accessible directly in any modern browser (Chrome, Firefox, Edge, Safari) without any installation, build tools, or server. All user data is persisted exclusively via the Browser Local Storage API.

The dashboard consolidates four core productivity widgets into a single page:
1. A **Greeting** section that shows the current time, date, and a time-of-day greeting.
2. A **Focus Timer** (Pomodoro-style 25-minute countdown) with Start, Stop, and Reset controls.
3. A **To-Do List** for managing personal tasks.
4. A **Quick Links** panel for launching favorite websites.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Widget**: A self-contained UI section within the Dashboard (Greeting, Focus Timer, To-Do List, Quick Links).
- **Task**: A user-created to-do item stored in Local Storage; has a text description and a completion state.
- **Link**: A user-created Quick Link stored in Local Storage; has a display label and a URL.
- **Local_Storage**: The Browser Local Storage API (`window.localStorage`) used to persist all user data client-side.
- **Timer**: The Focus Timer widget — a 25-minute countdown mechanism.
- **Greeting_Widget**: The UI section displaying the current date, time, and greeting message.
- **Timer_Widget**: The UI section containing the Focus Timer countdown and its controls.
- **TodoList_Widget**: The UI section for adding, editing, completing, and deleting tasks.
- **QuickLinks_Widget**: The UI section for adding, launching, and deleting Quick Links.
- **Session**: A single browser page load; data persisted in Local_Storage survives across sessions.

---

## Requirements

### Requirement 1: Display Current Time and Date

**User Story:** As a user, I want to see the current time and date on the Dashboard, so that I always have an at-a-glance reference without opening another tab.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS format (24-hour or 12-hour with AM/PM indicator), derived from the user's local system clock.
2. THE Greeting_Widget SHALL display the current date in the format "<Full Weekday Name>, DD <Full Month Name> YYYY" (e.g., "Wednesday, 15 October 2026"), derived from the user's local system clock.
3. WHILE the Dashboard is open, THE Greeting_Widget SHALL update the displayed time every 1 second so that it remains accurate.
4. IF the user's local system clock is unavailable or returns an invalid value, THEN THE Greeting_Widget SHALL display a placeholder indicating that the time is unavailable, instead of displaying an incorrect or empty value.

---

### Requirement 2: Display Time-of-Day Greeting

**User Story:** As a user, I want to see a personalized greeting based on the time of day, so that the Dashboard feels welcoming and contextually relevant.

#### Acceptance Criteria

1. WHEN the local hour is between 05:00 and 11:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Morning".
2. WHEN the local hour is between 12:00 and 17:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
3. WHEN the local hour is between 18:00 and 21:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Evening".
4. WHEN the local hour is between 22:00 and 23:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Night".
5. WHEN the local hour is between 00:00 and 04:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Night".
6. WHILE the Dashboard is open, THE Greeting_Widget SHALL re-evaluate and update the greeting within 60 seconds of the local hour changing.
7. IF the local time is unavailable, THEN THE Greeting_Widget SHALL display a neutral fallback greeting (e.g., "Hello") instead of an empty or incorrect string.

---

### Requirement 3: Focus Timer Countdown

**User Story:** As a user, I want a 25-minute countdown timer, so that I can use the Pomodoro technique to manage focused work sessions.

#### Acceptance Criteria

1. THE Timer_Widget SHALL initialise the countdown display to 25:00 (twenty-five minutes, zero seconds) when the Dashboard loads.
2. WHEN the user activates the Start control while the Timer is in a stopped or paused state, THE Timer_Widget SHALL begin counting down from the current displayed time, decrementing the display by one second each second.
3. WHILE the Timer is counting down, THE Timer_Widget SHALL display the remaining time in MM:SS format.
4. WHEN the user activates the Stop control while the Timer is counting down, THE Timer_Widget SHALL pause the countdown and retain the current remaining time on the display.
5. WHEN the user activates the Reset control, THE Timer_Widget SHALL stop any active countdown and reset the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Timer_Widget SHALL stop the countdown automatically and display a visible on-page notification indicating the session is complete, for a minimum of 5 seconds.
7. IF the user activates the Start control when the Timer display already shows 00:00, THEN THE Timer_Widget SHALL reset the countdown to 25:00 before starting.
8. IF the user activates the Start control while the Timer is already counting down, THEN THE Timer_Widget SHALL ignore the activation and continue the current countdown unchanged.

---

### Requirement 4: Add Tasks to the To-Do List

**User Story:** As a user, I want to add new tasks to my to-do list, so that I can track the things I need to do.

#### Acceptance Criteria

1. THE TodoList_Widget SHALL provide a text input field with a maximum length of 200 characters and an Add button for creating new tasks.
2. WHEN the user submits a non-empty task description via the Add button or the Enter key, THE TodoList_Widget SHALL trim leading and trailing whitespace from the description, append the task to the task list with a completion state of "incomplete", clear the input field, and persist the updated task list to Local_Storage.
3. IF the user attempts to submit a task description that is empty or contains only whitespace characters, THEN THE TodoList_Widget SHALL reject the submission, display a validation message immediately below the input field, and leave the input field content unchanged without creating a task.
4. THE TodoList_Widget SHALL persist all tasks to Local_Storage so that tasks survive a page reload.
5. IF the user attempts to add a task when the task list already contains 100 tasks, THEN THE TodoList_Widget SHALL reject the submission and display a validation message immediately below the input field indicating the maximum task limit has been reached.

---

### Requirement 5: Edit Existing Tasks

**User Story:** As a user, I want to edit a task's description after creating it, so that I can correct mistakes or update its wording.

#### Acceptance Criteria

1. THE TodoList_Widget SHALL provide an Edit control for each task in the list.
2. WHEN the user activates the Edit control on a task, THE TodoList_Widget SHALL replace the task's display text with an editable input field pre-filled with the current task description, with a maximum length of 512 characters.
3. WHEN the user confirms the edit (via a Save/Confirm control or the Enter key) with a non-empty value, THE TodoList_Widget SHALL trim leading and trailing whitespace from the edited value, update the task description with the trimmed value, exit edit mode, and persist the change to Local_Storage.
4. IF the user confirms the edit with an empty or whitespace-only value, THEN THE TodoList_Widget SHALL reject the save and display an inline validation message, keeping the task in edit mode.
5. WHEN the user cancels the edit (via a Cancel control or the Escape key), THE TodoList_Widget SHALL discard the changes and restore the original task description.
6. WHEN the user activates the Edit control on a task while another task is already in edit mode, THE TodoList_Widget SHALL automatically cancel the in-progress edit on the previous task (discarding unsaved changes) and open edit mode on the newly selected task.

---

### Requirement 6: Mark Tasks as Done

**User Story:** As a user, I want to mark tasks as complete, so that I can track my progress and distinguish finished work from pending work.

#### Acceptance Criteria

1. THE TodoList_Widget SHALL provide a completion toggle control (e.g., checkbox) for each task, with every new task initialised to the incomplete state.
2. WHEN the user activates the completion toggle on an incomplete task, THE TodoList_Widget SHALL immediately mark the task as complete by applying strikethrough text and reduced opacity, and persist the updated completion state to Local_Storage.
3. WHEN the user activates the completion toggle on a complete task, THE TodoList_Widget SHALL immediately mark the task as incomplete by removing the strikethrough text and reduced opacity, and persist the updated completion state to Local_Storage.
4. IF Local_Storage is unavailable when the user activates the completion toggle, THEN THE TodoList_Widget SHALL revert the toggle to its previous state and display an error message indicating the state could not be saved.

---

### Requirement 7: Delete Tasks

**User Story:** As a user, I want to delete tasks I no longer need, so that my to-do list stays relevant and uncluttered.

#### Acceptance Criteria

1. THE TodoList_Widget SHALL provide a Delete control for each task in the list.
2. WHEN the user activates the Delete control on a task, THE TodoList_Widget SHALL immediately remove the task from the list display.
3. WHEN the user activates the Delete control on a task, THE TodoList_Widget SHALL delete the task from Local_Storage so that it does not reappear on the next page load.
4. IF Local_Storage is unavailable when the user activates the Delete control, THEN THE TodoList_Widget SHALL display an error message indicating the deletion could not be persisted and retain the task in the list.

---

### Requirement 8: Persist Tasks Across Sessions

**User Story:** As a user, I want my tasks to be saved automatically, so that my to-do list is still present when I reopen the Dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard loads and Local_Storage contains a valid tasks array, THE TodoList_Widget SHALL read all tasks from Local_Storage and render them in the list in the order they were last saved, with their persisted completion states. If Local_Storage is empty or contains no tasks key, THE TodoList_Widget SHALL render an empty list.
2. THE TodoList_Widget SHALL write the complete tasks array to Local_Storage as a JSON-serialised array after every mutation (add, delete, edit, or completion state change). IF the Local_Storage write fails, THEN THE TodoList_Widget SHALL display an error message and retain the in-memory task state for the current session.
3. THE TodoList_Widget SHALL store each task as a JSON object with at minimum a text property (string, 1–200 characters) and a completed property (boolean), such that reading the JSON back produces objects with the same property values as were written.
4. IF Local_Storage is unavailable on Dashboard load, THEN THE TodoList_Widget SHALL display a warning message indicating that persistence is unavailable and operate with an empty in-memory task list for the current session.

---

### Requirement 9: Add Quick Links

**User Story:** As a user, I want to add buttons that open my favourite websites, so that I can launch them with a single click from the Dashboard.

#### Acceptance Criteria

1. THE QuickLinks_Widget SHALL provide an input field accepting a label of 1–50 characters, an input field accepting a URL of 1–2048 characters, and an Add button.
2. WHEN the user submits a non-empty label and a valid URL, THE QuickLinks_Widget SHALL add the link as a clickable button to the panel, persist it to Local_Storage, and clear the input fields.
3. WHEN the QuickLinks_Widget initialises, THE QuickLinks_Widget SHALL load and display all previously persisted links from Local_Storage.
4. IF the user submits an empty label or an empty URL, THEN THE QuickLinks_Widget SHALL reject the submission, display an inline validation message indicating which field is empty, and retain the current input field values without creating a link.
5. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE QuickLinks_Widget SHALL reject the submission and display an inline validation message indicating an invalid URL format without creating a link.

---

### Requirement 10: Launch Quick Links

**User Story:** As a user, I want to click a Quick Link button to open the target website, so that I can navigate there without typing the URL.

#### Acceptance Criteria

1. WHEN the user activates a Quick Link button (via click or Enter key), THE QuickLinks_Widget SHALL open the associated URL in a new browser tab.
2. IF the URL associated with a Quick Link is empty or malformed at activation time, THEN THE QuickLinks_Widget SHALL display an error message and shall not attempt to open a new tab.

---

### Requirement 11: Delete Quick Links

**User Story:** As a user, I want to remove Quick Links I no longer need, so that the panel stays organised.

#### Acceptance Criteria

1. THE QuickLinks_Widget SHALL provide a Delete control for each Quick Link displayed in the panel.
2. WHEN the user activates the Delete control on a Quick Link, THE QuickLinks_Widget SHALL remove that Quick Link entry from the panel display and delete its corresponding record from Local_Storage.
3. IF Local_Storage is unavailable when the user activates the Delete control, THEN THE QuickLinks_Widget SHALL display an error message indicating the deletion could not be completed and retain the Quick Link in the panel unchanged.
4. WHEN the user activates the Delete control on a Quick Link, THE QuickLinks_Widget SHALL reflect the removal within 1 second of activation without requiring a page reload.

---

### Requirement 12: Persist Quick Links Across Sessions

**User Story:** As a user, I want my Quick Links to be saved automatically, so that they are still present when I reopen the Dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard loads and Local_Storage contains a valid Quick Links array, THE QuickLinks_Widget SHALL read all Quick Links from Local_Storage and render them in the panel in their saved order. IF Local_Storage contains no Quick Links key or is empty, THE QuickLinks_Widget SHALL render an empty panel.
2. THE QuickLinks_Widget SHALL write the complete Quick Links array to Local_Storage as a JSON-serialised array after every mutation (add or delete). IF the Local_Storage write fails, THEN THE QuickLinks_Widget SHALL display an error message and retain the in-memory Quick Links state for the current session.
3. THE QuickLinks_Widget SHALL store each Quick Link as a JSON object with at minimum a label property (string, 1–50 characters) and a url property (string, 1–2048 characters), such that reading the JSON back produces objects with the same property values as were written.
4. IF Local_Storage is unavailable on Dashboard load, THEN THE QuickLinks_Widget SHALL display a warning message indicating that persistence is unavailable and operate with an empty in-memory Quick Links list for the current session.
5. IF the Quick Links data in Local_Storage is corrupt or cannot be parsed as JSON, THEN THE QuickLinks_Widget SHALL discard the corrupt data, display a warning message to the user, and render an empty panel.

---

### Requirement 13: Responsive and Accessible Layout

**User Story:** As a user, I want the Dashboard to be readable and usable on different screen sizes, so that I can use it on both desktop and smaller displays.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four widgets using a single-column layout for viewport widths ≤600px, a two-column layout for viewport widths between 601px and 1024px inclusive, and a four-column layout for viewport widths ≥1025px, with no horizontal scrolling or overlapping content at any breakpoint.
2. THE Dashboard SHALL use a minimum font size of 14px for all visible text elements including labels, buttons, inputs, and captions.
3. THE Dashboard SHALL meet a minimum contrast ratio of 4.5:1 for normal text (below 18px regular or 14px bold) and a minimum contrast ratio of 3:1 for large text (18px or above regular, or 14px or above bold) between text and background colours.
4. THE Dashboard SHALL provide a minimum touch target size of 44×44 CSS pixels for all interactive elements (buttons, checkboxes, input fields, links).

---

### Requirement 14: Client-Side Only Data Storage

**User Story:** As a user, I want all my data to stay in my browser, so that my tasks and links are never sent to any external server.

#### Acceptance Criteria

1. THE Dashboard SHALL store all user-generated data (tasks and Quick Links) exclusively in Local_Storage, with no network requests made for any data read, write, update, or delete operation.
2. WHILE the Dashboard is operating without an internet connection, THE Dashboard SHALL support all task and Quick Link operations (add, edit, delete, complete, and display) using Local_Storage only, with the sole exception that activating a Quick Link button to open its URL requires an internet connection.
3. IF a Local_Storage write operation fails because the storage quota has been exceeded, THEN THE Dashboard SHALL display an error message informing the user that the storage limit has been reached and that no previously saved data has been discarded.

---

### Requirement 15: Cross-Browser Compatibility

**User Story:** As a user, I want the Dashboard to work in any modern browser, so that I am not restricted to a specific browser.

#### Acceptance Criteria

1. THE Dashboard SHALL, in the latest stable release of Chrome, Firefox, Edge, and Safari available at time of testing, correctly render all UI elements, respond to all user interactions, and successfully read from and write to Local_Storage.
2. THE Dashboard SHALL use only Web APIs (DOM, Local Storage, setInterval, Date) that are available natively in all four target browsers without requiring a browser-specific workaround.
3. IF the Dashboard is opened in a browser that does not support the Local Storage API, THEN THE Dashboard SHALL display a visible warning message indicating that the browser is unsupported and that data cannot be persisted.
