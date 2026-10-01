export type NodeType = "container" | "text" | "image" | "button" | "link" | "divider";

export type Node = {
  id: string;
  type: NodeType;
  tag: string;
  classes: string[];
  text?: string;
  attrs?: Record<string, string>;
  children: Node[];
};

export type ElementItem = {
  id: string;
  name: string;
  slug: string;
  root: Node;
};

export type ElementLibraryFile = {
  schemaVersion: 1;
  kind: "elements";
  id: string;
  name: string;
  updatedAt: string;
  designSystemId: string;
  items: ElementItem[];
};

export const ELEMENTS_FILENAME = "elements.tpsel.json";

export const NOT_ELEMENTS_MESSAGE =
  "This file is not an element library. Open it on its own shelf.";

export const DESIGN_SYSTEM_ON_ELEMENTS = "This file is a design system. Open it on Design system.";

export const OTHER_DESIGN_SYSTEM_MESSAGE =
  "This element library was built with another design system.";

export const EMPTY_ELEMENTS_MESSAGE = "No elements yet. Add a button, heading, or image.";

export const ELEMENTS_EMPTY_SELECTION =
  "Nothing is selected. Add an element, or choose one from the list.";

const KIND_LABEL: Record<NodeType, string> = {
  container: "Container",
  text: "Text",
  image: "Image",
  button: "Button",
  link: "Link",
  divider: "Divider",
};

export function kindLabel(type: NodeType): string {
  return KIND_LABEL[type];
}
