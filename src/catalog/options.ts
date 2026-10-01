import type { DesignSystemFile } from "../design/types.ts";
import catalogJson from "./tailwind-catalog.json" with { type: "json" };
import type { CatalogFamily, CatalogOption, TailwindCatalog } from "./types.ts";

const catalog = catalogJson as TailwindCatalog;

export function readCatalog(): TailwindCatalog {
  return catalog;
}

function radiusLabel(id: string): string {
  if (id === "card") return "Card radius";
  return `${id.charAt(0).toUpperCase()}${id.slice(1)} radius`;
}

export function familyOptions(family: CatalogFamily, design: DesignSystemFile): CatalogOption[] {
  const tokens: CatalogOption[] = [];
  if (family.tokens === "color") {
    for (const color of design.colors) {
      if (family.id === "border-color") {
        tokens.push({ label: color.name, className: `border border-${color.id}` });
      } else if (family.classPrefix) {
        tokens.push({ label: color.name, className: `${family.classPrefix}${color.id}` });
      }
    }
  } else if (family.tokens === "font" && family.classPrefix) {
    for (const font of design.fonts) {
      tokens.push({ label: font.name, className: `${family.classPrefix}${font.id}` });
    }
  } else if (family.tokens === "radius" && family.classPrefix) {
    for (const radius of design.radius) {
      tokens.push({
        label: radiusLabel(radius.id),
        className: `${family.classPrefix}${radius.id}`,
      });
    }
  }

  const notSet = family.options.filter((option) => option.className === "");
  const rest = family.options.filter((option) => option.className !== "");
  const seen = new Set<string>();
  const options: CatalogOption[] = [];
  for (const option of [...tokens, ...rest, ...notSet]) {
    if (seen.has(option.className)) continue;
    seen.add(option.className);
    options.push(option);
  }
  return options;
}
