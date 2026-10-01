import type { ElementItem, Node } from "@/elements/types";
import { escapeHtml, formatElementHtml, renderElementHtml } from "@/elements/html";
import type { ComponentNode } from "./types.ts";
import { groupLabel } from "./types.ts";

export type ResolvedNode = Node & { sourceId: string; missing?: string };

const OVERRIDE_KEYS = ["text", "src", "alt", "href"] as const;

export function findNode(root: ComponentNode, id: string): ComponentNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: ComponentNode, id: string): ComponentNode | null {
  for (const child of root.children) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

export function nodePath(root: ComponentNode, id: string): ComponentNode[] {
  if (root.id === id) return [root];
  for (const child of root.children) {
    const path = nodePath(child, id);
    if (path.length > 0) return [root, ...path];
  }
  return [];
}

function mapChildren(
  node: ComponentNode,
  visit: (node: ComponentNode) => ComponentNode,
): ComponentNode {
  return visit({ ...node, children: node.children.map((child) => mapChildren(child, visit)) });
}

export function updateNode(
  root: ComponentNode,
  id: string,
  patch: (node: ComponentNode) => ComponentNode,
): ComponentNode {
  return mapChildren(root, (node) => (node.id === id ? patch(node) : node));
}

export function insertPlacement(root: ComponentNode, parentId: string, child: ComponentNode): ComponentNode {
  return updateNode(root, parentId, (node) => ({ ...node, children: [...node.children, child] }));
}

export function acceptsChildren(node: ComponentNode): boolean {
  return !node.ref || node.type === "container";
}

export function insertTargetId(root: ComponentNode, selectedId: string | null): string {
  if (!selectedId) return root.id;
  const selected = findNode(root, selectedId);
  if (!selected) return root.id;
  if (acceptsChildren(selected)) return selected.id;
  return findParent(root, selected.id)?.id ?? root.id;
}

export function moveSibling(root: ComponentNode, id: string, direction: -1 | 1): ComponentNode {
  const parent = findParent(root, id);
  if (!parent) return root;
  const index = parent.children.findIndex((child) => child.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= parent.children.length) return root;
  const children = [...parent.children];
  const [item] = children.splice(index, 1);
  if (!item) return root;
  children.splice(next, 0, item);
  return updateNode(root, parent.id, (node) => ({ ...node, children }));
}

export function groupSelection(root: ComponentNode, id: string): ComponentNode {
  if (root.id === id) return root;
  const parent = findParent(root, id);
  const node = findNode(root, id);
  if (!parent || !node) return root;
  const index = parent.children.findIndex((child) => child.id === id);
  const next = parent.children[index + 1];
  const wrapped = next ? [node, next] : [node];
  const group: ComponentNode = {
    id: crypto.randomUUID(),
    type: "container",
    tag: "div",
    classes: ["flex", "flex-row", "items-baseline", "gap-2"],
    attrs: { "data-name": wrapped.some((child) => child.type === "text") ? "Price row" : "Group" },
    children: wrapped,
  };
  const children = [...parent.children];
  children.splice(index, wrapped.length, group);
  return updateNode(root, parent.id, (current) => ({ ...current, children }));
}

export function ungroupSelection(root: ComponentNode, id: string): ComponentNode {
  if (root.id === id) return root;
  const parent = findParent(root, id);
  const node = findNode(root, id);
  if (!parent || !node || node.ref) return root;
  const index = parent.children.findIndex((child) => child.id === id);
  const children = [...parent.children];
  children.splice(index, 1, ...node.children);
  return updateNode(root, parent.id, (current) => ({ ...current, children }));
}

export function removeNode(root: ComponentNode, id: string): ComponentNode | null {
  if (root.id === id) return null;
  const parent = findParent(root, id);
  if (!parent) return root;
  return updateNode(root, parent.id, (node) => ({
    ...node,
    children: node.children.filter((child) => child.id !== id),
  }));
}

function applyOverrides(element: Node, overrides: Record<string, string> | undefined): Node {
  const next: Node = {
    ...element,
    classes: [...element.classes],
    attrs: element.attrs ? { ...element.attrs } : undefined,
    children: element.children.map((child) => applyOverrides(child, undefined)),
  };
  if (!overrides) return next;
  if (overrides.text !== undefined) next.text = overrides.text;
  const attrs = { ...next.attrs };
  if (overrides.src !== undefined) attrs.src = overrides.src;
  if (overrides.alt !== undefined) attrs.alt = overrides.alt;
  if (overrides.href !== undefined) attrs.href = overrides.href;
  if (Object.keys(attrs).length > 0) next.attrs = attrs;
  return next;
}

export function resolveNode(node: ComponentNode, elements: ElementItem[]): ResolvedNode {
  if (node.ref) {
    const element = elements.find((item) => item.id === node.ref?.id);
    if (!element) {
      return {
        id: node.id,
        sourceId: node.id,
        type: "container",
        tag: "div",
        classes: ["border", "border-dashed", "border-ink", "p-4", "text-sm", "text-ink"],
        text: `Missing: ${node.ref.id} (element)`,
        missing: node.ref.id,
        children: [],
      };
    }
    const resolved = applyOverrides(element.root, node.overrides);
    return {
      ...resolved,
      id: node.id,
      sourceId: node.id,
      children: node.children.map((child) => resolveNode(child, elements)),
    };
  }
  const attrs = { ...node.attrs };
  delete attrs["data-name"];
  return {
    id: node.id,
    sourceId: node.id,
    type: node.type,
    tag: node.tag,
    classes: [...node.classes],
    text: node.text,
    attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
    children: node.children.map((child) => resolveNode(child, elements)),
  };
}

export function renderResolvedHtml(node: ResolvedNode): string {
  return renderElementHtml(node);
}

export function formatResolvedHtml(node: ResolvedNode): string {
  return formatElementHtml(node);
}

export function missingLabel(id: string): string {
  return `Missing: ${id} (element)`;
}

export function trailLabels(
  componentName: string,
  root: ComponentNode,
  selectedId: string | null,
  elements: ElementItem[],
): string[] {
  const path = selectedId ? nodePath(root, selectedId) : [root];
  const labels = path.map((node) => {
    if (node.ref) {
      return elements.find((item) => item.id === node.ref?.id)?.name || "Missing element";
    }
    return groupLabel(node);
  });
  return [componentName, ...labels];
}

export function librarySource(item: unknown): string {
  return JSON.stringify(item, null, 2);
}

export function overrideKeys(): readonly string[] {
  return OVERRIDE_KEYS;
}

export function escapeLabel(value: string): string {
  return escapeHtml(value);
}
