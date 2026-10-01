export type NodeType = "container" | "text" | "image" | "button" | "link" | "divider";

export type ElementRef = { kind: "element"; id: string };

export type ComponentNode = {
  id: string;
  ref?: ElementRef;
  type: NodeType;
  tag: string;
  classes: string[];
  text?: string;
  attrs?: Record<string, string>;
  overrides?: Record<string, string>;
  children: ComponentNode[];
};

export type ComponentItem = {
  id: string;
  name: string;
  slug: string;
  root: ComponentNode;
};

export type ComponentLibraryFile = {
  schemaVersion: 1;
  kind: "components";
  id: string;
  name: string;
  updatedAt: string;
  designSystemId: string;
  items: ComponentItem[];
};

export const COMPONENTS_FILENAME = "components.tpscmp.json";

export const NOT_COMPONENTS_MESSAGE =
  "This file is not a component library. Open it on its own shelf.";

export const ELEMENTS_ON_COMPONENTS = "This file is an element library. Open it on Elements.";

export const DESIGN_SYSTEM_ON_COMPONENTS =
  "This file is a design system. Open it on Design system.";

export const OTHER_DESIGN_SYSTEM_MESSAGE =
  "This component library was built with another design system.";

export const EMPTY_COMPONENTS_MESSAGE = "No components yet. Add a component, then place saved elements.";

export const EMPTY_ELEMENTS_ON_COMPONENTS = "Save a button on Elements first.";

export const COMPONENTS_EMPTY_SELECTION =
  "Nothing is selected. Add a component, or choose one from the list.";

export const CANVAS_EMPTY_MESSAGE =
  "Nothing is open. Add a component, then place saved elements inside it.";

export function groupLabel(node: ComponentNode): string {
  return node.attrs?.["data-name"]?.trim() || "Group";
}

export function isGroup(node: ComponentNode): boolean {
  return !node.ref;
}
