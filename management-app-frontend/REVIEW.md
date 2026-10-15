# Frontend Code Review

This review covers the supplied Next.js App Router frontend, its Task Dashboard, Activity Feed, Reports page, and API proxy routes. It records current issues and the improvements made or planned for the assessment.

## Performance

### Activity Feed rerenders on a timer without new data

- **What is wrong:** `app/activity/page.tsx` increments `tick` every 1.4 seconds. The value is used to clone `shownActivity` into `forcedList`, which causes repeated state updates and renders even though no activity has changed.
- **Why it matters:** This performs unnecessary work, complicates the page's state, and makes the displayed feed harder to reason about.
- **Suggested improvement:** Remove `tick` and `forcedList`. Store the fetched activity once and derive the filtered list from the activity and search query with `useMemo`.

## Maintainability

### Activity filtering and time formatting are duplicated

- **What is wrong:** The Activity page defines two equivalent time-formatting functions and applies two nearly identical search filters in sequence.
- **Why it matters:** Duplicate logic can drift and obscures the single behavior the page needs.
- **Suggested improvement:** Use one timestamp formatter and one case-insensitive filter derived from `action` and `info`.

### Frontend archive contains a duplicate backend project

- **What is wrong:** The frontend archive includes a `backend/` directory with another copy of the Express API.
- **Why it matters:** A combined submission could contain two backend implementations and two separate JSON data stores, making it unclear which server and data are authoritative.
- **Suggested improvement:** Use the separately tested backend as the canonical backend in the final combined repository and include only one backend implementation.

### API access is split between a helper and Next.js route handlers

- **What is wrong:** `lib/backendApi.ts` calls Express directly, while `app/api/*` route handlers proxy those calls for browser components.
- **Why it matters:** This is a valid server-side proxy pattern, but developers need to preserve the boundary and avoid adding browser requests directly to the backend host.
- **Suggested improvement:** Keep browser components calling same-origin `/api/...` routes, and have those route handlers call the shared backend helper. Add the Reports proxy using the same pattern.

## UX issues

### Activity API failures appear as an empty feed

- **What is wrong:** The Activity page parses the response body without checking `response.ok`, and its catch handler resets the list to empty without showing an error or retry action.
- **Why it matters:** Users cannot distinguish a genuine empty feed from a backend or network failure.
- **Suggested improvement:** Add loading and error state, check the response status, and provide a retry action while keeping an explicit empty state for a successful response with no entries.
- **Current status:** The Activity page in the working copy now checks the response and displays loading, error, retry, and empty states.

### Task update errors hide the task list

- **What is wrong:** `TaskDashboard` hides the `TaskList` whenever `useTasks` has an error. An error from a PATCH can therefore replace the entire list after a failed status change.
- **Why it matters:** The user loses context and may not know whether the task changed.
- **Suggested improvement:** Reuse the existing `error` state for load and update failures. Keep the task list visible when tasks have already loaded, even if an update fails; show the error and let the user refresh the task data. With no loaded tasks after an initial load failure, show the error without rendering a misleading empty list.

### Reports UI and navigation are missing

- **What is wrong:** There is no `/reports` page, no frontend proxy route for the Reports endpoint, and the home page links only to Tasks and Activity.
- **Why it matters:** The required summary feature cannot be reached or displayed from the frontend.
- **Suggested improvement:** Add a Reports API proxy and `/reports` page for total tasks, counts by status, and recent activity. Include loading, error, and empty or zero-value states, then link to the page from the home navigation.
- **Current status:** The working copy now contains the Reports proxy route, `/reports` page, and home-page link.

## Code quality and React practices

### Activity page keeps redundant derived values in state

- **What is wrong:** `shownActivity` and `forcedList` are both derived from `allActivity` and `query`, while `stats` also stores a timer-derived value that is not displayed.
- **Why it matters:** Multiple copies of derived data need synchronization and can become inconsistent.
- **Suggested improvement:** Keep only the source data and user input in state; derive filtered entries and counts during render with a simple expression or `useMemo`.
- **Current status:** The working copy derives the filtered feed from one activity state and the query; the timer and duplicate lists have been removed.

### Proxy routes collapse upstream errors into HTTP 500

- **What is wrong:** The Next.js proxy handlers return status 500 for any caught error, including errors that originated as expected backend responses such as 400 or 404.
- **Why it matters:** The UI and API clients lose the distinction between a client error, a missing record, and an unavailable backend.
- **Suggested improvement:** Preserve the upstream status and structured error response where possible, while using 500 for unexpected proxy failures.

### JSON response shapes are trusted without runtime checks

- **What is wrong:** The frontend casts parsed JSON to TypeScript types, but the casts do not validate data at runtime. The Activity page can treat an error object as an array if the proxy returns an error response.
- **Why it matters:** Unexpected API responses can cause rendering errors that TypeScript cannot catch.
- **Suggested improvement:** Check HTTP status before using the body and validate essential shapes such as arrays and required fields at the API boundary.

### Backend URL configuration differs from the tested backend default

- **What is wrong:** The frontend defaults to `http://localhost:4000`; the separately tested backend defaults to port `3000` unless `PORT` is set.
- **Why it matters:** The frontend may report connection errors if it points at a port where no backend is listening.
- **Suggested improvement:** Configure the frontend backend URL to match the tested backend's actual port, or start that backend with `PORT=4000`. Keep the chosen value documented for local setup.

## Current scope and planned changes

- The Activity Feed refactor in the working copy removes the timer and duplicate derived state, uses one search filter and timestamp formatter, and displays loading, error, retry, and empty states.
- For the Task Dashboard, reuse its existing shared `error` state. Change the rendering condition so an update error does not hide tasks that were already loaded; the existing refresh action can reload the latest data.
- The working copy includes a `TasksSummary` type, backend API helper for `GET /reports/tasks-summary`, same-origin Next.js proxy at `/api/reports/tasks-summary`, `/reports` page, and home-page link. The page shows total tasks, counts by status, and recent activity count with loading and error states.
- The Reports API response is raw JSON rather than wrapped in a `data` property. Its `recentActivityCount` uses the seven-day window implemented in the tested backend.
- The Activity and Reports pages now use shared page, state, activity, and report classes instead of repeated inline styles. Styling changes are recorded below.

## Styling update plan

- **Visual direction:** Use a polished task dashboard style: pale cool-neutral page canvas, white cards, dark readable text, teal action color, generous but consistent spacing, rounded corners, subtle shadows, and restrained hover/focus motion.
- **Shared styles:** Expand `app/globals.css` with design tokens, responsive page width, typography, card and button states, visible keyboard focus, form controls, and reduced-motion handling.
- **Reusable page elements:** Add shared classes for page headers, home navigation cards, filter controls, task cards and status badges, activity entries, report metric cards, and loading/error feedback.
- **Markup updates:** Replace repeated inline layout styles in the Home, Task, Activity, and Reports pages/components with shared class names. Keep the existing API and component behavior unchanged.
- **Responsive behavior:** Stack metric and navigation cards on narrow screens, allow filter controls to wrap, and keep task actions usable without horizontal overflow.
- **Deferred:** Do not add icons, external fonts, animation libraries, or new dependencies as part of this styling pass.

### Styling implemented for Activity and Reports

- Activity now uses the shared page navigation/header, loading and error states, summary panel, activity list, and activity entry classes. The search input and filtering behavior are unchanged.
- Reports now presents total tasks, the three status counts, and recent activity in a responsive report grid. Status counts are displayed as a definition list for clearer scanning.
- Added focused styles for the Activity header and empty state, report status rows and note, and consistent state-message spacing. Existing colors, cards, and responsive rules are reused.
- The TaskItem, StatusFilter, and TaskList styling changes were made by the user and were left untouched in this update.
