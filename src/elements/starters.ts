import { uniqueId } from "../design/defaults.ts";
import type { Properties } from "@/props/model";
import type { ElementItem, Node, NodeType } from "./types.ts";

export const DEFAULT_IMAGE_SRC = "https://picsum.photos/id/1011/800/1000";

export type Starter = {
  id: string;
  label: string;
  type: NodeType;
  tag: string;
  classes: string[];
  text?: string;
  attrs?: Record<string, string>;
};

export const STARTERS: Starter[] = [
  {
    id: "frame",
    label: "Frame",
    type: "container",
    tag: "div",
    classes: ["bg-surface", "rounded-card", "p-4", "shadow-sm"],
  },
  {
    id: "image",
    label: "Image",
    type: "image",
    tag: "img",
    classes: ["aspect-[4/5]", "w-full", "object-cover"],
    attrs: { src: DEFAULT_IMAGE_SRC, alt: "Photo" },
  },
  {
    id: "heading",
    label: "Heading",
    type: "text",
    tag: "h2",
    classes: ["font-display", "text-xl", "font-semibold", "text-ink"],
    text: "Heading",
  },
  {
    id: "body",
    label: "Body",
    type: "text",
    tag: "p",
    classes: ["font-sans", "text-sm", "text-muted"],
    text: "Body",
  },
  {
    id: "price",
    label: "Price",
    type: "text",
    tag: "span",
    classes: ["font-sans", "text-base", "font-semibold", "text-ink"],
    text: "$48",
  },
  {
    id: "strike-price",
    label: "Strike price",
    type: "text",
    tag: "span",
    classes: ["font-sans", "text-sm", "text-muted", "line-through"],
    text: "$64",
  },
  {
    id: "button",
    label: "Button",
    type: "link",
    tag: "a",
    classes: [
      "inline-flex",
      "rounded-card",
      "bg-brand",
      "px-4",
      "py-2",
      "font-sans",
      "text-sm",
      "text-white",
    ],
    text: "Button",
  },
  {
    id: "pill",
    label: "Pill",
    type: "text",
    tag: "span",
    classes: [
      "absolute",
      "left-3",
      "top-3",
      "rounded-full",
      "bg-brand",
      "px-3",
      "py-1",
      "text-xs",
      "text-white",
    ],
    text: "New",
  },
];

function uniqueLabel(base: string, used: string[]): string {
  if (!used.includes(base)) return base;
  let n = 2;
  while (used.includes(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

export function createElementFromStarter(starter: Starter, items: ElementItem[]): ElementItem {
  const name = uniqueLabel(
    starter.label,
    items.map((item) => item.name),
  );
  const slug = uniqueId(
    name,
    items.map((item) => item.slug),
  );
  const root: Node = {
    id: crypto.randomUUID(),
    type: starter.type,
    tag: starter.tag,
    classes: [...starter.classes],
    children: [],
  };
  if (starter.text !== undefined) root.text = starter.text;
  if (starter.attrs) root.attrs = { ...starter.attrs };
  const props: Properties = {
    tag: starter.tag,
    text: starter.text,
    widthMode: starter.id === "frame" || starter.id === "image" || starter.id === "button" ? "fill" : "hug",
    heightMode: starter.id === "image" ? "fixed" : "hug",
    height: starter.id === "image" ? "200px" : undefined,
    sizeId: starter.id === "heading" ? "title" : starter.id === "price" ? "body" : "small",
    paddingId: starter.id === "frame" ? "comfortable" : starter.id === "button" ? "compact" : undefined,
    src: starter.attrs?.src,
    alt: starter.attrs?.alt,
    href: starter.id === "button" ? "#" : undefined,
  };
  return {
    id: crypto.randomUUID(),
    name,
    slug,
    props,
    root,
  };
}
