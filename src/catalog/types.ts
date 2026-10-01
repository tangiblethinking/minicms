export type CatalogGroup = "layout" | "spacing" | "type" | "color" | "surface" | "image" | "state";

export type CatalogOption = {
  label: string;
  className: string;
};

export type CatalogFamily = {
  id: string;
  label: string;
  group: CatalogGroup;
  tokens?: "color" | "font" | "radius";
  classPrefix?: string;
  options: CatalogOption[];
};

export type TailwindCatalog = {
  tailwindVersion: "4.3";
  families: CatalogFamily[];
};

export const GROUP_ORDER: CatalogGroup[] = [
  "layout",
  "spacing",
  "type",
  "color",
  "surface",
  "image",
  "state",
];

export const GROUP_LABEL: Record<CatalogGroup, string> = {
  layout: "Layout",
  spacing: "Spacing",
  type: "Type",
  color: "Color",
  surface: "Surface",
  image: "Image",
  state: "State",
};
