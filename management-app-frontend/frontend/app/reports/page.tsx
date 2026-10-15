"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ErrorResponse, TasksSummary } from "@/types/api";

export default function ReportsPage() {
  const [summary, setSummary] = useState<TasksSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reports/tasks-summary", {
        cache: "no-store",
      });

      const body: unknown = await response.json();

      if (!response.ok) {
        const errorBody = body as ErrorResponse;
        throw new Error(
          errorBody.error?.message ||
            `Could not load reports (status ${response.status}).`,
        );
      }

      setSummary(body as TasksSummary);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load reports right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <main className="page-stack">
      <nav className="page-nav">
        <Link href="/" className="button">
          Back
        </Link>
      </nav>

      <header className="card page-header">
        <h1>Reports</h1>
        <p className="page-subtitle">Task and recent activity summary</p>
      </header>

      {loading ? (
        <section className="card state-card">
          <p role="status" className="state-message">
            Loading reports…
          </p>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="card state-card state-card--error">
          <p role="alert" className="state-message">
            {error}
          </p>
          <button type="button" className="button" onClick={loadSummary}>
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !error && summary ? (
        <section className="report-grid" aria-label="Task summary">
          <article className="card report-card">
            <p className="report-label">Total tasks</p>
            <p className="report-value">{summary.total}</p>
          </article>

          <article className="card report-card report-card--statuses">
            <h2 className="report-heading">Tasks by status</h2>
            <dl className="report-status-list">
              <div>
                <dt>To do</dt>
                <dd>{summary.byStatus.todo}</dd>
              </div>
              <div>
                <dt>In progress</dt>
                <dd>{summary.byStatus["in-progress"]}</dd>
              </div>
              <div>
                <dt>Done</dt>
                <dd>{summary.byStatus.done}</dd>
              </div>
            </dl>
          </article>

          <article className="card report-card">
            <p className="report-label">Recent activity</p>
            <p className="report-value">{summary.recentActivityCount}</p>
            <small className="report-note">
              Activity recorded in the last seven days
            </small>
          </article>
        </section>
      ) : null}
    </main>
  );
}
