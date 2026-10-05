import type { DesignSystemFile } from "@/design/types";

export type SizeMode = "hug" | "fill" | "fixed";

export type Align =
  | "left-top"
  | "center-top"
  | "right-top"
  | "left"
  | "center"
  | "right"
  | "left-bottom"
  | "center-bottom"
  | "right-bottom";

export type Properties = {
  tag?: string;
  text?: string;
  fontId?: string;
  sizeId?: string;
  weight?: string;
  textAlign?: "left" | "center" | "right";
  textColorId?: string;
  fillId?: string;
  radiusId?: string;
  shadow?: string;
  widthMode?: SizeMode;
  width?: string;
  heightMode?: SizeMode;
  height?: string;
  align?: Align;
  paddingId?: string;
  gapId?: string;
  marginId?: string;
  src?: string;
  alt?: string;
  fit?: "fill" | "contain" | "cover";
  href?: string;
  hidden?: boolean;
};

export const ALIGN_OPTIONS: { id: Align; label: string }[] = [
  { id: "left-top", label: "Left top" },
  { id: "center-top", label: "Center top" },
  { id: "right-top", label: "Right top" },
  { id: "left", label: "Left" },
  { id: "center", label: "Center" },
  { id: "right", label: "Right" },
  { id: "left-bottom", label: "Left bottom" },
  { id: "center-bottom", label: "Center bottom" },
  { id: "right-bottom", label: "Right bottom" },
];

export const TAG_OPTIONS = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "button", "img", "div", "input"];

export function spacingValue(
  file: DesignSystemFile,
  kind: "padding" | "gap" | "margin",
  id: string | undefined,
  breakpoint: "mobile" | "desktop",
): string | undefined {
  if (!id) return undefined;
  return file.spacing[kind].find((token) => token.id === id)?.[breakpoint];
}

export function compileStyle(
  props: Properties,
  file: DesignSystemFile,
  breakpoint: "mobile" | "desktop",
): string {
  const rules: string[] = [];
  if (props.widthMode === "hug") rules.push("width:fit-content");
  if (props.widthMode === "fill") rules.push("width:100%");
  if (props.widthMode === "fixed" && props.width) rules.push(`width:${props.width}`);
  if (props.heightMode === "hug") rules.push("height:fit-content");
  if (props.heightMode === "fill") rules.push("height:100%");
  if (props.heightMode === "fixed" && props.height) rules.push(`height:${props.height}`);
  const fill = file.colors.find((color) => color.id === props.fillId)?.value;
  if (fill) rules.push(`background:${fill}`);
  const text = file.colors.find((color) => color.id === props.textColorId)?.value;
  if (text) rules.push(`color:${text}`);
  const font = file.fonts.find((item) => item.id === props.fontId)?.stack;
  if (font) rules.push(`font-family:${font}`);
  const scale = file.typeScale.find((item) => item.id === props.sizeId);
  if (scale) {
    rules.push(`font-size:${scale.size}`);
    rules.push(`line-height:${scale.lineHeight}`);
  }
  if (props.weight === "semibold") rules.push("font-weight:600");
  if (props.weight === "medium") rules.push("font-weight:500");
  if (props.weight === "bold") rules.push("font-weight:700");
  if (props.textAlign) rules.push(`text-align:${props.textAlign}`);
  const radius = file.radius.find((item) => item.id === props.radiusId)?.value;
  if (radius) rules.push(`border-radius:${radius}`);
  if (props.shadow === "small") rules.push("box-shadow:0 1px 2px rgb(0 0 0 / 0.08)");
  const pad = spacingValue(file, "padding", props.paddingId, breakpoint);
  if (pad) rules.push(`padding-block:${pad}`);
  const gap = spacingValue(file, "gap", props.gapId, breakpoint);
  if (gap) rules.push(`column-gap:${gap}`);
  if (props.fit) rules.push(`object-fit:${props.fit}`);
  const align = props.align;
  if (align === "left" || align === "left-top" || align === "left-bottom") rules.push("align-self:flex-start");
  if (align === "right" || align === "right-top" || align === "right-bottom") rules.push("align-self:flex-end");
  if (align === "center" || align === "center-top" || align === "center-bottom") rules.push("align-self:center");
  return rules.join(";");
}

export function propsHint(props: Properties, file: DesignSystemFile): string {
  const size = file.typeScale.find((item) => item.id === props.sizeId)?.name;
  const width = props.widthMode === "fixed" ? props.width : props.widthMode;
  return [props.tag, size, width].filter(Boolean).join(" · ");
}
