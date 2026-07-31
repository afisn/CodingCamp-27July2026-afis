# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement a zero-dependency, single-page web application using three static files (`index.html`, `css/style.css`, `js/app.js`). The JavaScript is organized into six functional modules using the Revealing Module Pattern, with Local Storage as the sole persistence layer. No build step, no npm, no frameworks.

## Tasks

- [x] 1. Set up project structure and HTML skeleton
  - Create `index.html` at the project root with semantic HTML layout: header with theme toggle, and four panel sections (Greeting, Focus Timer, Task Manager, Quick Links)
  - Add `<link>` to `css/style.css` and `<script src="js/app.js" defer>` in `index.html`
  - Create empty `css/style.css` and empty `js/app.js` files in their respective directories
  - Add all required `id` and `aria-*` attributes so JS modules can target DOM elements without querying by class name
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.2, 14.3_

- [ ] 2. Implement StorageModule
  - [x] 2.1 Write `StorageModule` in `js/app.js`
    - Implement `isAvailable()` using a try/catch test-write to `localStorage`
    - Implement `get(key, defaultValue)` — JSON-parses stored value, returns `defaultValue` on missing key or parse error
    - Implement `set(key, value)` — JSON-serializes, catches `QuotaExceededError`, logs warning on failure
    - Implement `remove(key)`
    - Define the five key constants: `KEY_TASKS = "tld_tasks"`, `KEY_LINKS = "tld_links"`, `KEY_NAME = "tld_name"`, `KEY_DURATION = "tld_duration"`, `KEY_THEME = "tld_theme"`
    - _Requirements: 12.1, 12.2, 12.3_


- [x] 3. Implement GreetingModule
  - [x] 3.1 Write `GreetingModule` in `js/app.js`
    - Implement `formatTime(date)` — returns zero-padded `HH:MM` string
    - Implement `formatDate(date)` — returns human-readable string (e.g., "Wednesday, July 30, 2025")
    - Implement `getGreetingPhrase(hour)` — returns the correct greeting for hour 0–23 per the four time-of-day ranges (05–11: Morning, 12–17: Afternoon, 18–21: Evening, 22–04: Night)
    - Implement `setName(name)` — trims, persists via `StorageModule.set(KEY_NAME, name)`, re-renders greeting
    - Implement `tick()` — reads `Date.now()`, updates clock display, updates greeting display
    - Implement `init()` — loads saved name (default "Friend"), starts `setInterval(tick, 1000)`, immediately calls `tick()`
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4. Implement TimerModule
  - [x] 4.1 Write `TimerModule` in `js/app.js`
    - Implement `validateDuration(value)` — returns `{ valid: true }` for integers 1–120, `{ valid: false, message }` otherwise
    - Implement `formatDisplay(totalSeconds)` — returns zero-padded `MM:SS`; minutes = `Math.floor(totalSeconds/60)`, seconds = `totalSeconds % 60`
    - Implement `init()` — loads saved duration (default 25), sets `_state = "IDLE"`, renders display, binds start/stop/reset controls and duration input
    - Implement `start()` — guards: only transitions `IDLE`/`PAUSED` → `RUNNING`; disables start button, enables stop button
    - Implement `stop()` — transitions `RUNNING` → `PAUSED`; enables start button, disables stop button; updates `aria-disabled`
    - Implement `reset()` — clears interval, sets `_state = "IDLE"`, reloads saved duration, re-renders display
    - Implement `tick()` — decrements `_remainingSeconds`; at 0 stops interval, sets state to `IDLE`, fires `Notification` if permission granted else visible on-screen alert
    - Implement `setDuration(minutes)` — validates input, persists, calls `reset()`; shows inline error on invalid input
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4_


- [x] 5. Implement TaskModule
  - [x] 5.1 Write `TaskModule` in `js/app.js`
    - Implement `validateTitle(title, tasks, excludeId)` — trims title; returns `{ valid: false }` for empty/whitespace-only; returns `{ valid: false }` for case-insensitive duplicate (skipping task with `excludeId`); returns `{ valid: true }` otherwise
    - Implement `sortTasks(tasks, order)` — returns a **new array** (never mutates input); supports orders: `"creation"` (ascending `createdAt`), `"alpha"` (A–Z by title), `"completed-last"` (incomplete first)
    - Implement `addTask(title)` — validates, creates `{ id: Date.now().toString(), title, completed: false, createdAt: Date.now() }`, pushes to in-memory array, persists, calls `renderList()`; shows inline error on invalid input; clears input field on success
    - Implement `editTask(id, newTitle)` — validates (excludeId = id), updates in-memory task, persists, calls `renderList()`; restores original on cancel
    - Implement `deleteTask(id)` — removes from in-memory array, persists, calls `renderList()`
    - Implement `toggleComplete(id)` — flips `completed` flag, persists, calls `renderList()`
    - Implement `setSortOrder(order)` — updates in-memory sort preference, calls `renderList()`
    - Implement `renderList()` — sorts in-memory tasks with current order, rebuilds task list DOM; each item has completion toggle, edit control, and delete control; completed tasks have strikethrough style
    - Implement `init()` — loads tasks from Storage (default `[]`), sets sort order to `"creation"`, calls `renderList()`, binds add-task form
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3_


- [ ] 6. Checkpoint — Core modules done
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement LinksModule
  - [x] 7.1 Write `LinksModule` in `js/app.js`
    - Implement `validateLink(label, url)` — returns `{ valid: false }` for empty label; returns `{ valid: false }` for empty URL or URL not starting with `"http://"` or `"https://"`; returns `{ valid: true }` otherwise
    - Implement `addLink(label, url)` — validates, creates `{ id: Date.now().toString(), label, url }`, pushes to in-memory array, persists, calls `renderLinks()`; shows inline error on invalid input
    - Implement `deleteLink(id)` — removes from in-memory array, persists, calls `renderLinks()`
    - Implement `renderLinks()` — rebuilds links DOM; each link is a `<button>` with `onclick` opening URL in new tab (`window.open(url, "_blank")`); each button has a delete control
    - Implement `init()` — loads links from Storage (default `[]`), calls `renderLinks()`, binds add-link form
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.2_


- [x] 8. Implement ThemeModule
  - [x] 8.1 Write `ThemeModule` in `js/app.js`
    - Implement `apply(theme)` — sets `document.body.dataset.theme = theme`; updates theme toggle `aria-pressed` state and button icon/label
    - Implement `toggle()` — flips current theme between `"light"` and `"dark"`, calls `StorageModule.set(KEY_THEME, ...)`, calls `apply()`
    - Implement `init()` — reads saved theme from Storage; if none saved, reads `window.matchMedia("(prefers-color-scheme: dark)")` to determine default; calls `apply()`; binds theme toggle button
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 9. Wire everything together with `App.init()` and handle Storage unavailability
  - [x] 9.1 Write `App.init()` in `js/app.js`
    - Call `StorageModule.isAvailable()`; if false, render a non-blocking warning banner in the DOM
    - Initialize modules in order: `ThemeModule.init()`, `GreetingModule.init()`, `TimerModule.init()`, `TaskModule.init()`, `LinksModule.init()`
    - Attach `App.init` to the `DOMContentLoaded` event
    - _Requirements: 12.2, 12.3_

  - [x] 9.2 Verify all module init calls correctly wire DOM event listeners
    - Confirm add-task form submit, add-link form submit, sort control change, timer start/stop/reset buttons, duration input, name input, and theme toggle all invoke the correct module methods
    - _Requirements: 3.2, 3.4, 3.5, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1_

- [x] 10. Write `css/style.css` — layout, theming, and component styles
  - [x] 10.1 Write base layout styles
    - CSS custom properties (variables) for color palette under `:root` (light theme) and `[data-theme="dark"]` (dark theme)
    - Grid or flexbox-based two-column dashboard layout; responsive single-column at mobile breakpoint
    - Base typography: font stack, sizes, line-height
    - _Requirements: 11.2, 13.2, 14.3_

  - [x] 10.2 Write panel-specific component styles
    - Greeting panel: clock display (large font), date display, greeting text, editable name field
    - Focus timer: large countdown display, start/stop/reset button group, duration input with validation message style
    - Task manager: task input row, task list items with completion toggle, edit/delete controls, strikethrough for completed tasks, sort select control, inline validation message style
    - Quick links panel: add-link form with two inputs, link button grid, delete control on each link button
    - _Requirements: 7.2, 5.3, 5.4, 6.4, 9.3, 9.4_

  - [x] 10.3 Write accessibility and interactive state styles
    - `:focus-visible` outlines for keyboard navigation
    - `[aria-disabled="true"]` visual style for disabled timer buttons
    - `[data-theme="dark"]` overrides that apply the dark color palette
    - Theme toggle button with `aria-pressed` visual distinction
    - _Requirements: 11.1, 11.2, 3.7, 3.8, 14.1_

- [ ] 11. Final checkpoint — Full integration review
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design specifies Vitest + fast-check for testing pure functions; no browser required for those tests
- Each property test MUST run a minimum of 100 iterations (fast-check default)
- Tag format in test comments: `Feature: todo-life-dashboard, Property {N}: {property_text}`
- All JS is in a single `js/app.js` file — modules are plain `const` blocks, not ES modules, to avoid CORS issues when opened via `file://`
- DOM element IDs must be stable across renders (task/link IDs are used for targeted DOM updates)
- `StorageModule` must be declared before all other modules in `js/app.js` since all modules depend on it

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "4.1", "5.1", "7.1", "8.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "4.2", "4.3", "4.4", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "7.2", "7.3"] },
    { "id": 3, "tasks": ["9.1", "9.2", "10.1"] },
    { "id": 4, "tasks": ["10.2", "10.3"] }
  ]
}
```
