import type { DesignSystemFile } from "@/design/types";

export const ID_PATTERN = /^[a-z0-9-]+$/;

export function createDefaultDesignSystem(): DesignSystemFile {
  return {
    schemaVersion: 1,
    kind: "design-system",
    id: crypto.randomUUID(),
    name: "Design system",
    updatedAt: new Date().toISOString(),
    tailwindVersion: "4.3",
    colors: [
      { id: "brand", name: "Brand", value: "#9a3412" },
      { id: "ink", name: "Ink", value: "#1c1917" },
      { id: "muted", name: "Muted", value: "#78716c" },
      { id: "surface", name: "Surface", value: "#ffffff" },
    ],
    fonts: [
      { id: "sans", name: "Sans", stack: "ui-sans-serif, system-ui, sans-serif" },
      { id: "display", name: "Display", stack: "ui-sans-serif, system-ui, sans-serif" },
    ],
    radius: [{ id: "card", value: "1rem" }],
  };
}

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "item";
}

export function uniqueId(name: string, used: string[]): string {
  const base = slugify(name);
  if (!used.includes(base)) return base;
  let n = 2;
  while (used.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function signature(file: DesignSystemFile): string {
  return JSON.stringify({
    name: file.name,
    colors: file.colors,
    fonts: file.fonts,
    radius: file.radius,
  });
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) || /^#[0-9a-fA-F]{3}$/.test(value.trim());
}

export function normalizeHex(value: string): string | null {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase();
  }
  return null;
}
