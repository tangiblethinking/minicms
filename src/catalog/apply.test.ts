import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyFamily, isOwned, KNOWN_FAMILY_IDS, REQUIRED_FAMILY_IDS } from "./apply.ts";
import { createDefaultDesignSystem } from "../design/defaults.ts";
import { familyOptions, readCatalog } from "./options.ts";
import { formatElementHtml } from "../elements/html.ts";
import { createElementFromStarter, STARTERS } from "../elements/starters.ts";
import { validateElementLibrary } from "../elements/validate.ts";
import { DESIGN_SYSTEM_ON_ELEMENTS } from "../elements/types.ts";

const ctx = { fontIds: ["sans", "display"] };

describe("catalog families", () => {
  it("checks in every family this phase writes", () => {
    const catalog = JSON.parse(
      readFileSync(new URL("./tailwind-catalog.json", import.meta.url), "utf8"),
    ) as {
      tailwindVersion: string;
      families: { id: string }[];
    };
    assert.equal(catalog.tailwindVersion, "4.3");
    const ids = catalog.families.map((family) => family.id);
    for (const id of REQUIRED_FAMILY_IDS) assert.ok(ids.includes(id), id);
    for (const id of ids) assert.equal(KNOWN_FAMILY_IDS.has(id), true, id);
    assert.equal(readCatalog().families.length, ids.length);
  });
});

describe("applyFamily", () => {
  it("replaces only the background family", () => {
    const button = STARTERS.find((starter) => starter.id === "button");
    assert.ok(button);
    const next = applyFamily(button.classes, "background", "bg-brand", ctx);
    assert.equal(next.includes("bg-brand"), true);
    assert.equal(
      next.some((className) => className.includes("#")),
      false,
    );
    assert.equal(next.includes("text-white"), true);
    assert.equal(next.includes("px-4"), true);
    assert.equal(next.includes("py-2"), true);
    assert.equal(next.includes("font-sans"), true);
  });

  it("keeps classes the designer did not set when another family changes", () => {
    const pill = STARTERS.find((starter) => starter.id === "pill");
    assert.ok(pill);
    const next = applyFamily(pill.classes, "background", "bg-ink", ctx);
    for (const kept of [
      "absolute",
      "left-3",
      "top-3",
      "rounded-full",
      "px-3",
      "py-1",
      "text-xs",
      "text-white",
    ]) {
      assert.equal(next.includes(kept), true, kept);
    }
    assert.equal(next.includes("bg-brand"), false);
    assert.equal(next.includes("bg-ink"), true);
  });

  it("does not treat font size as text color or font weight as font family", () => {
    const classes = ["font-display", "text-xl", "font-semibold", "text-ink", "line-through"];
    const sized = applyFamily(classes, "font-size", "text-sm", ctx);
    assert.deepEqual(sized, [
      "font-display",
      "font-semibold",
      "text-ink",
      "line-through",
      "text-sm",
    ]);
    const colored = applyFamily(classes, "text-color", "text-brand", ctx);
    assert.equal(colored.includes("text-xl"), true);
    assert.equal(colored.includes("text-ink"), false);
    assert.equal(colored.includes("text-brand"), true);
    assert.equal(colored.includes("line-through"), true);
    const family = applyFamily(classes, "font", "font-sans", ctx);
    assert.equal(family.includes("font-semibold"), true);
    assert.equal(family.includes("font-display"), false);
    assert.equal(family.includes("font-sans"), true);
  });

  it("does not delete border width utilities outside the border color family", () => {
    const classes = ["border-2", "border-t", "border-ink", "p-4"];
    const next = applyFamily(classes, "border-color", "border border-brand", ctx);
    assert.equal(next.includes("border-2"), true);
    assert.equal(next.includes("border-t"), true);
    assert.equal(next.includes("p-4"), true);
    assert.equal(next.includes("border-ink"), false);
    assert.equal(next.includes("border"), true);
    assert.equal(next.includes("border-brand"), true);
    assert.equal(isOwned("border-color", "border-2", ctx), false);
  });
});

describe("family options", () => {
  it("names design-system colors and the card radius", () => {
    const design = createDefaultDesignSystem();
    const background = readCatalog().families.find((family) => family.id === "background");
    const radius = readCatalog().families.find((family) => family.id === "radius");
    assert.ok(background);
    assert.ok(radius);
    const colors = familyOptions(background, design);
    assert.equal(
      colors.some((option) => option.label === "Brand" && option.className === "bg-brand"),
      true,
    );
    const radii = familyOptions(radius, design);
    assert.equal(
      radii.some((option) => option.label === "Card radius" && option.className === "rounded-card"),
      true,
    );
  });
});

describe("element library file", () => {
  it("rejects a design system file", () => {
    const result = validateElementLibrary(createDefaultDesignSystem());
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.message, DESIGN_SYSTEM_ON_ELEMENTS);
  });

  it("rejects a node that carries a ref", () => {
    const result = validateElementLibrary({
      schemaVersion: 1,
      kind: "elements",
      id: "lib",
      name: "Element library",
      updatedAt: "2026-10-01T00:00:00.000Z",
      designSystemId: "ds",
      items: [
        {
          id: "item",
          name: "Button",
          slug: "button",
          root: {
            id: "node",
            type: "link",
            tag: "a",
            classes: ["bg-brand"],
            text: "Go",
            children: [],
            ref: "x",
          },
        },
      ],
    });
    assert.equal(result.ok, false);
  });

  it("accepts a starter and formats its html on more than one line", () => {
    const button = STARTERS.find((starter) => starter.id === "button");
    assert.ok(button);
    const item = createElementFromStarter(button, []);
    const file = {
      schemaVersion: 1 as const,
      kind: "elements" as const,
      id: "lib",
      name: "Element library",
      updatedAt: "2026-10-01T00:00:00.000Z",
      designSystemId: "ds",
      items: [item],
    };
    const result = validateElementLibrary(file);
    assert.equal(result.ok, true);
    const html = formatElementHtml(item.root);
    assert.equal(html.includes("\n"), true);
    assert.equal(html.split("\n").length > 1, true);
    assert.match(html, /bg-brand/);
    assert.doesNotMatch(html, /#[0-9a-f]{3,8}/i);
  });
});
