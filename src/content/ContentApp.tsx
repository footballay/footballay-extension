import "./content-app.css";

/**
 * The page-local Footballay application root.
 *
 * This intentionally renders no product UI yet. It establishes the React
 * lifecycle that later Content state, API calls, and Overlay UI will use.
 */
export function ContentApp() {
  return (
    <aside className="footballay-content-marker" data-footballay-content-app="" aria-label="Footballay">
      Footballay
    </aside>
  );
}
