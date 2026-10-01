import type { DesignSystemFile } from "@/design/types";
import type { ElementItem } from "@/elements/types";
import { escapeHtml } from "@/elements/html";
import type { ComponentNode } from "@/component-library/types";
import { resolveNode, type ResolvedNode } from "@/component-library/tree";
import { buildThemeCss } from "@/preview/srcdoc";

function renderResolved(node: ResolvedNode): string {
  const classes = node.classes.length > 0 ? ` class="${escapeHtml(node.classes.join(" "))}"` : "";
  const attrParts = [`data-canvas-id="${escapeHtml(node.sourceId)}"${classes}`];
  if (node.attrs) {
    for (const [key, value] of Object.entries(node.attrs)) {
      if (!/^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(key)) continue;
      attrParts.push(`${key}="${escapeHtml(value)}"`);
    }
  }
  const attr = ` ${attrParts.join(" ")}`;
  if (node.tag === "img" || node.tag === "hr" || node.tag === "br") {
    return `<${node.tag}${attr} />`;
  }
  const text = escapeHtml(node.text ?? "");
  const children = node.children.map((child) => renderResolved(child as ResolvedNode)).join("");
  return `<${node.tag}${attr}>${text}${children}</${node.tag}>`;
}

export function buildComponentSrcDoc(
  file: DesignSystemFile,
  root: ComponentNode,
  elements: ElementItem[],
): string {
  const theme = buildThemeCss(file);
  const markup = renderResolved(resolveNode(root, elements));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style type="text/tailwindcss">
${theme}
</style>
<style>
  html, body { margin: 0; min-height: 100%; }
</style>
</head>
<body class="bg-surface">
  <div class="relative min-h-screen p-8">
    ${markup}
  </div>
  <script>
    document.querySelectorAll("[data-canvas-id]").forEach((node) => {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        parent.postMessage({
          source: "compositional-canvas",
          type: "select-node",
          id: node.getAttribute("data-canvas-id")
        }, "*");
      });
    });
  </script>
</body>
</html>`;
}
