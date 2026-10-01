import type { DesignSystemFile } from "@/design/types";
import { renderElementHtml } from "@/elements/html";
import type { Node } from "@/elements/types";
import { buildThemeCss } from "@/preview/srcdoc";

export function buildElementSrcDoc(
  file: DesignSystemFile,
  node: Node,
  transparent: boolean,
): string {
  const theme = buildThemeCss(file);
  const surface = file.colors.some((color) => color.id === "surface");
  const pageClass = transparent ? "" : surface ? "bg-surface" : "bg-white";
  const markup = renderElementHtml(node);
  const transparentCss = transparent ? "html, body { background: transparent !important; }" : "";
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
  ${transparentCss}
</style>
</head>
<body class="${pageClass}">
  <div class="relative min-h-screen p-8">
    ${markup}
  </div>
  <script>
    const node = document.querySelector("[data-canvas-node]");
    node?.addEventListener("click", (event) => {
      event.preventDefault();
      parent.postMessage({ source: "compositional-canvas", type: "select-node" }, "*");
    });
  </script>
</body>
</html>`;
}
