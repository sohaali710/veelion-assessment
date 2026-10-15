import type { Task } from "@/types/api";

type TaskItemProps = {
  task: Task;
  busy: boolean;
  onToggle: (task: Task) => void;
};

export function TaskItem({ task, busy, onToggle }: TaskItemProps) {
  return (
    <li className="card task-card">
      <div className="task-card__top">
        <p className="task-card__title">{task.title}</p>
        <span
          {...{
            className: task.completed
              ? "task-status task-status--completed"
              : "task-status task-status--pending",
          }}
        >
          {task.completed ? "Completed" : "Pending"}
        </span>
      </div>

      <small style={{ color: "var(--muted)" }}>
        Updated: {new Date(task.updatedAt).toLocaleString()}
      </small>

      <div>
        <button
          type="button"
          className="button"
          onClick={() => onToggle(task)}
          disabled={busy}
          aria-label={`Mark ${task.title} as ${task.completed ? "pending" : "completed"}`}
        >
          {busy
            ? "Saving..."
            : task.completed
              ? "Mark as Pending"
              : "Mark as Completed"}
        </button>
      </div>
    </li>
  );
}
