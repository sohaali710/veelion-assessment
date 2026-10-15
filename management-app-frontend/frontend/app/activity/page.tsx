"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActivityLog, ErrorResponse } from "@/types/api";

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString();
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/activity", {
        cache: "no-store",
      });

      let body: unknown;

      try {
        body = await response.json();
      } catch {
        throw new Error("The server returned an unreadable response.");
      }

      if (!response.ok) {
        const errorBody = body as ErrorResponse;
        throw new Error(
          errorBody.error?.message ||
            `Could not load activity (status ${response.status}).`,
        );
      }

      if (!Array.isArray(body)) {
        throw new Error("The server returned an unexpected activity response.");
      }

      setActivity(body as ActivityLog[]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load activity right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const filteredActivity = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return activity;
    }

    return activity.filter((item) =>
      `${item.action ?? ""} ${item.info ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [activity, query]);

  return (
    <main className="page-stack">
      <nav className="page-nav">
        <Link href="/" className="button">
          Back
        </Link>
      </nav>

      <section className="card page-header activity-header">
        <div>
          <h1>Activity Feed</h1>
          <p className="page-subtitle">
            Review recent task changes and search the feed.
          </p>
        </div>

        <input
          className="input"
          type="search"
          placeholder="Search activity"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search activity"
        />
      </section>

      {loading ? (
        <section className="card state-card">
          <p role="status" className="state-message">
            Loading activity…
          </p>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="card state-card state-card--error">
          <p role="alert" className="state-message">
            {error}
          </p>
          <button type="button" className="button" onClick={loadActivity}>
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="card activity-summary">
            <small>
              Total: {activity.length} | Visible: {filteredActivity.length}
            </small>
          </section>

          <section className="card activity-panel">
            {filteredActivity.length === 0 ? (
              <p className="activity-empty">
                {activity.length === 0
                  ? "No activity yet."
                  : "No activity matches your search."}
              </p>
            ) : (
              <ul className="activity-list">
                {filteredActivity.map((item) => (
                  <li key={item.id} className="activity-item">
                    <div className="activity-item__action">
                      {item.action || "(no action)"}
                    </div>
                    <div className="activity-item__info">
                      {item.info || "(no info)"}
                    </div>
                    <small className="activity-item__time">
                      {formatTimestamp(item.when)}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
