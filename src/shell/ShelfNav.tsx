const SHELVES = [
  { id: "design-system", label: "Design system", enabled: true },
  { id: "elements", label: "Elements", enabled: false },
  { id: "components", label: "Components", enabled: false },
  { id: "sections", label: "Sections", enabled: false },
  { id: "features", label: "Features", enabled: false },
  { id: "pages", label: "Pages", enabled: false },
] as const;

export function ShelfNav() {
  return (
    <nav aria-label="Shelves" className="border-b border-line px-4 py-4">
      <h2 className="text-xs font-medium tracking-wide text-muted">Shelves</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {SHELVES.map((shelf) => (
          <li key={shelf.id}>
            {shelf.enabled ? (
              <button
                type="button"
                aria-current="page"
                data-testid={`shelf-${shelf.id}`}
                className="flex min-h-11 w-full items-center rounded-sm bg-ink px-3 py-2 text-left text-sm font-medium text-panel"
              >
                {shelf.label}
              </button>
            ) : (
              <button
                type="button"
                disabled
                data-testid={`shelf-${shelf.id}`}
                className="flex min-h-11 w-full flex-col items-start justify-center rounded-sm border border-line bg-paper px-3 py-2 text-left text-sm text-muted disabled:cursor-not-allowed"
              >
                <span>{shelf.label}</span>
                <span className="text-xs">Available in a later phase</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
