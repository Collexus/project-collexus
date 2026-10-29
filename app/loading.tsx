export default function Loading() {
  return (
    <main className="site-route-loading" aria-label="Loading page" aria-busy="true" role="status">
      <div className="site-route-loading-skeleton" aria-hidden="true">
        <span className="site-route-skeleton site-route-skeleton-kicker" />
        <span className="site-route-skeleton site-route-skeleton-title" />
        <span className="site-route-skeleton site-route-skeleton-copy" />
        <div className="site-route-skeleton-grid">
          <span className="site-route-skeleton site-route-skeleton-card" />
          <span className="site-route-skeleton site-route-skeleton-card" />
          <span className="site-route-skeleton site-route-skeleton-card" />
        </div>
      </div>
      <span className="site-route-spinner" aria-hidden="true" />
      <p>Loading Collexus…</p>
    </main>
  );
}
