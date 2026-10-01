import type { ElementLibraryFile, Node } from "./types.ts";

export function createDefaultElementLibrary(designSystemId: string): ElementLibraryFile {
  return {
    schemaVersion: 1,
    kind: "elements",
    id: crypto.randomUUID(),
    name: "Element library",
    updatedAt: new Date().toISOString(),
    designSystemId,
    items: [],
  };
}

export function touchLibrary(file: ElementLibraryFile): ElementLibraryFile {
  return { ...file, updatedAt: new Date().toISOString() };
}

export function librarySignature(file: ElementLibraryFile): string {
  return JSON.stringify({
    name: file.name,
    designSystemId: file.designSystemId,
    items: file.items,
  });
}

function walk(node: Node, visit: (node: Node) => void) {
  visit(node);
  for (const child of node.children) walk(child, visit);
}

export function missingImageMessage(root: Node): string | null {
  let url = false;
  let alt = false;
  walk(root, (node) => {
    if (node.type !== "image") return;
    if (!node.attrs?.src?.trim()) url = true;
    if (!node.attrs?.alt?.trim()) alt = true;
  });
  if (url && alt) return "Add an image URL and alt text, then save.";
  if (url) return "Add an image URL, then save.";
  if (alt) return "Add alt text for the image, then save.";
  return null;
}
