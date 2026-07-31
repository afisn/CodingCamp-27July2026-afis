# Design Document — To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a zero-dependency, single-page web application delivered as three static files (`index.html`, `css/style.css`, `js/app.js`). It runs entirely in the browser with Local Storage as the sole persistence layer.

The application is composed of four independent UI panels that share a common storage facade:

| Panel | Responsibility |
|---|---|
| Greeting Panel | Clock, date, time-based greeting, user name |
| Focus Timer | Pomodoro countdown with configurable duration |
| Task Manager | CRUD task list with sorting |
| Quick Links Panel | Saved URL shortcuts |

A fifth cross-cutting concern — **Theme** — controls the light/dark color scheme and is applied at the `<body>` level via a CSS class.

### Design Goals

- **No build step**: The app must run by opening `index.html` directly in a browser (file:// or HTTP).
- **No dependencies**: No npm, no frameworks, no CDN imports.
- **Graceful degradation**: If Local Storage is unavailable the app initializes from hardcoded defaults and warns the user.
- **Separation of concerns**: Storage logic, business logic, and DOM manipulation are kept in clearly separated functions within `js/app.js`.

---

## Architecture

The entire application lives in a single JavaScript file (`js/app.js`) organized into functional modules using the **Revealing Module Pattern** — plain IIFE-wrapped objects exported to the `window` scope are avoided; instead, named `const` blocks group related functions.

```
js/app.js
│
├── StorageModule        — read/write/delete from localStorage with namespaced keys
├── GreetingModule       — time formatting, greeting logic, name persistence
├── TimerModule          — countdown state machine, interval management
├── TaskModule           — task CRUD, validation, sorting
├── LinksModule          — link CRUD, URL validation
├── ThemeModule          — theme toggle, OS-preference detection
└── App.init()           — bootstraps all modules on DOMContentLoaded
```

### Data Flow

```
User Interaction
      │
      ▼
  DOM Event Handler  (in each Module)
      │
      ├─► Business Logic  (pure functions: validate, transform, sort)
      │
      ├─► StorageModule.save(key, value)
      │
      └─► renderXxx()  — re-renders the affected panel fragment only
```

Each module manages its own in-memory state (a plain JS object or array) so that re-renders read from memory, not from Local Storage on every frame.

### Timer State Machine

```
         ┌──────────┐
  start  │          │  stop
 ───────►│  RUNNING │◄────────
         │          │
         └────┬─────┘
              │ reaches 00:00
              ▼
         ┌──────────┐         reset
         │  STOPPED │◄───────────────────
         │ (idle)   │
         └──────────┘
```

States: `IDLE` (initial/reset), `RUNNING`, `PAUSED`.

---

## Components and Interfaces

### StorageModule

```js
StorageModule = {
  // Returns parsed value or `defaultValue` if key missing / Storage unavailable
  get(key, defaultValue),

  // JSON-serializes value; silently logs error if Storage unavailable
  set(key, value),

  // Removes a single key
  remove(key),

  // Returns true if localStorage is accessible
  isAvailable(),
}
```

**Storage keys:**

| Constant | Key | Type |
|---|---|---|
| `KEY_TASKS` | `tld_tasks` | `Task[]` |
| `KEY_LINKS` | `tld_links` | `Link[]` |
| `KEY_NAME` | `tld_name` | `string` |
| `KEY_DURATION` | `tld_duration` | `number` (minutes) |
| `KEY_THEME` | `tld_theme` | `"light" \| "dark"` |

---

### GreetingModule

```js
GreetingModule = {
  init(),               // starts clock tick interval
  setName(name),        // persists name, re-renders greeting
  getGreetingPhrase(hour),  // pure: returns greeting string for a given hour
  formatTime(date),         // pure: returns "HH:MM"
  formatDate(date),         // pure: returns "Weekday, Month DD, YYYY"
  tick(),               // called every second; updates clock + greeting display
}
```

---

### TimerModule

```js
TimerModule = {
  init(),               // loads saved duration; renders display
  start(),              // transitions IDLE/PAUSED → RUNNING
  stop(),               // transitions RUNNING → PAUSED
  reset(),              // transitions any → IDLE; reloads saved duration
  setDuration(minutes), // validates, persists, resets display
  tick(),               // decrements remaining seconds; stops at 0; notifies user
  formatDisplay(totalSeconds), // pure: returns "MM:SS"
  validateDuration(value),     // pure: returns {valid, message}
  // Internal state
  _state,               // "IDLE" | "RUNNING" | "PAUSED"
  _remainingSeconds,
  _intervalId,
}
```

---

### TaskModule

```js
TaskModule = {
  init(),                      // loads tasks from Storage; renders list
  addTask(title),              // validates, creates Task, persists, re-renders
  editTask(id, newTitle),      // validates, updates Task, persists, re-renders
  deleteTask(id),              // removes Task, persists, re-renders
  toggleComplete(id),          // flips completed flag, persists, re-renders
  setSortOrder(order),         // updates in-memory sort preference; re-renders
  validateTitle(title, tasks, excludeId),  // pure: returns {valid, message}
  sortTasks(tasks, order),     // pure: returns sorted copy of tasks array
  renderList(),                // rebuilds task list DOM from in-memory state
}
```

---

### LinksModule

```js
LinksModule = {
  init(),                  // loads links from Storage; renders panel
  addLink(label, url),     // validates, creates Link, persists, re-renders
  deleteLink(id),          // removes Link, persists, re-renders
  validateLink(label, url), // pure: returns {valid, message}
  renderLinks(),           // rebuilds links DOM from in-memory state
}
```

---

### ThemeModule

```js
ThemeModule = {
  init(),        // reads saved theme or OS preference; applies theme
  toggle(),      // flips theme; persists; applies
  apply(theme),  // sets data-theme attribute on <body>; updates toggle icon
}
```

---

### App (bootstrap)

```js
App = {
  init()   // called on DOMContentLoaded; initializes all modules in order
}
```

---

## Data Models

### Task

```js
{
  id:        string,   // UUID or Date.now() string — unique identifier
  title:     string,   // user-supplied text, trimmed, non-empty
  completed: boolean,  // false = pending, true = done
  createdAt: number,   // Date.now() timestamp — used for creation-order sort
}
```

### Link

```js
{
  id:    string,   // UUID or Date.now() string
  label: string,   // display text for the button
  url:   string,   // must begin with "http://" or "https://"
}
```

### Timer State (in-memory only, not persisted)

```js
{
  state:            "IDLE" | "RUNNING" | "PAUSED",
  remainingSeconds: number,
  durationMinutes:  number,   // loaded from Storage
  intervalId:       number | null,
}
```

### Greeting State (in-memory only)

```js
{
  name:       string,   // loaded from Storage, default "Friend"
  intervalId: number,   // setInterval handle for the clock tick
}
```

### Theme State

```js
{
  current: "light" | "dark"
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting phrase covers all hours

*For any* integer hour value between 0 and 23 (inclusive), `getGreetingPhrase(hour)` SHALL return exactly one of the four greeting strings ("Good Morning", "Good Afternoon", "Good Evening", "Good Night") with no gaps and no overlaps.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 2: Time formatting round-trip

*For any* `Date` object, `formatTime(date)` SHALL return a string matching the pattern `/^\d{2}:\d{2}$/` (zero-padded hours and minutes).

**Validates: Requirements 1.1**

---

### Property 3: Task title validation rejects whitespace-only input

*For any* string composed entirely of whitespace characters (including the empty string), `validateTitle(title, tasks, undefined)` SHALL return `{ valid: false }`.

**Validates: Requirements 5.3**

---

### Property 4: Task title validation rejects case-insensitive duplicates

*For any* non-empty task list and any title string that matches an existing task title when both are lowercased, `validateTitle(title, tasks, undefined)` SHALL return `{ valid: false }`.

**Validates: Requirements 5.4, 6.4**

---

### Property 5: Task sorting is non-destructive

*For any* array of tasks and any sort order, `sortTasks(tasks, order)` SHALL return a new array containing exactly the same task objects (by identity) as the input — the original array SHALL remain unmodified.

**Validates: Requirements 8.2**

---

### Property 6: Task sort by creation order preserves insertion sequence

*For any* array of tasks with distinct `createdAt` timestamps, `sortTasks(tasks, "creation")` SHALL return tasks in ascending `createdAt` order.

**Validates: Requirements 8.1, 8.2**

---

### Property 7: Task sort completed-last puts all completed tasks after all incomplete tasks

*For any* mixed array of complete and incomplete tasks, `sortTasks(tasks, "completed-last")` SHALL return an array where every task with `completed === false` appears before every task with `completed === true`.

**Validates: Requirements 8.1**

---

### Property 8: Timer duration validation rejects out-of-range values

*For any* numeric value outside the inclusive range [1, 120], `validateDuration(value)` SHALL return `{ valid: false }`.

**Validates: Requirements 4.4**

---

### Property 9: Timer duration validation accepts in-range values

*For any* integer value in the inclusive range [1, 120], `validateDuration(value)` SHALL return `{ valid: true }`.

**Validates: Requirements 4.1**

---

### Property 10: Timer display formatting

*For any* non-negative integer `totalSeconds`, `formatDisplay(totalSeconds)` SHALL return a string matching `/^\d{2}:\d{2}$/` where the minutes component equals `Math.floor(totalSeconds / 60)` (zero-padded to 2 digits) and the seconds component equals `totalSeconds % 60` (zero-padded to 2 digits).

**Validates: Requirements 3.3**

---

### Property 11: Link URL validation accepts only http/https

*For any* string that does not begin with `"http://"` or `"https://"`, `validateLink(label, url)` SHALL return `{ valid: false }`.

*For any* non-empty label and a URL that begins with `"http://"` or `"https://"`, `validateLink(label, url)` SHALL return `{ valid: true }`.

**Validates: Requirements 9.2, 9.4**

---

### Property 12: Storage round-trip preserves data

*For any* serializable value written with `StorageModule.set(key, value)`, a subsequent `StorageModule.get(key, null)` SHALL return a value that is deeply equal to the original.

**Validates: Requirements 12.1, 12.2**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Local Storage unavailable (private mode, quota exceeded) | `StorageModule.isAvailable()` returns `false`; app runs on in-memory defaults; a non-blocking banner is shown |
| Storage quota exceeded on write | `StorageModule.set()` catches the `QuotaExceededError`; logs warning; UI continues normally |
| Invalid timer duration input | Inline validation message shown; timer state unchanged |
| Empty task title | Inline validation message shown; task list unchanged |
| Duplicate task title | Inline validation message shown; task list unchanged |
| Empty link label or URL | Inline validation message shown; links unchanged |
| Invalid URL format | Inline validation message shown; links unchanged |
| Browser Notification API unavailable | Falls back to a visible on-screen alert at 00:00 |
| `setInterval` drift | Re-renders use wall-clock `Date.now()` for display accuracy (timer counts intervals for control flow; clock display reads system time) |

---

## Testing Strategy

### Unit Tests (example-based)

Framework: **Vitest** (runs in Node; no browser required for pure-function tests).

Focus on:
- `getGreetingPhrase()` — boundary hours (0, 5, 12, 18, 22, 23)
- `formatTime()` — midnight, noon, single-digit minutes
- `formatDate()` — known Date objects → expected strings
- `validateTitle()` — empty string, whitespace, exact duplicate, case-variant duplicate, valid new title
- `validateDuration()` — 0, 1, 60, 120, 121, non-integer, NaN
- `sortTasks()` — empty list, single item, all complete, all incomplete, mixed
- `validateLink()` — empty label, empty URL, ftp://, http://, https://
- `formatDisplay()` — 0s, 59s, 60s, 3599s, 3600s (boundary)
- `StorageModule` — mock `localStorage`; test get/set/remove/isAvailable

### Property-Based Tests

Framework: **fast-check** (works in Node with Vitest).

Each property test MUST run a minimum of **100 iterations**.

Tag format in test comments: `Feature: todo-life-dashboard, Property {N}: {property_text}`

| Property | Generator hints |
|---|---|
| P1 – Greeting covers all hours | `fc.integer({ min: 0, max: 23 })` |
| P2 – Time format pattern | `fc.date()` |
| P3 – Whitespace titles rejected | `fc.stringMatching(/^\s*$/)` |
| P4 – Duplicate titles rejected | Generate task list + pick/mutate a title to match existing (case-swap) |
| P5 – Sort is non-destructive | `fc.array(taskArbitrary)` for each sort order |
| P6 – Creation order sort | `fc.array(taskArbitrary)` with distinct timestamps |
| P7 – Completed-last sort | `fc.array(taskArbitrary)` with random completion flags |
| P8 – Duration validation rejects OOB | `fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 121 }))` |
| P9 – Duration validation accepts in-range | `fc.integer({ min: 1, max: 120 })` |
| P10 – Timer display format | `fc.nat()` (non-negative integers) |
| P11 – URL validation | `fc.webUrl()` vs `fc.string()` filtered to non-http/s prefixes |
| P12 – Storage round-trip | `fc.jsonValue()` |

### Integration / Manual Tests

Because the app is a DOM-based browser application, the following are verified by manual test pass in each target browser (Chrome, Firefox, Edge, Safari):

- Full page load → all panels render with stored data
- Clock updates every second
- Timer counts down, stops at 00:00, fires notification
- Task add / edit / delete / toggle / sort persists across reload
- Link add / delete opens in new tab
- Theme toggle persists across reload
- Storage-unavailable banner (test in private browsing with storage blocked)

### Accessibility Checklist

- All interactive controls have `aria-label` or visible `<label>` elements
- Theme toggle has `aria-pressed` state
- Timer buttons have `aria-disabled` reflecting enabled/disabled state
- Color contrast meets WCAG AA (verified with browser DevTools)
