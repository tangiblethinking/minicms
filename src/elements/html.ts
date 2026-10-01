import type { Node } from "./types.ts";

const VOID_TAGS = new Set(["img", "hr", "br", "input"]);

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "\u0026amp;")
    .replaceAll("<", "\u0026lt;")
    .replaceAll(">", "\u0026gt;")
    .replaceAll('"', "\u0026quot;");
}

function attrParts(node: Node, extra: string[]): string[] {
  const attrs = [...extra];
  if (node.classes.length > 0) attrs.push(`class="${escapeHtml(node.classes.join(" "))}"`);
  if (node.attrs) {
    for (const [key, value] of Object.entries(node.attrs)) {
      if (!/^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(key)) continue;
      attrs.push(`${key}="${escapeHtml(value)}"`);
    }
  }
  return attrs;
}

function formatNode(node: Node, indent: number): string {
  const pad = "  ".repeat(indent);
  const attrs = attrParts(node, []).map((attr) => `${pad}  ${attr}`);
  if (VOID_TAGS.has(node.tag)) {
    if (attrs.length === 0) return `${pad}<${node.tag} />`;
    return [`${pad}<${node.tag}`, ...attrs, `${pad}/>`].join("\n");
  }
  const open =
    attrs.length === 0
      ? `${pad}<${node.tag}>`
      : [`${pad}<${node.tag}`, ...attrs, `${pad}>`].join("\n");
  const text = node.text ? `${pad}  ${escapeHtml(node.text)}` : "";
  const children = node.children.map((child) => formatNode(child, indent + 1));
  const inner = [text, ...children].filter(Boolean).join("\n");
  return `${open}\n${inner}\n${pad}</${node.tag}>`;
}

export function formatElementHtml(node: Node): string {
  return formatNode(node, 0);
}

function renderNode(node: Node, root: boolean): string {
  const extra = root ? [`data-canvas-node="true"`] : [];
  const attrs = attrParts(node, extra);
  const attr = attrs.length ? ` ${attrs.join(" ")}` : "";
  if (VOID_TAGS.has(node.tag)) return `<${node.tag}${attr} />`;
  const text = escapeHtml(node.text ?? "");
  const children = node.children.map((child) => renderNode(child, false)).join("");
  return `<${node.tag}${attr}>${text}${children}</${node.tag}>`;
}

export function renderElementHtml(node: Node): string {
  return renderNode(node, true);
}
