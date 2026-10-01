import { ID_PATTERN } from "@/design/defaults";
import type { DesignColor, DesignFont, DesignRadius, DesignSystemFile } from "@/design/types";
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
  return { id: row.id, value: row.value };
}

export function validateDesignSystem(input: unknown): Validation {
  if (!input || typeof input !== "object") return { ok: false, message: WRONG_FILE_MESSAGE };
  const row = input as Record<string, unknown>;
  if (row.kind !== "design-system" || row.schemaVersion !== 1) {
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
      schemaVersion: 1,
      kind: "design-system",
      id: row.id,
      name: row.name,
      updatedAt: row.updatedAt,
      tailwindVersion: "4.3",
      colors,
      fonts,
      radius,
    },
  };
}
