import type { CatalogFamily } from "@/catalog/types";
import type { Node } from "./types.ts";

const FLEX_DISPLAY = new Set(["flex", "inline-flex", "grid"]);

export function isTextual(node: Node): boolean {
  return (
    node.type === "text" ||
    node.type === "button" ||
    node.type === "link" ||
    typeof node.text === "string"
  );
}

export function familyApplies(family: CatalogFamily, node: Node): boolean {
  if (node.type === "divider") return false;
  if (family.id === "direction" || family.id === "gap") {
    return node.classes.some((className) => FLEX_DISPLAY.has(className));
  }
  if (
    family.id === "font" ||
    family.id === "font-size" ||
    family.id === "font-weight" ||
    family.id === "text-color"
  ) {
    return isTextual(node);
  }
  if (family.group === "image") return node.type === "image";
  if (family.group === "state") return node.type === "button" || node.type === "link";
  return true;
}
