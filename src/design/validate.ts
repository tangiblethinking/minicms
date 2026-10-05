import { ID_PATTERN, DEFAULT_SPACING, DEFAULT_TYPE_SCALE } from "@/design/defaults";
import type { DesignColor, DesignFont, DesignRadius, DesignSystemFile, SpacingToken, TypeScale } from "@/design/types";
import { WRONG_FILE_MESSAGE } from "@/design/types";

export type Validation =
  | { ok: true; file: DesignSystemFile }
  | { ok: false; message: string };

function readColor(value: unknown, seen: Set<string>): DesignColor | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || !ID_PATTERN.test(row.id) || seen.has(row.id)) return null;
  if (typeof row.name !== "string" || typeof row.value !== "string") return null;
  seen.add(row.id);
  return { id: row.id, name: row.name, value: row.value };
}

function readFont(value: unknown, seen: Set<string>): DesignFont | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || !ID_PATTERN.test(row.id) || seen.has(row.id)) return null;
  if (typeof row.name !== "string" || typeof row.stack !== "string") return null;
  seen.add(row.id);
  return { id: row.id, name: row.name, stack: row.stack };
}

function readRadius(value: unknown, seen: Set<string>): DesignRadius | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || !ID_PATTERN.test(row.id) || seen.has(row.id)) return null;
  if (typeof row.value !== "string") return null;
  seen.add(row.id);
  return { id: row.id, name: typeof row.name === "string" ? row.name : row.id, value: row.value };
}

export function validateDesignSystem(input: unknown): Validation {
  if (!input || typeof input !== "object") return { ok: false, message: WRONG_FILE_MESSAGE };
  const row = input as Record<string, unknown>;
  if (row.kind !== "design-system" || (row.schemaVersion !== 1 && row.schemaVersion !== 2)) {
    return { ok: false, message: WRONG_FILE_MESSAGE };
  }
  if (typeof row.id !== "string" || row.id.length === 0) {
    return { ok: false, message: WRONG_FILE_MESSAGE };
  }
  if (typeof row.name !== "string" || typeof row.updatedAt !== "string") {
    return { ok: false, message: WRONG_FILE_MESSAGE };
  }
  if (row.tailwindVersion !== "4.3") return { ok: false, message: WRONG_FILE_MESSAGE };
  if (!Array.isArray(row.colors) || !Array.isArray(row.fonts) || !Array.isArray(row.radius)) {
    return { ok: false, message: WRONG_FILE_MESSAGE };
  }

  const colors: DesignColor[] = [];
  const colorIds = new Set<string>();
  for (const item of row.colors) {
    const color = readColor(item, colorIds);
    if (!color) return { ok: false, message: WRONG_FILE_MESSAGE };
    colors.push(color);
  }

  const fonts: DesignFont[] = [];
  const fontIds = new Set<string>();
  for (const item of row.fonts) {
    const font = readFont(item, fontIds);
    if (!font) return { ok: false, message: WRONG_FILE_MESSAGE };
    fonts.push(font);
  }

  const radius: DesignRadius[] = [];
  const radiusIds = new Set<string>();
  for (const item of row.radius) {
    const token = readRadius(item, radiusIds);
    if (!token) return { ok: false, message: WRONG_FILE_MESSAGE };
    radius.push(token);
  }

  return {
    ok: true,
    file: {
      schemaVersion: 2,
      kind: "design-system",
      id: row.id,
      name: row.name,
      updatedAt: row.updatedAt,
      tailwindVersion: "4.3",
      colors,
      fonts,
      radius,
      typeScale: readTypeScale(row.typeScale),
      spacing: readSpacing(row.spacing),
    },
  };
}

function readTypeScale(value: unknown): TypeScale[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_TYPE_SCALE;
  const items: TypeScale[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return DEFAULT_TYPE_SCALE;
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.name !== "string") return DEFAULT_TYPE_SCALE;
    if (typeof row.size !== "string" || typeof row.lineHeight !== "string") return DEFAULT_TYPE_SCALE;
    items.push({ id: row.id, name: row.name, size: row.size, lineHeight: row.lineHeight });
  }
  return items;
}

function readSpacingToken(value: unknown): SpacingToken | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.name !== "string") return null;
  if (typeof row.mobile !== "string" || typeof row.desktop !== "string") return null;
  return { id: row.id, name: row.name, mobile: row.mobile, desktop: row.desktop };
}

function readSpacing(value: unknown): DesignSystemFile["spacing"] {
  if (!value || typeof value !== "object") return DEFAULT_SPACING;
  const row = value as Record<string, unknown>;
  const padding = Array.isArray(row.padding) ? row.padding.map(readSpacingToken).filter((item) => item !== null) : [];
  const gap = Array.isArray(row.gap) ? row.gap.map(readSpacingToken).filter((item) => item !== null) : [];
  const margin = Array.isArray(row.margin) ? row.margin.map(readSpacingToken).filter((item) => item !== null) : [];
  return {
    padding: padding.length > 0 ? padding : DEFAULT_SPACING.padding,
    gap: gap.length > 0 ? gap : DEFAULT_SPACING.gap,
    margin: margin.length > 0 ? margin : DEFAULT_SPACING.margin,
  };
}
