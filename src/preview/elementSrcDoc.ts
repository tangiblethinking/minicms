import type { DesignSystemFile } from "@/design/types";
import { renderElementHtml } from "@/elements/html";
import type { ElementItem } from "@/elements/types";
import { compileStyle } from "@/props/model";
import { buildThemeCss } from "@/preview/srcdoc";

export function buildElementSrcDoc(
  file: DesignSystemFile,
  item: ElementItem,
  transparent: boolean,
  breakpoint: "mobile" | "desktop" = "desktop",
): string {
  const theme = buildThemeCss(file);
  const surface = file.colors.some((color) => color.id === "surface");
  const pageClass = transparent ? "" : surface ? "bg-surface" : "bg-white";
  const markup = renderElementHtml(item.root);
  const style = compileStyle(item.props ?? { tag: item.root.tag, text: item.root.text }, file, breakpoint);
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
    <div data-canvas-node="true" style="${style}">${markup}</div>
  </div>
  <script>
    const node = document.querySelector("[data-canvas-node]");
    node?.addEventListener("click", (event) => {
      event.preventDefault();
      parent.postMessage({ source: "compositional-canvas", type: "select-node" }, "*");
    });
    const text = node?.querySelector("[data-canvas-node]") || node;
    if (text) {
      text.setAttribute("contenteditable", "true");
      text.addEventListener("input", () => {
        parent.postMessage({ source: "compositional-canvas", type: "edit-text", text: text.textContent || "" }, "*");
      });
    }
  </script>
</body>
</html>`;
}
