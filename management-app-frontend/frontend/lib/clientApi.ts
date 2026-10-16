import type {
  ActivityLog,
  ErrorResponse,
  TaskResponse,
  TasksResponse,
  TasksSummary,
} from "@/types/api";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    cache: init?.cache ?? "no-store",
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const body = (await response.json()) as ErrorResponse;
      message = body.error?.message || message;
    } catch {
      // Keep the status-based message if the error response is not JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function getTasksFromApi(): Promise<TasksResponse> {
  return requestJson<TasksResponse>("/api/tasks", { method: "GET" });
}

export function updateTaskInApi(
  taskId: string,
  completed: boolean,
): Promise<TaskResponse> {
  return requestJson<TaskResponse>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export async function getActivityFromApi(): Promise<ActivityLog[]> {
  const body = await requestJson<unknown>("/api/activity", { method: "GET" });

  if (!Array.isArray(body)) {
    throw new Error("The server returned an unexpected activity response.");
  }

  return body as ActivityLog[];
}

export function getTasksSummaryFromApi(): Promise<TasksSummary> {
  return requestJson<TasksSummary>("/api/reports", {
    method: "GET",
  });
}
