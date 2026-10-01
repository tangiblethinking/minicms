import { ID_PATTERN, normalizeHex } from "@/design/defaults";
import type { DesignSystemFile } from "@/design/types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "\u0026amp;")
    .replaceAll("<", "\u0026lt;")
    .replaceAll(">", "\u0026gt;")
    .replaceAll('"', "\u0026quot;");
}

export function sanitizeStack(stack: string): string {
  const cleaned = stack.replace(/[<>{};]/g, "").replace(/\s+/g, " ").trim();
  return cleaned || "ui-sans-serif, system-ui, sans-serif";
}

export function sanitizeRadius(value: string): string | null {
  const trimmed = value.trim();
  if (/^(0|(\d+(\.\d+)?)(px|rem|em|%))$/.test(trimmed)) return trimmed;
  return null;
}

export function buildThemeCss(file: DesignSystemFile): string {
  const lines = ["@theme {"];
  for (const color of file.colors) {
    const hex = normalizeHex(color.value);
    if (!ID_PATTERN.test(color.id) || !hex) continue;
    lines.push(`  --color-${color.id}: ${hex};`);
  }
  for (const font of file.fonts) {
    if (!ID_PATTERN.test(font.id)) continue;
    lines.push(`  --font-${font.id}: ${sanitizeStack(font.stack)};`);
  }
  for (const radius of file.radius) {
    const value = sanitizeRadius(radius.value);
    if (!ID_PATTERN.test(radius.id) || !value) continue;
    lines.push(`  --radius-${radius.id}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n");
}

export function buildSampleSrcDoc(file: DesignSystemFile, headingFontId: string): string {
  const theme = buildThemeCss(file);
  const headingFont = file.fonts.some((font) => font.id === headingFontId)
    ? headingFontId
    : (file.fonts[0]?.id ?? "");
  const brand = file.colors.find((color) => color.id === "brand") ?? file.colors[0];
  const ink = file.colors.some((color) => color.id === "ink");
  const surface = file.colors.some((color) => color.id === "surface");
  const muted = file.colors.some((color) => color.id === "muted");
  const headingClass = [
    "text-5xl",
    "leading-tight",
    headingFont ? `font-${headingFont}` : "",
    brand ? `text-${brand.id}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const pageClass = [
    "min-h-screen",
    "p-8",
    surface ? "bg-surface" : "",
    ink ? "text-ink" : "",
    file.fonts.some((font) => font.id === "sans") ? "font-sans" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const hasSans = file.fonts.some((font) => font.id === "sans");
  const paragraphClass = ["mt-4", "max-w-xl", "text-lg", "leading-normal", ink ? "text-ink" : "", hasSans ? "font-sans" : ""]
    .filter(Boolean)
    .join(" ");
  const swatches = file.colors
    .map((color) => {
      const radiusClass = file.radius.some((token) => token.id === "card") ? "rounded-card" : "rounded";
      const borderClass = muted ? "border border-muted" : "border border-black/10";
      return `<figure class="w-28">
        <div class="h-16 ${radiusClass} ${borderClass} bg-${color.id}"></div>
        <figcaption class="mt-2 text-sm ${ink ? "text-ink" : ""}">${escapeHtml(color.name)}</figcaption>
      </figure>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style type="text/tailwindcss">
${theme}
</style>
</head>
<body class="${pageClass}">
  <p class="text-sm ${muted ? "text-muted" : ""}">Sample</p>
  <h1 class="mt-3 ${headingClass}">Sample heading</h1>
  <p class="${paragraphClass}">Ink on Surface, set in Sans. The heading uses Brand and the heading font picked in the studio.</p>
  <div class="mt-8 flex flex-wrap gap-4">${swatches}</div>
</body>
</html>`;
}
