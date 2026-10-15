import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-stack home-page">
      <header className="card page-header home-header">
        <p className="home-eyebrow">VeeLion · Full-stack assessment</p>
        <h1>Task Management</h1>
        <p className="page-subtitle">
          Choose a workspace to manage tasks, review activity, or view reports.
        </p>
      </header>

      <nav className="home-grid" aria-label="Management app sections">
        <Link href="/tasks" className="card home-card">
          <span className="home-card__number" aria-hidden="true">01</span>
          <h2>Task Dashboard</h2>
          <p>Review your tasks and update their completion status.</p>
          <span className="home-card__action">Open dashboard <span aria-hidden="true">→</span></span>
        </Link>

        <Link href="/activity" className="card home-card">
          <span className="home-card__number" aria-hidden="true">02</span>
          <h2>Activity Feed</h2>
          <p>Search the recent changes recorded for your tasks.</p>
          <span className="home-card__action">View activity <span aria-hidden="true">→</span></span>
        </Link>

        <Link href="/reports" className="card home-card">
          <span className="home-card__number" aria-hidden="true">03</span>
          <h2>Reports</h2>
          <p>See the task totals, status breakdown, and recent activity.</p>
          <span className="home-card__action">View reports <span aria-hidden="true">→</span></span>
        </Link>
      </nav>
    </main>
  );
}
