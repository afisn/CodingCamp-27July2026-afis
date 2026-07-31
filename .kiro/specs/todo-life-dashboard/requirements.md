# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application built with vanilla HTML, CSS, and JavaScript. It serves as a personal productivity hub that combines a greeting panel, a Pomodoro focus timer, a task manager, and a quick links panel — all stored in the browser's Local Storage with no backend required. The app supports both light and dark themes and is designed to work as a standalone web page or browser extension in all modern browsers.

## Glossary

- **Dashboard**: The main single-page web application that hosts all panels.
- **Greeting_Panel**: The UI component that displays the current time, date, and a personalized greeting.
- **Focus_Timer**: The UI component that implements a configurable Pomodoro-style countdown timer.
- **Task_Manager**: The UI component that manages the user's to-do list.
- **Task**: A single to-do item with a title, completion status, and creation order.
- **Quick_Links_Panel**: The UI component that displays and manages shortcut buttons to favorite URLs.
- **Link**: A saved shortcut consisting of a label and a URL.
- **Storage**: The browser's Local Storage API used as the sole persistence layer.
- **Theme**: The visual color scheme of the Dashboard, either light or dark.
- **Pomodoro_Duration**: The configurable length of a focus session in minutes, defaulting to 25 minutes.
- **Session**: A single countdown cycle of the Focus_Timer from Pomodoro_Duration to zero.

---

## Requirements

### Requirement 1: Greeting Panel — Time and Date Display

**User Story:** As a user, I want to see the current time and date on the Dashboard, so that I always have a quick reference without leaving the page.

#### Acceptance Criteria

1. THE Greeting_Panel SHALL display the current local time in HH:MM format, updated every second.
2. THE Greeting_Panel SHALL display the current local date in a human-readable format (e.g., "Wednesday, July 30, 2025").
3. WHEN the Dashboard is loaded, THE Greeting_Panel SHALL immediately render the current time and date without requiring user interaction.

---

### Requirement 2: Greeting Panel — Personalized Greeting

**User Story:** As a user, I want to see a greeting that uses my name and reflects the time of day, so that the Dashboard feels personal and contextually relevant.

#### Acceptance Criteria

1. WHEN the local time is between 05:00 and 11:59, THE Greeting_Panel SHALL display "Good Morning, [Name]".
2. WHEN the local time is between 12:00 and 17:59, THE Greeting_Panel SHALL display "Good Afternoon, [Name]".
3. WHEN the local time is between 18:00 and 21:59, THE Greeting_Panel SHALL display "Good Evening, [Name]".
4. WHEN the local time is between 22:00 and 04:59, THE Greeting_Panel SHALL display "Good Night, [Name]".
5. WHEN the user has not set a custom name, THE Greeting_Panel SHALL substitute [Name] with "Friend".
6. WHEN the user sets a custom name, THE Dashboard SHALL persist the name to Storage so that subsequent page loads display the saved name.

---

### Requirement 3: Focus Timer — Countdown and Controls

**User Story:** As a user, I want a Pomodoro-style countdown timer with start, stop, and reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Focus_Timer SHALL initialize the display to the saved Pomodoro_Duration (defaulting to 25:00 if none is saved).
2. WHEN the user activates the start control, THE Focus_Timer SHALL begin counting down from the current displayed time in one-second intervals.
3. WHILE a Session is active, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the reset control, THE Focus_Timer SHALL stop any active countdown and restore the display to the full Pomodoro_Duration.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and notify the user with a browser notification or a visible on-screen alert.
7. WHILE a Session is active, THE Focus_Timer SHALL disable the start control and enable the stop control.
8. WHILE no Session is active, THE Focus_Timer SHALL enable the start control and disable the stop control.

---

### Requirement 4: Focus Timer — Configurable Duration

**User Story:** As a user, I want to change the Pomodoro duration, so that I can adapt the timer to my preferred work intervals.

#### Acceptance Criteria

1. THE Focus_Timer SHALL provide an input control that allows the user to specify the Pomodoro_Duration in whole minutes between 1 and 120.
2. WHEN the user confirms a new Pomodoro_Duration, THE Dashboard SHALL persist the value to Storage.
3. WHEN the user confirms a new Pomodoro_Duration, THE Focus_Timer SHALL reset the display to reflect the new duration.
4. IF the user enters a value outside the range of 1 to 120 minutes, THEN THE Focus_Timer SHALL reject the input and display an inline validation message.

---

### Requirement 5: Task Manager — Add and Prevent Duplicates

**User Story:** As a user, I want to add tasks to my to-do list and be prevented from adding the same task twice, so that my list stays clean and meaningful.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a text input and a submit control for entering a new Task title.
2. WHEN the user submits a non-empty Task title that does not already exist in the list (case-insensitive comparison), THE Task_Manager SHALL add the Task to the list and persist the updated list to Storage.
3. IF the user submits an empty Task title, THEN THE Task_Manager SHALL reject the input and display an inline validation message.
4. IF the user submits a Task title that matches an existing Task title (case-insensitive), THEN THE Task_Manager SHALL reject the input and display an inline validation message indicating a duplicate.
5. WHEN a Task is added, THE Task_Manager SHALL clear the text input field.

---

### Requirement 6: Task Manager — Edit Tasks

**User Story:** As a user, I want to edit the title of an existing task, so that I can correct or update it without deleting and re-adding it.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an edit control for each Task in the list.
2. WHEN the user activates the edit control for a Task, THE Task_Manager SHALL display the current Task title in an editable field.
3. WHEN the user confirms an edited Task title that is non-empty and does not duplicate another existing Task (case-insensitive), THE Task_Manager SHALL update the Task title and persist the updated list to Storage.
4. IF the user confirms an edited Task title that is empty or duplicates another Task, THEN THE Task_Manager SHALL reject the change and display an inline validation message.
5. WHEN the user cancels an edit, THE Task_Manager SHALL discard the changes and restore the original Task title.

---

### Requirement 7: Task Manager — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks, so that I can track my progress and remove tasks I no longer need.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a completion toggle control for each Task.
2. WHEN the user activates the completion toggle for an incomplete Task, THE Task_Manager SHALL mark the Task as complete, apply a visual distinction (e.g., strikethrough), and persist the updated list to Storage.
3. WHEN the user activates the completion toggle for a complete Task, THE Task_Manager SHALL mark the Task as incomplete and persist the updated list to Storage.
4. THE Task_Manager SHALL provide a delete control for each Task.
5. WHEN the user activates the delete control for a Task, THE Task_Manager SHALL remove the Task from the list and persist the updated list to Storage.

---

### Requirement 8: Task Manager — Sort Tasks

**User Story:** As a user, I want to sort my task list, so that I can prioritize or review tasks in a meaningful order.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a sort control with at least the following options: by creation order (default), alphabetically (A–Z), and completed tasks last.
2. WHEN the user selects a sort option, THE Task_Manager SHALL re-render the task list in the selected order without modifying the underlying stored data.
3. WHEN the Dashboard is loaded, THE Task_Manager SHALL apply the default sort order (creation order) to the displayed task list.

---

### Requirement 9: Quick Links Panel — Add and Display Links

**User Story:** As a user, I want to save and display shortcut buttons to my favorite websites, so that I can navigate to them with a single click.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide input controls for entering a Link label and a Link URL.
2. WHEN the user submits a Link with a non-empty label and a valid URL (beginning with "http://" or "https://"), THE Quick_Links_Panel SHALL add the Link to the panel and persist the updated links to Storage.
3. IF the user submits a Link with an empty label or an empty URL, THEN THE Quick_Links_Panel SHALL reject the input and display an inline validation message.
4. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Quick_Links_Panel SHALL reject the input and display an inline validation message.
5. WHEN the user clicks a Link button, THE Dashboard SHALL open the corresponding URL in a new browser tab.
6. WHEN the Dashboard is loaded, THE Quick_Links_Panel SHALL render all Links previously saved to Storage.

---

### Requirement 10: Quick Links Panel — Delete Links

**User Story:** As a user, I want to remove saved quick links, so that I can keep the panel relevant to my current needs.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide a delete control for each saved Link.
2. WHEN the user activates the delete control for a Link, THE Quick_Links_Panel SHALL remove the Link from the panel and persist the updated links to Storage.

---

### Requirement 11: Theme — Light and Dark Mode

**User Story:** As a user, I want to switch between a light and dark theme, so that I can adapt the Dashboard's appearance to my environment and preference.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a theme toggle control visible at all times.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL switch between light and dark themes immediately without reloading the page.
3. WHEN the user sets a theme preference, THE Dashboard SHALL persist the choice to Storage.
4. WHEN the Dashboard is loaded, THE Dashboard SHALL apply the theme previously saved to Storage, defaulting to the browser's preferred color scheme if no preference has been saved.

---

### Requirement 12: Data Persistence — Storage Management

**User Story:** As a user, I want my data (tasks, links, name, timer duration, and theme) to survive page reloads, so that I do not lose my configuration between sessions.

#### Acceptance Criteria

1. THE Dashboard SHALL persist all user-generated data exclusively to the browser's Local Storage API using dedicated, namespaced keys (e.g., `tld_tasks`, `tld_links`, `tld_name`, `tld_duration`, `tld_theme`).
2. WHEN the Dashboard is loaded, THE Dashboard SHALL read all persisted data from Storage and restore the application state before rendering any panel.
3. IF Storage is unavailable or a read operation fails, THEN THE Dashboard SHALL initialize with default values and display a non-blocking warning message to the user.

---

### Requirement 13: Project Structure — File Organization

**User Story:** As a developer, I want the project to follow a defined file structure, so that the codebase remains maintainable and easy to navigate.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as a single `index.html` file at the project root that references all CSS and JavaScript assets.
2. THE Dashboard SHALL include exactly one CSS file located at `css/style.css`.
3. THE Dashboard SHALL include exactly one JavaScript file located at `js/app.js`.
4. THE Dashboard SHALL function as a fully self-contained static web application requiring no build step, no package manager, and no backend server.

---

### Requirement 14: Browser Compatibility

**User Story:** As a user, I want the Dashboard to work correctly across all modern browsers, so that I am not restricted to a single browser.

#### Acceptance Criteria

1. THE Dashboard SHALL function correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari using only standard Web APIs.
2. THE Dashboard SHALL use no third-party JavaScript frameworks or libraries.
3. THE Dashboard SHALL use no CSS preprocessors; all styles SHALL be written in standard CSS.
