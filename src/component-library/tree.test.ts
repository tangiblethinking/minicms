import assert from "node:assert/strict";
import test from "node:test";
import { createElementFromStarter, STARTERS } from "../elements/starters.ts";
import { createComponent, placementNode } from "./library.ts";
import { formatResolvedHtml, resolveNode } from "./tree.ts";
import { groupSelection, insertPlacement } from "./tree.ts";
import { validateComponentLibrary } from "./validate.ts";
import type { ElementItem } from "../elements/types.ts";

function element(id: string): ElementItem {
  const starter = STARTERS.find((item) => item.id === id);
  if (!starter) throw new Error(id);
  return createElementFromStarter(starter, []);
}

test("product card stores refs and compiles overrides without copying classes", () => {
  const frame = element("frame");
  const image = element("image");
  const heading = element("heading");
  const price = element("price");
  const strike = element("strike-price");
  const button = element("button");
  const card = createComponent([], [frame]);
  assert.equal(card.root.ref?.id, frame.id);
  assert.deepEqual(card.root.classes, []);

  const imageNode = placementNode(image);
  imageNode.overrides = { src: "https://picsum.photos/id/1011/800/1000" };
  const headingNode = placementNode(heading);
  headingNode.overrides = { text: "Desert Stone Tee" };
  const priceNode = placementNode(price);
  priceNode.overrides = { text: "$48" };
  const strikeNode = placementNode(strike);
  strikeNode.overrides = { text: "$64" };
  let root = insertPlacement(card.root, card.root.id, imageNode);
  root = insertPlacement(root, card.root.id, headingNode);
  root = insertPlacement(root, card.root.id, priceNode);
  root = insertPlacement(root, card.root.id, strikeNode);
  root = groupSelection(root, priceNode.id);
  const row = root.children.find((child) => !child.ref);
  assert.ok(row);
  root = insertPlacement(root, card.root.id, placementNode(button));
  const buttonNode = root.children.find((child) => child.ref?.id === button.id);
  assert.ok(buttonNode);
  buttonNode.overrides = { text: "View details", href: "#" };

  const stored = JSON.stringify(root);
  assert.equal(stored.includes("bg-brand"), false);
  assert.equal(stored.includes("Desert Stone Tee"), true);

  const elements = [frame, image, heading, price, strike, button];
  const compiled = formatResolvedHtml(resolveNode(root, elements));
  assert.match(compiled, /Desert Stone Tee/);
  assert.match(compiled, /\$48/);
  assert.match(compiled, /\$64/);
  assert.match(compiled, /View details/);
  assert.match(compiled, /bg-brand/);
  assert.match(compiled, /flex flex-row items-baseline gap-2/);

  button.root.classes = button.root.classes.map((item) =>
    item === "rounded-card" ? "rounded-none" : item,
  );
  const updated = formatResolvedHtml(resolveNode(root, elements));
  assert.match(updated, /rounded-none/);
  assert.equal(JSON.stringify(root).includes("rounded-none"), false);
  assert.equal(heading.root.text, "Heading");
});

test("missing element renders a labeled block and element files are rejected", () => {
  const frame = element("frame");
  const card = createComponent([], [frame]);
  card.root.ref = { kind: "element", id: "gone" };
  const compiled = formatResolvedHtml(resolveNode(card.root, []));
  assert.match(compiled, /Missing: gone \(element\)/);

  const elementFile = {
    schemaVersion: 1,
    kind: "elements",
    id: "el",
    name: "Element library",
    updatedAt: "2026-10-01T00:00:00.000Z",
    designSystemId: "ds",
    items: [],
  };
  const rejected = validateComponentLibrary(elementFile);
  assert.equal(rejected.ok, false);
  if (!rejected.ok) assert.match(rejected.message, /Open it on Elements/);
});
