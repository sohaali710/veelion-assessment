# Backend Code Review

This review covers the supplied Tasks and Activity APIs, the shared JSON storage helpers, and the Reports API added for the assessment. Each finding describes the observed behavior, its impact, and a practical improvement.

## Bugs

### Task validation was duplicated and inconsistent

- **What is wrong:** The original task controller performed request checks inline while `src/modules/tasks/utils/taskValidator.js` already contained reusable validation functions. The service performed additional checks, and the controller and service did not enforce precisely the same rules.
- **Why it matters:** Duplicated validation can make create and update endpoints behave differently and makes future rule changes easy to apply in only one place. The original service also modified the supplied payload when adding the default `completed` value.
- **Suggested improvement:** Validate and normalize request bodies through `validateCreateTask` and `validateUpdateTask` at the controller boundary. Keep the service focused on task reads and writes, and explicitly persist supported update fields.
- **Update discussed:** The controller now delegates to the shared validators. The service receives normalized input and only applies `title` and `completed` during updates.

### Task update objects could include unsupported properties

- **What is wrong:** The original service merged the complete `updates` object into a task record with object spread.
- **Why it matters:** If the service is called from another code path without the controller's checks, arbitrary properties can be persisted. This also couples storage behavior to whatever happens to be in the incoming object.
- **Suggested improvement:** Restrict updates to known task fields in the service and reject unknown request fields in the validator.
- **Update discussed:** The validator rejects unknown fields, and the service update builds its patch from `title` and `completed` only.

### Activity IDs can collide

- **What is wrong:** The original Activity service creates IDs with `String(Date.now())`.
- **Why it matters:** Two activity entries created during the same millisecond can receive the same ID, which can cause UI key collisions or make an entry ambiguous to reference.
- **Suggested improvement:** Use the shared ID generator or another collision-resistant ID scheme.

### “Recent activity” needs a defined time window

- **What is wrong:** The assessment requests a recent activity count but does not define what “recent” means. The existing Reports API in the frontend archive counts every activity entry.
- **Why it matters:** A total activity count can be mistaken for a recent count, and users cannot interpret the metric without a documented time window.
- **Suggested improvement:** Choose and document a window, then count only valid timestamps inside it.
- **Update discussed:** The proposed Reports service uses a seven-day window and ignores invalid timestamps.

### The task model cannot represent every requested report status

- **What is wrong:** Tasks store a `completed` boolean, while the report response asks for `todo`, `in-progress`, and `done` counts.
- **Why it matters:** A boolean distinguishes only complete from incomplete, so the API cannot infer which incomplete tasks are in progress.
- **Suggested improvement:** For this assessment, document the mapping of `false` to `todo`, `true` to `done`, and `in-progress` to zero. Supporting in-progress tasks properly would require a status field and a data migration.
- **Update discussed:** The proposed Reports response uses that mapping and returns `in-progress: 0`.

## Performance

### Activity file operations block the event loop

- **What is wrong:** The original Activity service uses synchronous filesystem operations (`readFileSync` and `writeFileSync`) for each request.
- **Why it matters:** A file read or write blocks Node.js from handling other requests until the operation completes. This becomes more noticeable as the files grow or under concurrent requests.
- **Suggested improvement:** Use the asynchronous `readJsonArray` and `writeJsonArray` helpers already used by the Tasks API, with async service and controller functions.

### JSON files require reading and rewriting the full collection

- **What is wrong:** Task and activity updates load the complete JSON array and write the complete array back to disk.
- **Why it matters:** Each operation becomes more expensive as the collections grow, and this storage design is not suited to high traffic or large datasets.
- **Suggested improvement:** Keep JSON storage for this assessment as required, but document its scale limits. A production system with larger or concurrent workloads should use a database.

## Maintainability

### Activity storage duplicates its loader

- **What is wrong:** `activity.service.js` contains separate `loadDataA` and `loadDataB` functions with effectively identical behavior.
- **Why it matters:** Duplicate code increases the chance that one path is fixed while the other remains incorrect.
- **Suggested improvement:** Replace both with the shared JSON storage helper and keep file access in one service path.

### Activity module uses inconsistent naming and layering

- **What is wrong:** The Activity controller and service use names such as `get_activity`, `aSvc`, `createNewActivity`, and `b`, unlike the camelCase task module. Activity routes also call controllers directly instead of using the shared `asyncHandler` wrapper.
- **Why it matters:** Inconsistent conventions make the two modules harder to understand and async failures harder to handle consistently.
- **Suggested improvement:** Use descriptive camelCase names and wrap asynchronous Activity handlers with `asyncHandler`, following the Tasks routes.

### Reports status mapping is coupled to the current data shape

- **What is wrong:** The report derives status from `completed` and hard-codes the in-progress count to zero.
- **Why it matters:** If task status rules change, the report can become inaccurate unless its aggregation is updated too.
- **Suggested improvement:** Keep the mapping in one clearly named aggregation function, document the limitation, and move to an explicit status field if the product needs in-progress tasks.

## Security and data integrity

### Activity request fields are not validated

- **What is wrong:** The original Activity POST handler passes `req.body` to the service without checking that it is an object or that `action` and `info` have acceptable types or lengths.
- **Why it matters:** Unexpected values can be stored and later break consumers or create oversized records. The API also gives clients inconsistent feedback for malformed requests.
- **Suggested improvement:** Validate the body shape and permitted fields; normalize strings and set sensible length limits before writing the record.

### JSON collection writes are not atomic or serialized

- **What is wrong:** A read-modify-write operation can overlap with another request, and a process interruption during a direct write can leave a partial JSON file.
- **Why it matters:** Concurrent updates can overwrite one another, while a partial write can make later reads fail.
- **Suggested improvement:** For the assessment, keep the JSON approach but document the limitation. If retaining file storage, serialize writes and write to a temporary file before replacing the original. Use a database for production concurrency and durability needs.

### Malformed JSON is surfaced as a server error

- **What is wrong:** `readJsonArray` creates missing files and treats empty files as empty arrays, but invalid JSON throws during parsing.
- **Why it matters:** A manually damaged or partially written data file prevents the affected endpoint from serving requests. The generic error response avoids exposing internals, but operators still need useful server logs and a recovery process.
- **Suggested improvement:** Keep the client-facing error generic, log the file-specific cause safely, and document backup/recovery expectations. Avoid silently replacing malformed data with an empty array because that can hide data loss.

### API routes have no authentication or authorization

- **What is wrong:** The supplied routes do not authenticate callers or restrict who can read, create, update, or delete records.
- **Why it matters:** If deployed where untrusted users can reach the API, they could access or modify task and activity data.
- **Suggested improvement:** Confirm the intended deployment boundary. Add authentication and authorization before exposing these routes publicly; for a local take-home app, document that the API is intended to run locally.

## Code quality

### Activity errors do not use the shared error flow

- **What is wrong:** Activity handlers are synchronous and are not wrapped with `asyncHandler`; future asynchronous failures could bypass the centralized error middleware.
- **Why it matters:** Different modules may return different error shapes or leave rejected promises unhandled.
- **Suggested improvement:** Make Activity service/controller methods asynchronous and use `asyncHandler` in the routes, matching the Tasks module.

### JSON storage helper silently treats non-array JSON as empty data

- **What is wrong:** `readJsonArray` returns an empty array when the parsed JSON value is valid JSON but not an array.
- **Why it matters:** A schema mistake can look like a legitimate empty collection and hide data problems from maintainers.
- **Suggested improvement:** Consider throwing a clear storage-format error when valid JSON has the wrong top-level shape, while retaining the current behavior for missing and empty files.

### Backend server and frontend proxy configuration should be aligned

- **What is wrong:** The backend server defaults to port `3000`, while the frontend backend endpoint documentation names `http://localhost:4000`.
- **Why it matters:** Running both applications with their documented defaults can send frontend requests to the wrong port.
- **Suggested improvement:** Standardize the backend port or make it configurable through an environment variable and ensure the frontend proxy uses the same setting.

## Changes reflected in the current working copy

- Task controllers use the shared task validators.
- Task service update logic only applies supported task fields.
- The Reports route is mounted at `/reports`.
- The Reports service reads both JSON files, maps the boolean task model to the requested status counts, and counts activity from the last seven days.

The Activity findings above are review recommendations; the Activity handlers and service now use async JSON storage, request validation, and the shared error handling.
