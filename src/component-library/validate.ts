import { ID_PATTERN } from "@/design/defaults";
import type { ComponentItem, ComponentLibraryFile, ComponentNode, NodeType } from "./types.ts";
import {
  DESIGN_SYSTEM_ON_COMPONENTS,
  ELEMENTS_ON_COMPONENTS,
  NOT_COMPONENTS_MESSAGE,
} from "./types.ts";

export type ComponentValidation =
  { ok: true; file: ComponentLibraryFile } | { ok: false; message: string };

const NODE_TYPES = new Set<NodeType>(["container", "text", "image", "button", "link", "divider"]);

const KIND_MESSAGE: Record<string, string> = {
  "design-system": DESIGN_SYSTEM_ON_COMPONENTS,
  elements: ELEMENTS_ON_COMPONENTS,
  sections: "This file is a section library. Open it on Sections.",
  features: "This file is a feature library. Open it on Features.",
  pages: "This file is a page library. Open it on Pages.",
};

function fail(): ComponentValidation {
  return { ok: false, message: NOT_COMPONENTS_MESSAGE };
}

function readOverrides(value: unknown): Record<string, string> | null | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const overrides: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!["text", "src", "alt", "href"].includes(key) || typeof entry !== "string") return null;
    overrides[key] = entry;
  }
  return overrides;
}

function readNode(value: unknown, seen: Set<string>): ComponentNode | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.length === 0 || seen.has(row.id)) return null;
  if (typeof row.type !== "string" || !NODE_TYPES.has(row.type as NodeType)) return null;
  if (typeof row.tag !== "string" || !/^[a-z][a-z0-9]*$/.test(row.tag)) return null;
  if (
    !Array.isArray(row.classes) ||
    row.classes.some((item) => typeof item !== "string" || !/^\S+$/.test(item))
  ) {
    return null;
  }
  let ref: ComponentNode["ref"];
  if (row.ref !== undefined) {
    if (!row.ref || typeof row.ref !== "object" || Array.isArray(row.ref)) return null;
    const pointer = row.ref as Record<string, unknown>;
    if (pointer.kind !== "element" || typeof pointer.id !== "string" || pointer.id.length === 0) {
      return null;
    }
    ref = { kind: "element", id: pointer.id };
    if (row.classes.length > 0) return null;
  }
  if (row.text !== undefined && typeof row.text !== "string") return null;
  let attrs: Record<string, string> | undefined;
  if (row.attrs !== undefined) {
    if (!row.attrs || typeof row.attrs !== "object" || Array.isArray(row.attrs)) return null;
    attrs = {};
    for (const [key, attr] of Object.entries(row.attrs)) {
      if (!/^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(key) || typeof attr !== "string") return null;
      attrs[key] = attr;
    }
  }
  const overrides = readOverrides(row.overrides);
  if (overrides === null) return null;
  if (ref && overrides === undefined && row.classes.length > 0) return null;
  if (!Array.isArray(row.children)) return null;
  seen.add(row.id);
  const children: ComponentNode[] = [];
  for (const child of row.children) {
    const node = readNode(child, seen);
    if (!node) return null;
    children.push(node);
  }
  const node: ComponentNode = {
    id: row.id,
    type: row.type as NodeType,
    tag: row.tag,
    classes: ref ? [] : [...row.classes],
    children,
  };
  if (ref) node.ref = ref;
  if (typeof row.text === "string") node.text = row.text;
  if (attrs) node.attrs = attrs;
  if (overrides) node.overrides = overrides;
  return node;
}

function readItem(
  value: unknown,
  seenIds: Set<string>,
  seenSlugs: Set<string>,
): ComponentItem | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.length === 0 || seenIds.has(row.id)) return null;
  if (typeof row.name !== "string") return null;
  if (typeof row.slug !== "string" || !ID_PATTERN.test(row.slug) || seenSlugs.has(row.slug)) {
    return null;
  }
  const nodeIds = new Set<string>();
  const root = readNode(row.root, nodeIds);
  if (!root) return null;
  seenIds.add(row.id);
  seenSlugs.add(row.slug);
  return { id: row.id, name: row.name, slug: row.slug, root };
}

export function validateComponentLibrary(input: unknown): ComponentValidation {
  if (!input || typeof input !== "object") return fail();
  const row = input as Record<string, unknown>;
  if (typeof row.kind === "string" && row.kind !== "components" && KIND_MESSAGE[row.kind]) {
    return { ok: false, message: KIND_MESSAGE[row.kind] };
  }
  if (row.kind !== "components" || row.schemaVersion !== 1) return fail();
  if (typeof row.id !== "string" || row.id.length === 0) return fail();
  if (typeof row.name !== "string" || typeof row.updatedAt !== "string") return fail();
  if (typeof row.designSystemId !== "string" || row.designSystemId.length === 0) return fail();
  if (!Array.isArray(row.items)) return fail();

  const items: ComponentItem[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const item of row.items) {
    const component = readItem(item, ids, slugs);
    if (!component) return fail();
    items.push(component);
  }

  return {
    ok: true,
    file: {
      schemaVersion: 1,
      kind: "components",
      id: row.id,
      name: row.name,
      updatedAt: row.updatedAt,
      designSystemId: row.designSystemId,
      items,
    },
  };
}
