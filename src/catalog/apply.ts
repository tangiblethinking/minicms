export const REQUIRED_FAMILY_IDS = [
  "padding",
  "margin",
  "gap",
  "width",
  "height",
  "aspect",
  "font-size",
  "font-weight",
  "text-color",
  "background",
  "border-color",
  "radius",
  "shadow",
  "object-fit",
  "object-position",
  "hover-shadow",
] as const;

export const KNOWN_FAMILY_IDS = new Set<string>([
  ...REQUIRED_FAMILY_IDS,
  "display",
  "direction",
  "font",
  "hover-background",
]);

const FONT_SIZES = new Set([
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
  "text-5xl",
  "text-6xl",
  "text-7xl",
  "text-8xl",
  "text-9xl",
]);

const TEXT_LAYOUT = new Set([
  "text-left",
  "text-center",
  "text-right",
  "text-justify",
  "text-start",
  "text-end",
  "text-ellipsis",
  "text-wrap",
  "text-nowrap",
  "text-balance",
  "text-pretty",
  "text-clip",
]);

const FONT_WEIGHTS = new Set([
  "font-thin",
  "font-extralight",
  "font-light",
  "font-normal",
  "font-medium",
  "font-semibold",
  "font-bold",
  "font-extrabold",
  "font-black",
]);

const DISPLAY = new Set([
  "block",
  "inline",
  "inline-block",
  "flex",
  "inline-flex",
  "grid",
  "hidden",
]);

const OBJECT_FIT = new Set([
  "object-contain",
  "object-cover",
  "object-fill",
  "object-none",
  "object-scale-down",
]);

const OBJECT_POSITION = new Set([
  "object-center",
  "object-top",
  "object-bottom",
  "object-left",
  "object-right",
  "object-left-top",
  "object-left-bottom",
  "object-right-top",
  "object-right-bottom",
]);

const BORDER_SKIP = new Set([
  "border-0",
  "border-2",
  "border-4",
  "border-8",
  "border-t",
  "border-b",
  "border-l",
  "border-r",
  "border-x",
  "border-y",
  "border-s",
  "border-e",
  "border-solid",
  "border-dashed",
  "border-dotted",
  "border-double",
  "border-none",
  "border-collapse",
  "border-separate",
]);

export type OwnsContext = {
  fontIds: string[];
};

function ownsBorder(className: string): boolean {
  if (className === "border") return true;
  if (!className.startsWith("border-")) return false;
  if (BORDER_SKIP.has(className)) return false;
  if (/^border-[trblxyse]-/.test(className)) return false;
  return /^border-[a-z0-9[]/.test(className);
}

export function isOwned(familyId: string, className: string, ctx: OwnsContext): boolean {
  switch (familyId) {
    case "display":
      return DISPLAY.has(className);
    case "direction":
      return /^flex-(row|col|row-reverse|col-reverse)$/.test(className);
    case "width":
      return /^w-/.test(className);
    case "height":
      return /^h-/.test(className);
    case "aspect":
      return /^aspect-/.test(className);
    case "padding":
      return /^(p|px|py|pt|pr|pb|pl)-/.test(className);
    case "margin":
      return /^(m|mx|my|mt|mr|mb|ml)-/.test(className);
    case "gap":
      return /^(gap|gap-x|gap-y)-/.test(className);
    case "font":
      return ctx.fontIds.some((id) => className === `font-${id}`);
    case "font-size":
      return FONT_SIZES.has(className);
    case "font-weight":
      return FONT_WEIGHTS.has(className);
    case "text-color":
      return (
        className.startsWith("text-") && !FONT_SIZES.has(className) && !TEXT_LAYOUT.has(className)
      );
    case "background":
      return /^bg-/.test(className) && !className.startsWith("bg-gradient");
    case "border-color":
      return ownsBorder(className);
    case "radius":
      return /^rounded(?:$|-)/.test(className);
    case "shadow":
      return /^shadow(?:$|-)/.test(className);
    case "object-fit":
      return OBJECT_FIT.has(className);
    case "object-position":
      return OBJECT_POSITION.has(className);
    case "hover-shadow":
      return /^hover:shadow(?:$|-)/.test(className);
    case "hover-background":
      return /^hover:bg-/.test(className);
    default:
      return false;
  }
}

export function ownedClasses(classes: string[], familyId: string, ctx: OwnsContext): string[] {
  return classes.filter((className) => isOwned(familyId, className, ctx));
}

export function applyFamily(
  classes: string[],
  familyId: string,
  next: string,
  ctx: OwnsContext,
): string[] {
  const kept = classes.filter((className) => !isOwned(familyId, className, ctx));
  const adding = next.split(/\s+/).filter(Boolean);
  return [...kept, ...adding];
}

export function sameClassSet(className: string, current: string[]): boolean {
  const next = className.split(/\s+/).filter(Boolean);
  if (next.length !== current.length) return false;
  const have = new Set(current);
  return next.every((item) => have.has(item));
}
