export const SHELVES = [
  { id: "design-system", label: "Design system", enabled: true },
  { id: "elements", label: "Elements", enabled: true },
  { id: "components", label: "Components", enabled: true },
  { id: "features", label: "Features", enabled: false },
  { id: "sections", label: "Sections", enabled: false },
  { id: "pages", label: "Pages", enabled: false },
] as const;

export type ShelfId = (typeof SHELVES)[number]["id"];

export function shelfLabel(id: ShelfId): string {
  return SHELVES.find((shelf) => shelf.id === id)?.label ?? "Design system";
}
