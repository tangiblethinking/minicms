export type DesignColor = {
  id: string;
  name: string;
  value: string;
};

export type DesignFont = {
  id: string;
  name: string;
  stack: string;
};

export type DesignRadius = {
  id: string;
  name: string;
  value: string;
};

export type TypeScale = {
  id: string;
  name: string;
  size: string;
  lineHeight: string;
};

export type SpacingToken = {
  id: string;
  name: string;
  mobile: string;
  desktop: string;
};

export type DesignSystemFile = {
  schemaVersion: 2;
  kind: "design-system";
  id: string;
  name: string;
  updatedAt: string;
  tailwindVersion: "4.3";
  colors: DesignColor[];
  fonts: DesignFont[];
  radius: DesignRadius[];
  typeScale: TypeScale[];
  spacing: {
    padding: SpacingToken[];
    gap: SpacingToken[];
    margin: SpacingToken[];
  };
};

export type Selection =
  | { kind: "color"; id: string }
  | { kind: "font"; id: string }
  | { kind: "radius"; id: string }
  | { kind: "padding"; id: string }
  | { kind: "gap"; id: string }
  | { kind: "margin"; id: string };

export const DESIGN_SYSTEM_FILENAME = "design-system.tpsds.json";

export const WRONG_FILE_MESSAGE =
  "This file is not a design system. Open it on its own shelf.";

export const EMPTY_COLORS_MESSAGE = "Add a color. Elements will use it by name.";
