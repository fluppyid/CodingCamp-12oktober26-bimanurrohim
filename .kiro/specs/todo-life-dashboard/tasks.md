# Implementation Plan: Todo Life Dashboard

## Overview

Implement a single-page, client-side productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. All logic lives in three files (`index.html`, `css/style.css`, `js/app.js`) with no build step or framework. Data is persisted exclusively via `window.localStorage`. The implementation follows the five-module architecture defined in the design: `StorageModule`, `GreetingModule`, `TimerModule`, `TodoModule`, and `QuickLinksModule`, wired together by a `DOMContentLoaded` bootstrap block.

---

## Tasks

- [x] 1. Project scaffolding — create the three static files with skeleton structure
  - [x] 1.1 Create `index.html` with full page skeleton
    - Create the file at `todo-life-dashboard/index.html`
    - Add `<!DOCTYPE html>`, `<html lang="en">`, `<head>` (charset, viewport, title), and `<body>`
    - Link `css/style.css` inside `<head>` and `js/app.js` at the bottom of `<body>`
    - Add a `<main class="dashboard-grid">` container holding four `<section>` elements, each with a unique `id` (`greeting-widget`, `timer-widget`, `todo-widget`, `quicklinks-widget`) and an `<h2>` heading
    - Include a `<div id="storage-warning" role="alert" hidden></div>` banner at the top of `<body>` for the global LocalStorage-unavailable warning
    - _Requirements: 1.1, 13.1_

  - [x] 1.2 Create `css/style.css` with CSS reset and grid skeleton
    - Create the file at `todo-life-dashboard/css/style.css`
    - Add a minimal CSS reset (`box-sizing: border-box`, `margin: 0`, `padding: 0`)
    - Set `body { font-size: 14px; }` (minimum font size, Req 13.2)
    - Add `.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; padding: 1rem; }`
    - Add explicit media-query overrides: single column at `max-width: 600px`, two columns at `601px–1024px`, four columns at `min-width: 1025px`
    - Add placeholder widget `<section>` styles (background, border-radius, padding) so the layout is visible during development
    - _Requirements: 13.1, 13.2_

  - [x] 1.3 Create `js/app.js` with module skeleton and bootstrap block
    - Create the file at `todo-life-dashboard/js/app.js`
    - Declare the five empty `const` object literals in order: `StorageModule`, `GreetingModule`, `TimerModule`, `TodoModule`, `QuickLinksModule`
    - Add the `DOMContentLoaded` bootstrap block that calls `GreetingModule.init(...)`, `TimerModule.init(...)`, `TodoModule.init(...)`, `QuickLinksModule.init(...)` passing the relevant `<section>` element as `rootEl`
    - Add the `window.__TEST_MODE__` guard block at the bottom (empty `window.__test = {}` object for now)
    - _Requirements: 14.1, 15.2_

- [x] 2. Implement `StorageModule`
  - [x] 2.1 Implement `StorageModule.isAvailable()`
    - Write the probe: attempt `localStorage.setItem('__probe__', '1')` then `removeItem`; return `true` on success, `false` on any thrown exception
    - _Requirements: 14.1, 15.3_

  - [x] 2.2 Implement `StorageModule.load(key)`
    - Return `[]` immediately if `isAvailable()` is `false`
    - Call `localStorage.getItem(key)`; return `[]` if result is `null`
    - Wrap `JSON.parse` in a try/catch; on `SyntaxError` call `console.warn` with the key name and return `[]`
    - Return `[]` if the parsed value is not an `Array`; otherwise return the parsed array
    - _Requirements: 8.1, 12.1, 12.5_

  - [x] 2.3 Implement `StorageModule.save(key, data)`
    - Return `{ ok: false, error: 'unavailable' }` if `isAvailable()` is `false`
    - Wrap `localStorage.setItem(key, JSON.stringify(data))` in a try/catch
    - Catch `DOMException` with name `QuotaExceededError` (or `NS_ERROR_DOM_QUOTA_REACHED` for Firefox) and return `{ ok: false, error: 'quota' }`
    - Return `{ ok: false, error: 'unknown' }` for any other exception
    - Return `{ ok: true }` on success
    - _Requirements: 8.2, 12.2, 14.3_

  - [x] 2.4 Expose `StorageModule` functions on `window.__test`
    - Inside the `window.__TEST_MODE__` guard, assign `storageLoad`, `storageSave`, `storageIsAvailable` from the module
    - _Requirements: (testing infrastructure)_

- [x] 3. Implement `GreetingModule`
  - [x] 3.1 Implement `GreetingModule.getGreetingForHour(hour)`
    - Implement the four-branch logic from the design: 5–11 → "Good Morning", 12–17 → "Good Afternoon", 18–21 → "Good Evening", all other hours (0–4, 22–23) → "Good Night"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Implement `GreetingModule.formatTime(date)` and `GreetingModule.formatDate(date)`
    - `formatTime`: return `"HH:MM:SS"` 24-hour string using `getHours()`, `getMinutes()`, `getSeconds()` each zero-padded to 2 digits; if `date` is invalid return `"--:--:--"`
    - `formatDate`: return `"<Full Weekday>, DD <Full Month> YYYY"` (e.g. "Wednesday, 15 October 2026") using the `en-GB` locale arrays or `Intl.DateTimeFormat`; if `date` is invalid return `"Date unavailable"`
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 3.3 Implement `GreetingModule.init(rootEl)` with live clock loop
    - Query the three DOM targets inside `rootEl` (time display, date display, greeting display)
    - Define an inner `_update()` function: call `new Date()`, validate it is a valid `Date`, then write `formatTime`, `formatDate`, `getGreetingForHour` results to the DOM; on invalid date write placeholder strings per Req 1.4 / 2.7
    - Call `_update()` immediately, then `setInterval(_update, 1000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1–2.7_

  - [ ]* 3.4 Write property test — Property 1: Greeting covers all hours
    - **Property 1: Greeting covers all hours**
    - Use `fc.integer({ min: 0, max: 23 })` to generate any hour
    - Assert `getGreetingForHour(hour)` is one of the four valid strings and is non-empty
    - Tag: `// Feature: todo-life-dashboard, Property 1: Greeting covers all hours`
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [ ]* 3.5 Write property test — Property 2: Greeting stable within time slot
    - **Property 2: Greeting stable within time slot**
    - Generate two hours from the same slot using `fc.integer` filtered to each of the four slot ranges
    - Assert that both return the same greeting string
    - Tag: `// Feature: todo-life-dashboard, Property 2: Greeting stable within time slot`
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 4. Implement `TimerModule`
  - [x] 4.1 Implement `TimerModule.formatMMSS(totalSeconds)`
    - Compute `MM = Math.floor(totalSeconds / 60)` and `SS = totalSeconds % 60`, each zero-padded to 2 digits
    - Return the string `"MM:SS"`
    - _Requirements: 3.1, 3.3_

  - [x] 4.2 Implement `TimerModule.init(rootEl)` with internal state and controls
    - Declare closure variables: `remainingSeconds = 1500`, `intervalId = null`, `isRunning = false`
    - Query DOM elements inside `rootEl`: display element, Start button, Stop button, Reset button, notification area
    - Define `_renderDisplay()` that writes `formatMMSS(remainingSeconds)` to the display element
    - Define `_onComplete()`: clear `intervalId`, set `isRunning = false`, show the notification element (add a visible class or set `textContent`), use `setTimeout` to hide it after 5 seconds; the notification element MUST have `role="alert"` so screen readers announce it
    - Define `_tick()`: guard `remainingSeconds <= 0` → call `_onComplete()` and return; otherwise decrement `remainingSeconds` and call `_renderDisplay()`
    - Define `_start()`: guard `isRunning` → return (Req 3.8); if `remainingSeconds === 0` call `_reset()` (Req 3.7); set `isRunning = true`, start `setInterval(_tick, 1000)`, update button states
    - Define `_stop()`: if not running return; clear interval, set `isRunning = false`, update button states (Req 3.4)
    - Define `_reset()`: clear interval, `isRunning = false`, `remainingSeconds = 1500`, call `_renderDisplay()`, update button states (Req 3.5)
    - Wire Start, Stop, Reset button click events to `_start`, `_stop`, `_reset`
    - Call `_renderDisplay()` on init to show `25:00`
    - _Requirements: 3.1–3.8_

  - [ ]* 4.3 Write property test — Property 9: `formatMMSS` math correctness
    - **Property 9: formatMMSS is consistent with total seconds**
    - Use `fc.integer({ min: 0, max: 1500 })`
    - Assert the returned string matches `/^\d{2}:\d{2}$/` and that the numeric values equal `Math.floor(s/60)` and `s % 60`
    - Tag: `// Feature: todo-life-dashboard, Property 9: formatMMSS math correctness`
    - **Validates: Requirements 3.1, 3.3**

- [x] 5. Checkpoint — storage, greeting, and timer
  - Ensure `index.html` opens in a browser and shows the live clock, date, greeting, and a `25:00` timer that starts, stops, and resets correctly.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement `TodoModule`
  - [x] 6.1 Implement `TodoModule.validateTaskDescription(raw)`
    - Trim `raw`; return `{ ok: false, error: "..." }` if trimmed length is 0 or > 200
    - Return `{ ok: true, trimmed }` otherwise
    - _Requirements: 4.2, 4.3, 5.3, 5.4_

  - [x] 6.2 Implement `TodoModule.init(rootEl)` — load, render, and add task
    - Declare closure variables: `let tasks = []`, `let editingId = null`
    - On init: check `StorageModule.isAvailable()`; if false display a warning in the widget's alert area; otherwise call `StorageModule.load('tasks')` and assign to `tasks`
    - Build the "add task" form inside `rootEl`: a `<input type="text" maxlength="200">`, an Add `<button>`, and a `<div role="alert" class="validation-msg">` for inline messages
    - Define `_persist()`: call `StorageModule.save('tasks', tasks)`; on `{ ok: false, error: 'quota' }` display "Storage limit reached — data was not saved"; on other failure display a generic save-error message
    - Define `_addTask(description)`: validate via `validateTaskDescription`; on failure show the validation message and return; check `tasks.length >= 100` and display limit message (Req 4.5); push a new task object `{ id: crypto.randomUUID?.() ?? Date.now().toString(), text: trimmed, completed: false, createdAt: Date.now() }` to `tasks`; call `_renderList()` then `_persist()`; clear the input
    - Wire the Add button click and the input `keydown` Enter to `_addTask`
    - Call `_renderList()` on init
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4_

  - [x] 6.3 Implement `_renderList()` — full DOM re-render of task list
    - Clear the task list container, then for each task in `tasks` create a `<li>` with:
      - A `<input type="checkbox">` pre-checked per `task.completed` (completion toggle)
      - A `<span>` for task text, with `class="completed"` (strikethrough + reduced opacity) when `task.completed` is `true`
      - An Edit `<button aria-label="Edit task">` (hidden while `editingId === task.id`)
      - A Delete `<button aria-label="Delete task">`
    - Wire checkbox `change` → `_toggleComplete(task.id)`
    - Wire Edit button `click` → `_activateEdit(task.id)`
    - Wire Delete button `click` → `_deleteTask(task.id)`
    - _Requirements: 6.1, 6.2, 6.3, 7.1_

  - [x] 6.4 Implement `_toggleComplete(id)`, `_deleteTask(id)`, and edit-mode functions
    - `_toggleComplete(id)`: flip `task.completed`; call `_renderList()` then `_persist()`; if `_persist()` returns failure revert the flip, call `_renderList()`, and show an error message (Req 6.4)
    - `_deleteTask(id)`: remove task from `tasks` array; call `_renderList()` then `_persist()`; if `_persist()` returns failure restore the task, call `_renderList()`, and show an error message (Req 7.4)
    - `_activateEdit(id)`: if `editingId !== null && editingId !== id` call `_cancelEdit(editingId)` first (Req 5.6); set `editingId = id`; call `_renderList()` to switch the task row into edit mode (replace text `<span>` with an `<input maxlength="512">` pre-filled with current text, Save and Cancel buttons)
    - `_saveEdit(id)`: validate trimmed value (non-empty); on failure show inline message and stay in edit mode (Req 5.4); update `task.text`, set `editingId = null`, call `_renderList()` then `_persist()`
    - `_cancelEdit(id)`: set `editingId = null`; call `_renderList()` (Req 5.5)
    - Wire Save button click and input `keydown` Enter to `_saveEdit`; wire Cancel button click and `keydown` Escape to `_cancelEdit`
    - _Requirements: 5.1–5.6, 6.2–6.4, 7.2–7.4_

  - [x] 6.5 Expose `validateTaskDescription` on `window.__test`
    - Add `validateTaskDescription: TodoModule.validateTaskDescription` inside the `window.__TEST_MODE__` guard
    - _Requirements: (testing infrastructure)_

  - [ ]* 6.6 Write property test — Property 3: Whitespace-only descriptions rejected
    - **Property 3: Whitespace-only task descriptions are always rejected**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))` (min length 1)
    - Assert `validateTaskDescription(raw).ok === false`
    - Tag: `// Feature: todo-life-dashboard, Property 3: Whitespace-only descriptions rejected`
    - **Validates: Requirements 4.3, 5.4**

  - [ ]* 6.7 Write property test — Property 4: Valid descriptions accepted and trimmed
    - **Property 4: Valid task descriptions are accepted and trimmed**
    - Use `fc.string()` filtered so `raw.trim().length` is in [1, 200]
    - Assert `result.ok === true` and `result.trimmed === raw.trim()`
    - Tag: `// Feature: todo-life-dashboard, Property 4: Valid descriptions accepted and trimmed`
    - **Validates: Requirements 4.2, 5.3**

  - [ ]* 6.8 Write property test — Property 5: Task JSON round-trip
    - **Property 5: Task serialisation round-trip**
    - Use `fc.array(fc.record({ id: fc.uuid(), text: fc.string({ minLength: 1, maxLength: 200 }), completed: fc.boolean(), createdAt: fc.integer() }))`
    - Serialise with `JSON.stringify` then parse with `JSON.parse`; assert deep equality of every field
    - Tag: `// Feature: todo-life-dashboard, Property 5: Task JSON round-trip`
    - **Validates: Requirements 8.3**

- [x] 7. Implement `QuickLinksModule`
  - [x] 7.1 Implement `QuickLinksModule.validateLink(label, url)`
    - Trim both inputs
    - Collect errors: empty label, label > 50 chars, empty URL, URL > 2048 chars, URL not starting with `http://` or `https://` (case-insensitive regex `^https?:\/\//i`)
    - Return `{ ok: errors.length === 0, errors }`
    - _Requirements: 9.1, 9.4, 9.5_

  - [x] 7.2 Implement `QuickLinksModule.init(rootEl)` — load, render, and add link
    - Declare `let links = []`
    - On init: check `StorageModule.isAvailable()`; if false display a warning in the widget's alert area; load links via `StorageModule.load('quicklinks')` and assign to `links`
    - Build the add-link form: label `<input maxlength="50">`, URL `<input maxlength="2048">`, Add `<button>`, and a `<div role="alert" class="validation-msg">` for inline errors
    - Define `_persist()`: call `StorageModule.save('quicklinks', links)`; handle `quota` and `unavailable` errors with inline messages
    - Define `_addLink(label, url)`: call `validateLink`; on failure render each error string in the validation area and return; push `{ id: crypto.randomUUID?.() ?? Date.now().toString(), label: tLabel, url: tUrl }` to `links`; call `_renderLinks()` then `_persist()`; clear inputs
    - Wire the Add button click to `_addLink`
    - Call `_renderLinks()` on init
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 12.1, 12.2, 12.3, 12.4_

  - [x] 7.3 Implement `_renderLinks()`, `_deleteLink(id)`, and `_launchLink(url)`
    - `_renderLinks()`: clear the links container; for each link render a `<div>` with a `<button aria-label="Open {label}">` for launching and a `<button aria-label="Delete {label}">` for deletion; a `<div role="alert">` for per-link errors
    - `_launchLink(url)`: validate the URL is non-empty and matches `^https?:\/\//i`; if invalid show an error and do NOT call `window.open` (Req 10.2); otherwise call `window.open(url, '_blank', 'noopener,noreferrer')`
    - `_deleteLink(id)`: remove from `links`; call `_renderLinks()` then `_persist()`; if `_persist()` fails restore the link, call `_renderLinks()`, show error (Req 11.3); update completes within 1 second per Req 11.4 (synchronous DOM operation ensures this)
    - Wire launch button click and `keydown` Enter to `_launchLink`; wire delete button click to `_deleteLink`
    - _Requirements: 10.1, 10.2, 11.1–11.4, 12.2_

  - [x] 7.4 Expose `validateLink` on `window.__test`
    - Add `validateLink: QuickLinksModule.validateLink` inside the `window.__TEST_MODE__` guard
    - _Requirements: (testing infrastructure)_

  - [ ]* 7.5 Write property test — Property 6: Quick Link JSON round-trip
    - **Property 6: Quick Link serialisation round-trip**
    - Use `fc.array(fc.record({ id: fc.uuid(), label: fc.string({ minLength: 1, maxLength: 50 }), url: fc.string({ minLength: 1, maxLength: 2048 }) }))`
    - Serialise then parse; assert deep equality of every field
    - Tag: `// Feature: todo-life-dashboard, Property 6: Quick Link JSON round-trip`
    - **Validates: Requirements 12.3**

  - [ ]* 7.6 Write property test — Property 7: Valid links pass validation
    - **Property 7: Valid links pass validation**
    - Generate label with `fc.string({ minLength: 1, maxLength: 50 })` and URL with `fc.oneof(fc.constant('http://'), fc.constant('https://'))` concatenated with `fc.string({ minLength: 1, maxLength: 2040 })`
    - Assert `validateLink(label, url).ok === true` and `.errors` is empty
    - Tag: `// Feature: todo-life-dashboard, Property 7: Valid links pass validation`
    - **Validates: Requirements 9.2, 9.5**

  - [ ]* 7.7 Write property test — Property 8: Invalid URLs always rejected
    - **Property 8: Invalid URLs are always rejected**
    - Use `fc.string()` filtered so `url.trim()` does not match `/^https?:\/\//i`; use `fc.string({ minLength: 1, maxLength: 50 })` for the label
    - Assert `validateLink(label, url).ok === false` and `.errors.length >= 1`
    - Tag: `// Feature: todo-life-dashboard, Property 8: Invalid URLs always rejected`
    - **Validates: Requirements 9.5**

- [x] 8. Checkpoint — all widgets functional
  - Open `index.html` in a browser; verify all four widgets render, tasks and links survive a page reload, and the timer completes with a visible notification.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. CSS styling, accessibility, and responsive layout
  - [x] 9.1 Apply full visual styles in `css/style.css`
    - Style each widget `<section>`: card background, border-radius, padding, box-shadow
    - Style the task list `<ul>`: remove list bullets; style each `<li>` with flex layout for checkbox, text, and action buttons
    - Style completed tasks: `text-decoration: line-through; opacity: 0.5`
    - Style validation/error messages: distinct colour (e.g. red) with `font-size: 14px`
    - Style the timer display: large monospace font
    - Style Quick Links buttons: consistent with the overall palette
    - Style the timer notification banner: prominent background, centred text
    - _Requirements: 6.2, 6.3, 13.2_

  - [x] 9.2 Enforce accessibility requirements in HTML and CSS
    - Ensure all interactive elements have `min-height: 44px; min-width: 44px` (or equivalent padding) for touch targets (Req 13.4)
    - Add `aria-label` attributes to all icon-only buttons (delete "✕", edit "✏", launch "↗") (Req 13.4)
    - Ensure every `<input>` has an associated `<label>` element
    - Set `aria-live="off"` on the Greeting clock region; set `role="alert"` on the timer completion notification, all validation message elements, and the storage warning banner
    - Verify colour palette meets 4.5:1 normal-text contrast and 3:1 large-text contrast (Req 13.3)
    - _Requirements: 13.2, 13.3, 13.4_

  - [x] 9.3 Implement and verify responsive CSS breakpoints
    - Confirm the `auto-fit minmax(280px, 1fr)` grid produces correct column counts at all three breakpoints
    - Add explicit media queries if needed: `@media (max-width: 600px)` forces 1 column; `@media (min-width: 1025px)` forces 4 columns
    - Verify no horizontal scroll or content overlap at any breakpoint
    - _Requirements: 13.1_

- [x] 10. Property-based test infrastructure setup
  - [x] 10.1 Initialise test environment with Vitest and fast-check
    - Create `todo-life-dashboard/package.json` with `"type": "module"` and dev dependencies: `vitest` (pinned, e.g. `"0.34.6"`), `@vitest/coverage-v8`, `fast-check` (pinned, e.g. `"3.13.2"`), `jsdom`
    - Create `todo-life-dashboard/vitest.config.js` configuring `environment: 'jsdom'`, `globals: true`, and a `setupFiles` entry
    - Create `todo-life-dashboard/test/setup.js`: set `global.window.__TEST_MODE__ = true` before importing `app.js`; load `app.js` content via `fs.readFileSync` and `eval` (or dynamic import) so the module objects are in scope and `window.__test` is populated
    - _Requirements: (testing infrastructure)_

  - [x] 10.2 Create `todo-life-dashboard/test/properties.test.js` and implement all nine property tests
    - Import `fc` from `fast-check`; access pure functions via `window.__test.*`
    - Implement all nine property tests from tasks 3.4, 3.5, 4.3, 6.6, 6.7, 6.8, 7.5, 7.6, 7.7 in this single file, each with a minimum of 100 iterations (`numRuns: 100`)
    - Group tests under `describe` blocks matching their module (e.g. `describe('GreetingModule')`, `describe('TimerModule')`, etc.)
    - Ensure each test has the correct tag comment: `// Feature: todo-life-dashboard, Property N: <title>`
    - _Requirements: 2.1–2.5, 3.1, 3.3, 4.2, 4.3, 5.3, 5.4, 8.3, 9.2, 9.5, 12.3_

- [x] 11. Final checkpoint — full test suite and cross-browser verification
  - Run `npx vitest --run` inside `todo-life-dashboard/` and confirm all property tests pass.
  - Open `index.html` directly via `file://` in Chrome, Firefox, and Edge; verify all widgets render and all interactions work.
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 5, 8, 11) are integration milestones to validate incremental progress
- All property tests use `fast-check` accessed via `window.__test.*` under `window.__TEST_MODE__`
- No ES module `import`/`export` syntax is used in `app.js` — the test harness loads the file via jsdom eval with `__TEST_MODE__` pre-set
- The entire app is offline-capable; Quick Link launches require network connectivity only for navigation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "4.1"] },
    { "id": 4, "tasks": ["3.4", "3.5", "4.2"] },
    { "id": 5, "tasks": ["4.3", "6.1"] },
    { "id": 6, "tasks": ["6.2"] },
    { "id": 7, "tasks": ["6.3"] },
    { "id": 8, "tasks": ["6.4", "6.5"] },
    { "id": 9, "tasks": ["6.6", "6.7", "6.8", "7.1"] },
    { "id": 10, "tasks": ["7.2"] },
    { "id": 11, "tasks": ["7.3", "7.4"] },
    { "id": 12, "tasks": ["7.5", "7.6", "7.7"] },
    { "id": 13, "tasks": ["9.1"] },
    { "id": 14, "tasks": ["9.2", "9.3", "10.1"] },
    { "id": 15, "tasks": ["10.2"] }
  ]
}
```
