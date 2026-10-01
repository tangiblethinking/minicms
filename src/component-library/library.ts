import { uniqueId } from "@/design/defaults";
import type { ElementItem } from "@/elements/types";
import type { ComponentItem, ComponentLibraryFile, ComponentNode } from "./types.ts";

export function createDefaultComponentLibrary(designSystemId: string): ComponentLibraryFile {
  return {
    schemaVersion: 1,
    kind: "components",
    id: crypto.randomUUID(),
    name: "Component library",
    updatedAt: new Date().toISOString(),
    designSystemId,
    items: [],
  };
}

export function touchComponentLibrary(file: ComponentLibraryFile): ComponentLibraryFile {
  return { ...file, updatedAt: new Date().toISOString() };
}

export function componentLibrarySignature(file: ComponentLibraryFile): string {
  return JSON.stringify({
    name: file.name,
    designSystemId: file.designSystemId,
    items: file.items,
  });
}

function uniqueLabel(base: string, used: string[]): string {
  if (!used.includes(base)) return base;
  let n = 2;
  while (used.includes(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

export function frameElement(elements: ElementItem[]): ElementItem | undefined {
  return elements.find((item) => item.slug === "frame" || item.name === "Frame");
}

export function placementNode(element: ElementItem): ComponentNode {
  return {
    id: crypto.randomUUID(),
    ref: { kind: "element", id: element.id },
    type: element.root.type,
    tag: element.root.tag,
    classes: [],
    children: [],
  };
}

export function groupNode(
  classes: string[],
  children: ComponentNode[] = [],
  name = "Group",
): ComponentNode {
  return {
    id: crypto.randomUUID(),
    type: "container",
    tag: "div",
    classes: [...classes],
    attrs: { "data-name": name },
    children,
  };
}

export function createComponent(items: ComponentItem[], elements: ElementItem[]): ComponentItem {
  const name = uniqueLabel(
    "Product card",
    items.map((item) => item.name),
  );
  const slug = uniqueId(
    name,
    items.map((item) => item.slug),
  );
  const frame = frameElement(elements);
  const root = frame
    ? placementNode(frame)
    : groupNode(["flex", "flex-col", "gap-4", "max-w-sm"], [], "Card");
  return {
    id: crypto.randomUUID(),
    name,
    slug,
    root,
  };
}
