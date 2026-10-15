"use client";

import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/api";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskList } from "@/components/tasks/TaskList";

export function TaskDashboard() {
  const {
    filteredTasks,
    filter,
    loading,
    error,
    updatingTaskId,
    setFilter,
    fetchTasks,
    updateTaskStatus,
  } = useTasks();

  const handleToggle = (task: Task) => {
    updateTaskStatus(task.id, !task.completed);
  };

  return (
    <section className="stack dashboard-content">
      <header className="card page-header dashboard-header">
        <h1>Task Dashboard</h1>
        <p className="page-subtitle">
          Track tasks and update their completion status.
        </p>
      </header>

      <StatusFilter value={filter} onChange={setFilter} />

      {loading ? (
        <section className="card state-card dashboard-state">
          <p role="status" className="state-message">
            Loading tasks…
          </p>
        </section>
      ) : null}

      {error ? (
        <section className="card state-card state-card--error dashboard-state">
          <p role="alert" className="state-message">
            {error}
          </p>
          <button type="button" className="button" onClick={fetchTasks}>
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !error ? (
        <TaskList tasks={filteredTasks} updatingTaskId={updatingTaskId} onToggle={handleToggle} />
      ) : null}
    </section>
  );
}
