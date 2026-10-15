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
    <main className="stack">
      <nav>
        <Link href="/" className="button">
          Back
        </Link>
      </nav>

      <section className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Activity Feed</h1>

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
        <section className="card" style={{ padding: "1rem" }}>
          <p role="status" style={{ margin: 0 }}>
            Loading activity…
          </p>
        </section>
      ) : null}

      {!loading && error ? (
        <section
          className="card"
          style={{ padding: "1rem", borderColor: "#e3b4c0" }}
        >
          <p role="alert">{error}</p>
          <button type="button" className="button" onClick={loadActivity}>
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="card" style={{ padding: "1rem" }}>
            <small style={{ color: "var(--muted)" }}>
              Total: {activity.length} | Visible: {filteredActivity.length}
            </small>
          </section>

          <section className="card" style={{ padding: "1rem" }}>
            {filteredActivity.length === 0 ? (
              <p style={{ margin: 0, color: "var(--muted)" }}>
                {activity.length === 0
                  ? "No activity yet."
                  : "No activity matches your search."}
              </p>
            ) : (
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "grid",
                  gap: "0.7rem",
                }}
              >
                {filteredActivity.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "0.6rem",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {item.action || "(no action)"}
                    </div>
                    <div>{item.info || "(no info)"}</div>
                    <small style={{ color: "var(--muted)" }}>
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
