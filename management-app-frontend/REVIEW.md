# Frontend Code Review

This review covers the supplied Next.js App Router frontend, its Task Dashboard and Activity Feed, and its API proxy routes. It records current issues and the improvements planned for the assessment. Styling work is intentionally deferred for now.

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

### Task update errors hide the task list

- **What is wrong:** `TaskDashboard` hides the `TaskList` whenever `useTasks` has an error. An error from a PATCH can therefore replace the entire list after a failed status change.
- **Why it matters:** The user loses context and may not know whether the task changed.
- **Suggested improvement:** Keep the list visible after an update error and show the error near the affected task or in a persistent message. Clear it when the next update succeeds.

### Reports UI and navigation are missing

- **What is wrong:** There is no `/reports` page, no frontend proxy route for the Reports endpoint, and the home page links only to Tasks and Activity.
- **Why it matters:** The required summary feature cannot be reached or displayed from the frontend.
- **Suggested improvement:** Add a Reports API proxy and `/reports` page for total tasks, counts by status, and recent activity. Include loading, error, and empty or zero-value states, then link to the page from the home navigation.

## Code quality and React practices

### Activity page keeps redundant derived values in state

- **What is wrong:** `shownActivity` and `forcedList` are both derived from `allActivity` and `query`, while `stats` also stores a timer-derived value that is not displayed.
- **Why it matters:** Multiple copies of derived data need synchronization and can become inconsistent.
- **Suggested improvement:** Keep only the source data and user input in state; derive filtered entries and counts during render with a simple expression or `useMemo`.

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

- The Activity Feed refactor should remove the timer and duplicate derived state, use one search filter and timestamp formatter, and display loading, error, retry, and empty states.
- The Task Dashboard and its hook should be reviewed for update-error handling and kept connected through the existing same-origin Next.js proxy pattern.
- The Reports proxy, page, and navigation entry are still required.
- Styling improvements are deferred for now; the assessment's visual polish requirement remains to be completed later.
- No frontend source changes are represented as completed by this review. Update this section as implementation proceeds.
