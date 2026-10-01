import { ID_PATTERN } from "../design/defaults.ts";
import type { ElementItem, ElementLibraryFile, Node, NodeType } from "./types.ts";
import { DESIGN_SYSTEM_ON_ELEMENTS, NOT_ELEMENTS_MESSAGE } from "./types.ts";

export type ElementValidation =
  { ok: true; file: ElementLibraryFile } | { ok: false; message: string };

const NODE_TYPES = new Set<NodeType>(["container", "text", "image", "button", "link", "divider"]);

const KIND_MESSAGE: Record<string, string> = {
  "design-system": DESIGN_SYSTEM_ON_ELEMENTS,
  components: "This file is a component library. Open it on Components.",
  sections: "This file is a section library. Open it on Sections.",
  features: "This file is a feature library. Open it on Features.",
  pages: "This file is a page library. Open it on Pages.",
};

function fail(): ElementValidation {
  return { ok: false, message: NOT_ELEMENTS_MESSAGE };
}

function readNode(value: unknown, seen: Set<string>): Node | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if ("ref" in row) return null;
  if (typeof row.id !== "string" || row.id.length === 0 || seen.has(row.id)) return null;
  if (typeof row.type !== "string" || !NODE_TYPES.has(row.type as NodeType)) return null;
  if (typeof row.tag !== "string" || !/^[a-z][a-z0-9]*$/.test(row.tag)) return null;
  if (
    !Array.isArray(row.classes) ||
    row.classes.some((item) => typeof item !== "string" || !/^\S+$/.test(item))
  ) {
    return null;
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
  if (!Array.isArray(row.children)) return null;
  seen.add(row.id);
  const children: Node[] = [];
  for (const child of row.children) {
    const node = readNode(child, seen);
    if (!node) return null;
    children.push(node);
  }
  const node: Node = {
    id: row.id,
    type: row.type as NodeType,
    tag: row.tag,
    classes: [...row.classes],
    children,
  };
  if (typeof row.text === "string") node.text = row.text;
  if (attrs) node.attrs = attrs;
  return node;
}

function readItem(
  value: unknown,
  seenIds: Set<string>,
  seenSlugs: Set<string>,
): ElementItem | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.length === 0 || seenIds.has(row.id)) return null;
  if (typeof row.name !== "string") return null;
  if (typeof row.slug !== "string" || !ID_PATTERN.test(row.slug) || seenSlugs.has(row.slug))
    return null;
  const nodeIds = new Set<string>();
  const root = readNode(row.root, nodeIds);
  if (!root) return null;
  seenIds.add(row.id);
  seenSlugs.add(row.slug);
  return { id: row.id, name: row.name, slug: row.slug, root };
}

export function validateElementLibrary(input: unknown): ElementValidation {
  if (!input || typeof input !== "object") return fail();
  const row = input as Record<string, unknown>;
  if (typeof row.kind === "string" && row.kind !== "elements" && KIND_MESSAGE[row.kind]) {
    return { ok: false, message: KIND_MESSAGE[row.kind] };
  }
  if (row.kind !== "elements" || row.schemaVersion !== 1) return fail();
  if (typeof row.id !== "string" || row.id.length === 0) return fail();
  if (typeof row.name !== "string" || typeof row.updatedAt !== "string") return fail();
  if (typeof row.designSystemId !== "string" || row.designSystemId.length === 0) return fail();
  if (!Array.isArray(row.items)) return fail();

  const items: ElementItem[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const item of row.items) {
    const element = readItem(item, ids, slugs);
    if (!element) return fail();
    items.push(element);
  }

  return {
    ok: true,
    file: {
      schemaVersion: 1,
      kind: "elements",
      id: row.id,
      name: row.name,
      updatedAt: row.updatedAt,
      designSystemId: row.designSystemId,
      items,
    },
  };
}
