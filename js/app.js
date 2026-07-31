// js/app.js — To-Do List Life Dashboard
// Module implementations will be added in Tasks 2–9.

// =============================================================================
// StorageModule
// Provides a safe facade over localStorage with JSON serialization.
// Must be declared first — all other modules depend on it.
// =============================================================================

const StorageModule = (() => {
  // Namespaced storage keys
  const KEY_TASKS    = "tld_tasks";
  const KEY_LINKS    = "tld_links";
  const KEY_NAME     = "tld_name";
  const KEY_DURATION = "tld_duration";
  const KEY_THEME    = "tld_theme";

  /**
   * Returns true if localStorage is accessible for read/write.
   * Uses a try/catch test-write to detect private-mode restrictions or
   * environments where storage is blocked entirely.
   */
  function isAvailable() {
    const TEST_KEY = "__tld_storage_test__";
    try {
      localStorage.setItem(TEST_KEY, "1");
      localStorage.removeItem(TEST_KEY);
      return true;
    } catch (_e) {
      return false;
    }
  }

  /**
   * Retrieves and JSON-parses the value stored under `key`.
   * Returns `defaultValue` when the key is absent or the stored
   * string cannot be parsed (corrupt data, type mismatch, etc.).
   *
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  function get(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (_e) {
      return defaultValue;
    }
  }

  /**
   * JSON-serializes `value` and writes it under `key`.
   * Catches QuotaExceededError (and related storage-full errors) and
   * logs a console warning instead of propagating the exception so
   * callers do not need to handle storage failures individually.
   *
   * @param {string} key
   * @param {*} value
   */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // DOMException name varies by browser:
      //   Chrome/Firefox: "QuotaExceededError"
      //   Safari legacy:  "QUOTA_EXCEEDED_ERR"
      if (
        e instanceof DOMException &&
        (e.name === "QuotaExceededError" ||
          e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
          e.code === 22 ||
          e.code === 1014)
      ) {
        console.warn(
          "[StorageModule] localStorage quota exceeded. Data could not be saved.",
          { key }
        );
      } else {
        console.warn("[StorageModule] Failed to write to localStorage.", {
          key,
          error: e,
        });
      }
    }
  }

  /**
   * Removes the entry with the given `key` from localStorage.
   *
   * @param {string} key
   */
  function remove(key) {
    localStorage.removeItem(key);
  }

  return { isAvailable, get, set, remove };
})();

// Storage key constants — exported at module scope so every other
// module can reference them without going through StorageModule.
const KEY_TASKS    = "tld_tasks";
const KEY_LINKS    = "tld_links";
const KEY_NAME     = "tld_name";
const KEY_DURATION = "tld_duration";
const KEY_THEME    = "tld_theme";

// =============================================================================
// GreetingModule
// Manages clock display, date display, and time-of-day personalized greeting.
// =============================================================================

const GreetingModule = (() => {
  // Internal state
  let _state = {
    name: "Friend",
    intervalId: null,
  };

  // Hardcoded day and month names for locale-independent output
  const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  /**
   * Returns zero-padded HH:MM string for a given Date.
   * Pure function — no side effects.
   *
   * @param {Date} date
   * @returns {string}
   */
  function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  /**
   * Returns human-readable date string in format "Weekday, Month DD, YYYY".
   * Pure function — no side effects.
   *
   * @param {Date} date
   * @returns {string}
   */
  function formatDate(date) {
    const dayName = DAY_NAMES[date.getDay()];
    const monthName = MONTH_NAMES[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${dayName}, ${monthName} ${day}, ${year}`;
  }

  /**
   * Returns the appropriate greeting phrase for a given hour (0–23).
   * Pure function — no side effects.
   *
   * Time ranges:
   * - 05–11: "Good Morning"
   * - 12–17: "Good Afternoon"
   * - 18–21: "Good Evening"
   * - 22–23 and 0–4: "Good Night"
   *
   * @param {number} hour
   * @returns {string}
   */
  function getGreetingPhrase(hour) {
    if (hour >= 5 && hour <= 11) {
      return "Good Morning";
    } else if (hour >= 12 && hour <= 17) {
      return "Good Afternoon";
    } else if (hour >= 18 && hour <= 21) {
      return "Good Evening";
    } else {
      // hour is 22, 23, or 0–4
      return "Good Night";
    }
  }

  /**
   * Persists the user's name to Storage and re-renders the greeting.
   *
   * @param {string} name
   */
  function setName(name) {
    const trimmed = name.trim();
    _state.name = trimmed;
    StorageModule.set(KEY_NAME, trimmed);
    tick(); // Re-render immediately
  }

  /**
   * Updates the clock display (time + date) and the greeting text.
   * Called every second by the setInterval started in init().
   */
  function tick() {
    const now = new Date(Date.now());

    // Update clock time display
    const clockTimeEl = document.getElementById("greeting-time");
    if (clockTimeEl) {
      clockTimeEl.textContent = formatTime(now);
    }

    // Update clock date display
    const clockDateEl = document.getElementById("greeting-date");
    if (clockDateEl) {
      clockDateEl.textContent = formatDate(now);
    }

    // Update greeting text
    const greetingTextEl = document.getElementById("greeting-text");
    if (greetingTextEl) {
      const phrase = getGreetingPhrase(now.getHours());
      greetingTextEl.textContent = `${phrase}, ${_state.name}`;
    }
  }

  /**
   * Initializes the GreetingModule:
   * - Loads saved name from Storage (defaults to "Friend")
   * - Starts the clock tick interval (1 second)
   * - Calls tick() immediately to render initial state
   */
  function init() {
    // Load saved name
    _state.name = StorageModule.get(KEY_NAME, "Friend");

    // Start clock interval
    _state.intervalId = setInterval(tick, 1000);

    // Render immediately
    tick();

    // Bind name input if present
    const nameInputEl = document.getElementById("greeting-name-input");
    if (nameInputEl) {
      nameInputEl.addEventListener("change", (e) => {
        setName(e.target.value);
      });
    }
  }

  return {
    init,
    setName,
    getGreetingPhrase,
    formatTime,
    formatDate,
    tick,
  };
})();

// =============================================================================
// TimerModule
// Manages a configurable Pomodoro-style countdown timer.
// States: IDLE → RUNNING → PAUSED → IDLE (via reset or reaching 0)
// =============================================================================

const TimerModule = (() => {
  // ── Internal state ──────────────────────────────────────────────────────────
  let _state = "IDLE"; // "IDLE" | "RUNNING" | "PAUSED"
  let _remainingSeconds = 25 * 60;
  let _intervalId = null;

  // ── DOM helpers ─────────────────────────────────────────────────────────────

  /**
   * Sets or removes the `disabled` property on a button element and keeps
   * `aria-disabled` in sync.
   *
   * @param {HTMLElement} el
   * @param {boolean} disabled
   */
  function _setButtonDisabled(el, disabled) {
    if (!el) return;
    if (disabled) {
      el.setAttribute("disabled", "");
    } else {
      el.removeAttribute("disabled");
    }
    el.setAttribute("aria-disabled", String(disabled));
  }

  // ── Pure functions ───────────────────────────────────────────────────────────

  /**
   * Validates that `value` is an integer in the inclusive range [1, 120].
   *
   * Returns `{ valid: true }` on success, or
   * `{ valid: false, message: "..." }` with a descriptive reason.
   *
   * @param {*} value
   * @returns {{ valid: boolean, message?: string }}
   */
  function validateDuration(value) {
    const num = Number(value);

    if (!Number.isInteger(num)) {
      return { valid: false, message: "Duration must be a whole number." };
    }
    if (num < 1 || num > 120) {
      return {
        valid: false,
        message: "Duration must be between 1 and 120 minutes.",
      };
    }
    return { valid: true };
  }

  /**
   * Converts a total number of seconds into a zero-padded "MM:SS" string.
   *
   * @param {number} totalSeconds  Non-negative integer
   * @returns {string}  e.g. "25:00", "04:07", "00:59"
   */
  function formatDisplay(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  // ── Display helper ───────────────────────────────────────────────────────────

  /** Writes the formatted countdown to the timer-display element. */
  function _renderDisplay() {
    const displayEl = document.getElementById("timer-display");
    if (displayEl) {
      displayEl.textContent = formatDisplay(_remainingSeconds);
    }
  }

  /** Applies the "no active session" button state (start enabled, stop disabled). */
  function _setIdleButtons() {
    _setButtonDisabled(document.getElementById("timer-start"), false);
    _setButtonDisabled(document.getElementById("timer-stop"), true);
  }

  /** Applies the "session running" button state (start disabled, stop enabled). */
  function _setRunningButtons() {
    _setButtonDisabled(document.getElementById("timer-start"), true);
    _setButtonDisabled(document.getElementById("timer-stop"), false);
  }

  // ── Core state transitions ───────────────────────────────────────────────────

  /**
   * Decrements `_remainingSeconds` every second while RUNNING.
   * Automatically stops the timer and notifies the user when it reaches 0.
   */
  function tick() {
    _remainingSeconds -= 1;
    _renderDisplay();

    if (_remainingSeconds <= 0) {
      // Stop the interval
      clearInterval(_intervalId);
      _intervalId = null;
      _state = "IDLE";
      _setIdleButtons();

      // Notify the user: prefer the Notification API, fall back to on-screen alert
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification("Focus Timer", { body: "Time is up! Take a break." });
      } else {
        const alertEl = document.getElementById("timer-alert");
        if (alertEl) {
          alertEl.removeAttribute("hidden");
          alertEl.textContent = "Time is up! Take a break.";
        }
      }
    }
  }

  /**
   * Starts the countdown.
   * Guard: only transitions from IDLE or PAUSED → RUNNING.
   */
  function start() {
    if (_state !== "IDLE" && _state !== "PAUSED") return;

    _state = "RUNNING";
    _setRunningButtons();
    _intervalId = setInterval(tick, 1000);
  }

  /**
   * Pauses the countdown.
   * Guard: only transitions from RUNNING → PAUSED.
   */
  function stop() {
    if (_state !== "RUNNING") return;

    clearInterval(_intervalId);
    _intervalId = null;
    _state = "PAUSED";
    _setIdleButtons();
  }

  /**
   * Resets the timer to the saved duration and returns to IDLE state.
   * Works from any state.
   */
  function reset() {
    // Stop any running interval
    if (_intervalId !== null) {
      clearInterval(_intervalId);
      _intervalId = null;
    }

    _state = "IDLE";

    // Reload saved duration (default 25 minutes)
    const savedDuration = StorageModule.get(KEY_DURATION, 25);
    _remainingSeconds = savedDuration * 60;

    _renderDisplay();
    _setIdleButtons();

    // Hide the on-screen alert if it was visible
    const alertEl = document.getElementById("timer-alert");
    if (alertEl) {
      alertEl.setAttribute("hidden", "");
    }
  }

  /**
   * Validates and applies a new duration (in minutes).
   * If valid: persists to Storage and calls reset() to reflect the change.
   * If invalid: shows an inline error message and returns early.
   *
   * @param {number|string} minutes
   */
  function setDuration(minutes) {
    const parsed = parseInt(minutes, 10);
    const result = validateDuration(parsed);
    const errorEl = document.getElementById("timer-duration-error");

    if (!result.valid) {
      if (errorEl) errorEl.textContent = result.message;
      return;
    }

    // Clear any previous error
    if (errorEl) errorEl.textContent = "";

    // Persist and reset
    StorageModule.set(KEY_DURATION, parsed);
    reset();
  }

  // ── Initialization ───────────────────────────────────────────────────────────

  /**
   * Bootstraps the TimerModule:
   *  - Loads saved duration from Storage
   *  - Renders the initial display
   *  - Sets initial button states
   *  - Binds click and change event handlers
   */
  function init() {
    const savedDuration = StorageModule.get(KEY_DURATION, 25);
    _state = "IDLE";
    _remainingSeconds = savedDuration * 60;

    _renderDisplay();
    _setIdleButtons();

    // Button event bindings
    const startBtn = document.getElementById("timer-start");
    const stopBtn = document.getElementById("timer-stop");
    const resetBtn = document.getElementById("timer-reset");

    if (startBtn) startBtn.addEventListener("click", start);
    if (stopBtn) stopBtn.addEventListener("click", stop);
    if (resetBtn) resetBtn.addEventListener("click", reset);

    // Duration input binding
    const durationInput = document.getElementById("timer-duration-input");
    if (durationInput) {
      durationInput.addEventListener("change", (e) => {
        setDuration(e.target.value);
      });
    }
  }

  return {
    init,
    start,
    stop,
    reset,
    tick,
    setDuration,
    formatDisplay,
    validateDuration,
  };
})();

// =============================================================================
// TaskModule
// Manages the to-do task list: CRUD, sorting, validation, and DOM rendering.
// =============================================================================

const TaskModule = (() => {
  // ── Internal state ──────────────────────────────────────────────────────────
  let _tasks = [];        // Array of Task objects loaded from / synced to Storage
  let _sortOrder = "creation"; // "creation" | "alpha" | "completed-last"

  // ── Pure functions ───────────────────────────────────────────────────────────

  /**
   * Validates a task title against an existing task list.
   *
   * Rules:
   *  1. After trimming, the title must not be empty / whitespace-only.
   *  2. The trimmed title must not match any existing task's title
   *     (case-insensitive), unless that task's id equals `excludeId`
   *     (used during edits to skip the task being edited).
   *
   * @param {string} title        Candidate title (may be un-trimmed)
   * @param {Array}  tasks        Current task list to check for duplicates
   * @param {string|undefined} excludeId  ID of task to skip in duplicate check
   * @returns {{ valid: boolean, message?: string }}
   */
  function validateTitle(title, tasks, excludeId) {
    const trimmed = (title || "").trim();

    if (trimmed === "") {
      return { valid: false, message: "Task title cannot be empty." };
    }

    const lowerTrimmed = trimmed.toLowerCase();
    const isDuplicate = tasks.some(
      (t) => t.id !== excludeId && t.title.toLowerCase() === lowerTrimmed
    );

    if (isDuplicate) {
      return { valid: false, message: "A task with this title already exists." };
    }

    return { valid: true };
  }

  /**
   * Returns a sorted copy of the tasks array — never mutates the input.
   *
   * Supported orders:
   *  - "creation"       ascending createdAt (oldest first)
   *  - "alpha"          A–Z by title (case-insensitive)
   *  - "completed-last" incomplete tasks first, then completed tasks
   *
   * @param {Array}  tasks   Source task array
   * @param {string} order   Sort order key
   * @returns {Array}        New sorted array
   */
  function sortTasks(tasks, order) {
    const copy = tasks.slice(); // shallow copy — never mutates input

    switch (order) {
      case "alpha":
        copy.sort((a, b) =>
          a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        );
        break;

      case "completed-last":
        copy.sort((a, b) => {
          // false (0) < true (1) so subtracting puts incomplete first
          return (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
        });
        break;

      case "creation":
      default:
        copy.sort((a, b) => a.createdAt - b.createdAt);
        break;
    }

    return copy;
  }

  // ── Storage helpers ──────────────────────────────────────────────────────────

  /** Persists the current in-memory task list to Storage. */
  function _persist() {
    StorageModule.set(KEY_TASKS, _tasks);
  }

  // ── DOM rendering ────────────────────────────────────────────────────────────

  /**
   * Rebuilds the entire task list DOM from in-memory state.
   * Sorts tasks using the current sort order, then creates one <li> per task.
   * Each item contains:
   *  - a completion toggle button
   *  - a <span> with the task title (strikethrough when completed)
   *  - an edit button (transitions item to edit mode)
   *  - a delete button
   */
  function renderList() {
    const listEl = document.getElementById("task-list");
    if (!listEl) return;

    // Clear existing DOM
    listEl.innerHTML = "";

    const sorted = sortTasks(_tasks, _sortOrder);

    sorted.forEach((task) => {
      const li = document.createElement("li");
      li.dataset.id = task.id;
      li.className = "task-item" + (task.completed ? " task-item--completed" : "");

      // ── Completion toggle ──────────────────────────────────────────────────
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "task-toggle";
      toggleBtn.dataset.id = task.id;
      toggleBtn.setAttribute(
        "aria-label",
        task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`
      );
      toggleBtn.setAttribute("aria-pressed", String(task.completed));
      toggleBtn.textContent = task.completed ? "✓" : "○";
      toggleBtn.addEventListener("click", () => toggleComplete(task.id));

      // ── Title span ─────────────────────────────────────────────────────────
      const titleSpan = document.createElement("span");
      titleSpan.className = "task-title";
      titleSpan.textContent = task.title;
      if (task.completed) {
        titleSpan.style.textDecoration = "line-through";
      }

      // ── Edit button ────────────────────────────────────────────────────────
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "task-edit";
      editBtn.dataset.id = task.id;
      editBtn.setAttribute("aria-label", `Edit task "${task.title}"`);
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => _enterEditMode(li, task));

      // ── Delete button ──────────────────────────────────────────────────────
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "task-delete";
      deleteBtn.dataset.id = task.id;
      deleteBtn.setAttribute("aria-label", `Delete task "${task.title}"`);
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      li.appendChild(toggleBtn);
      li.appendChild(titleSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  }

  /**
   * Switches a task list item into inline edit mode.
   * Replaces the title span and action buttons with an input + confirm/cancel.
   *
   * @param {HTMLElement} li    The <li> element for the task
   * @param {Object}      task  The task object being edited
   */
  function _enterEditMode(li, task) {
    // Replace li contents with edit UI
    li.innerHTML = "";

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "task-edit-input";
    editInput.value = task.title;
    editInput.setAttribute("aria-label", `Edit title for task "${task.title}"`);

    const editError = document.createElement("span");
    editError.className = "task-edit-error";
    editError.setAttribute("role", "alert");
    editError.setAttribute("aria-live", "polite");

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "task-edit-confirm";
    confirmBtn.setAttribute("aria-label", "Confirm edit");
    confirmBtn.textContent = "Save";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "task-edit-cancel";
    cancelBtn.setAttribute("aria-label", "Cancel edit");
    cancelBtn.textContent = "Cancel";

    confirmBtn.addEventListener("click", () => {
      editTask(task.id, editInput.value, editError);
    });

    cancelBtn.addEventListener("click", () => {
      // Discard changes — just re-render from current state
      renderList();
    });

    // Allow Enter to confirm, Escape to cancel
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        editTask(task.id, editInput.value, editError);
      } else if (e.key === "Escape") {
        renderList();
      }
    });

    li.appendChild(editInput);
    li.appendChild(editError);
    li.appendChild(confirmBtn);
    li.appendChild(cancelBtn);

    // Focus the input for accessibility
    editInput.focus();
    editInput.select();
  }

  // ── CRUD operations ──────────────────────────────────────────────────────────

  /**
   * Attempts to add a new task with the given title.
   *
   * On success: creates a Task object, pushes to in-memory array, persists,
   * clears the input field, hides any previous error, and re-renders.
   *
   * On failure: shows an inline error message in #task-input-error.
   *
   * @param {string} title  Raw title from the input field (may be un-trimmed)
   */
  function addTask(title) {
    const errorEl = document.getElementById("task-input-error");
    const inputEl = document.getElementById("task-input");

    const result = validateTitle(title, _tasks, undefined);

    if (!result.valid) {
      if (errorEl) errorEl.textContent = result.message;
      return;
    }

    // Clear previous error
    if (errorEl) errorEl.textContent = "";

    const trimmed = title.trim();
    const now = Date.now();

    const newTask = {
      id: now.toString(),
      title: trimmed,
      completed: false,
      createdAt: now,
    };

    _tasks.push(newTask);
    _persist();

    // Clear the input field on success
    if (inputEl) inputEl.value = "";

    renderList();
  }

  /**
   * Attempts to update the title of an existing task.
   *
   * On success: updates in-memory task, persists, re-renders.
   * On failure: displays an error in the provided error element (or falls back
   * to re-rendering to restore the original title).
   *
   * @param {string}           id         Task ID to update
   * @param {string}           newTitle   Proposed new title
   * @param {HTMLElement|null} [errorEl]  Optional element to display error in
   */
  function editTask(id, newTitle, errorEl) {
    const result = validateTitle(newTitle, _tasks, id);

    if (!result.valid) {
      if (errorEl) {
        errorEl.textContent = result.message;
      }
      return;
    }

    const task = _tasks.find((t) => t.id === id);
    if (!task) return;

    // Clear error if displayed
    if (errorEl) errorEl.textContent = "";

    task.title = newTitle.trim();
    _persist();
    renderList();
  }

  /**
   * Removes a task from the in-memory array, persists, and re-renders.
   *
   * @param {string} id  Task ID to remove
   */
  function deleteTask(id) {
    _tasks = _tasks.filter((t) => t.id !== id);
    _persist();
    renderList();
  }

  /**
   * Flips the `completed` boolean on a task, persists, and re-renders.
   *
   * @param {string} id  Task ID to toggle
   */
  function toggleComplete(id) {
    const task = _tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    _persist();
    renderList();
  }

  /**
   * Updates the in-memory sort preference and immediately re-renders.
   *
   * @param {string} order  One of "creation" | "alpha" | "completed-last"
   */
  function setSortOrder(order) {
    _sortOrder = order;
    renderList();
  }

  // ── Initialization ───────────────────────────────────────────────────────────

  /**
   * Bootstraps the TaskModule:
   *  - Loads tasks from Storage (default empty array)
   *  - Sets default sort order to "creation"
   *  - Renders the initial task list
   *  - Binds the add-task form submit handler
   *  - Binds the sort select change handler
   */
  function init() {
    _tasks = StorageModule.get(KEY_TASKS, []);
    _sortOrder = "creation";

    renderList();

    // Bind add-task form
    const formEl = document.getElementById("task-form");
    if (formEl) {
      formEl.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputEl = document.getElementById("task-input");
        addTask(inputEl ? inputEl.value : "");
      });
    }

    // Bind sort select
    const sortEl = document.getElementById("task-sort");
    if (sortEl) {
      sortEl.addEventListener("change", (e) => {
        setSortOrder(e.target.value);
      });
    }
  }

  return {
    init,
    addTask,
    editTask,
    deleteTask,
    toggleComplete,
    setSortOrder,
    validateTitle,
    sortTasks,
    renderList,
  };
})();

// =============================================================================
// LinksModule
// Manages quick links: validation, CRUD operations, and DOM rendering.
// =============================================================================

const LinksModule = (() => {
  // ── Internal state ──────────────────────────────────────────────────────────
  let _links = [];  // Array of Link objects loaded from / synced to Storage

  // ── Pure functions ───────────────────────────────────────────────────────────

  /**
   * Validates a link label and URL.
   *
   * Rules:
   *  1. Label must not be empty after trimming.
   *  2. URL must not be empty after trimming.
   *  3. URL must start with "http://" or "https://".
   *
   * @param {string} label  Link label (display text)
   * @param {string} url    Link URL
   * @returns {{ valid: boolean, message?: string }}
   */
  function validateLink(label, url) {
    const trimmedLabel = (label || "").trim();
    const trimmedUrl = (url || "").trim();

    if (trimmedLabel === "") {
      return { valid: false };
    }

    if (trimmedUrl === "") {
      return { valid: false };
    }

    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return { valid: false };
    }

    return { valid: true };
  }

  // ── Storage helpers ──────────────────────────────────────────────────────────

  /** Persists the current in-memory links list to Storage. */
  function _persist() {
    StorageModule.set(KEY_LINKS, _links);
  }

  // ── DOM rendering ────────────────────────────────────────────────────────────

  /**
   * Rebuilds the entire links panel DOM from in-memory state.
   * Each link is rendered as a button that opens the URL in a new tab,
   * with a delete control.
   */
  function renderLinks() {
    const listEl = document.getElementById("links-container");
    if (!listEl) return;

    // Clear existing DOM
    listEl.innerHTML = "";

    _links.forEach((link) => {
      const li = document.createElement("li");
      li.dataset.id = link.id;
      li.className = "link-item";

      // ── Link button ────────────────────────────────────────────────────────
      const linkBtn = document.createElement("button");
      linkBtn.type = "button";
      linkBtn.className = "link-button";
      linkBtn.textContent = link.label;
      linkBtn.setAttribute("aria-label", `Open ${link.label}`);
      linkBtn.addEventListener("click", () => {
        window.open(link.url, "_blank");
      });

      // ── Delete button ──────────────────────────────────────────────────────
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "link-delete";
      deleteBtn.dataset.id = link.id;
      deleteBtn.setAttribute("aria-label", `Delete link "${link.label}"`);
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteLink(link.id));

      li.appendChild(linkBtn);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  }

  // ── CRUD operations ──────────────────────────────────────────────────────────

  /**
   * Attempts to add a new link with the given label and URL.
   *
   * On success: creates a Link object, pushes to in-memory array, persists,
   * clears input fields, hides any previous error, and re-renders.
   *
   * On failure: shows an inline error message in #link-input-error.
   *
   * @param {string} label  Raw label from the input field
   * @param {string} url    Raw URL from the input field
   */
  function addLink(label, url) {
    const errorEl = document.getElementById("link-input-error");
    const labelInputEl = document.getElementById("link-label-input");
    const urlInputEl = document.getElementById("link-url-input");

    const result = validateLink(label, url);

    if (!result.valid) {
      if (errorEl) errorEl.textContent = "Please provide a valid label and URL starting with http:// or https://.";
      return;
    }

    // Clear previous error
    if (errorEl) errorEl.textContent = "";

    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();

    const newLink = {
      id: Date.now().toString(),
      label: trimmedLabel,
      url: trimmedUrl,
    };

    _links.push(newLink);
    _persist();

    // Clear input fields on success
    if (labelInputEl) labelInputEl.value = "";
    if (urlInputEl) urlInputEl.value = "";

    renderLinks();
  }

  /**
   * Removes a link from the in-memory array, persists, and re-renders.
   *
   * @param {string} id  Link ID to remove
   */
  function deleteLink(id) {
    _links = _links.filter((link) => link.id !== id);
    _persist();
    renderLinks();
  }

  // ── Initialization ───────────────────────────────────────────────────────────

  /**
   * Bootstraps the LinksModule:
   *  - Loads links from Storage (default empty array)
   *  - Renders the initial links panel
   *  - Binds the add-link form submit handler
   */
  function init() {
    _links = StorageModule.get(KEY_LINKS, []);

    renderLinks();

    // Bind add-link form
    const formEl = document.getElementById("link-form");
    if (formEl) {
      formEl.addEventListener("submit", (e) => {
        e.preventDefault();
        const labelInputEl = document.getElementById("link-label-input");
        const urlInputEl = document.getElementById("link-url-input");
        addLink(
          labelInputEl ? labelInputEl.value : "",
          urlInputEl ? urlInputEl.value : ""
        );
      });
    }
  }

  return {
    init,
    addLink,
    deleteLink,
    validateLink,
    renderLinks,
  };
})();

// =============================================================================
// ThemeModule
// Manages the light/dark theme: reads saved preference or OS default,
// applies it to <body>, and handles the toggle control.
// =============================================================================

const ThemeModule = (() => {
  let _current = "light"; // "light" | "dark"

  /**
   * Applies `theme` to the document by setting a `data-theme` attribute on
   * <body> and updating the toggle button's `aria-pressed` state.
   *
   * @param {"light"|"dark"} theme
   */
  function apply(theme) {
    _current = theme;
    document.body.setAttribute("data-theme", theme);

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-pressed", String(theme === "dark"));
      toggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  /**
   * Flips the current theme, persists the new value, and applies it.
   */
  function toggle() {
    const next = _current === "light" ? "dark" : "light";
    StorageModule.set(KEY_THEME, next);
    apply(next);
  }

  /**
   * Bootstraps the ThemeModule:
   *  - Reads saved theme from Storage
   *  - Falls back to OS color-scheme preference if nothing is saved
   *  - Applies the resolved theme
   *  - Binds the toggle button
   */
  function init() {
    const saved = StorageModule.get(KEY_THEME, null);
    let theme;

    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      theme = "dark";
    } else {
      theme = "light";
    }

    apply(theme);

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", toggle);
    }
  }

  return { init, toggle, apply };
})();

// =============================================================================
// App — Bootstrap
// Initializes all modules in the correct order on DOMContentLoaded.
// =============================================================================

const App = {
  /**
   * Entry point for the application.
   *
   * 1. Checks localStorage availability — renders a non-blocking warning
   *    banner at the top of <body> if storage is unavailable.
   * 2. Initializes every module in dependency order.
   *
   * Satisfies: Requirements 12.2, 12.3
   */
  init() {
    // ── Storage availability check ──────────────────────────────────────────
    if (!StorageModule.isAvailable()) {
      const banner = document.createElement("div");
      banner.id = "storage-warning-banner";
      banner.setAttribute("role", "alert");
      banner.setAttribute("aria-live", "polite");
      banner.style.cssText = [
        "position: fixed",
        "top: 0",
        "left: 0",
        "right: 0",
        "z-index: 9999",
        "padding: 0.75rem 1rem",
        "background: #f59e0b",
        "color: #1c1917",
        "font-weight: 600",
        "text-align: center",
        "font-size: 0.9rem",
      ].join(";");
      banner.textContent =
        "⚠️ Local storage is unavailable. Your data will not be saved between sessions.";

      // Insert as first child so it appears above all other content
      document.body.insertBefore(banner, document.body.firstChild);
    }

    // ── Module initialization (order matters) ────────────────────────────────
    ThemeModule.init();
    GreetingModule.init();
    TimerModule.init();
    TaskModule.init();
    LinksModule.init();
  },
};

// Register App.init as the DOMContentLoaded handler
document.addEventListener("DOMContentLoaded", App.init);
