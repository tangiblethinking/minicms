# QA Phase 2 — Component library

Phase: 2
Commit: 6e2e9ec2dedf151323d88fe98b05731fd3126ea7
UI five answers:
- Where am I? Shelf label is Components. Footer reads Where you are: Components / Product card / Price row / Price when that path is selected.
- What can I add? Add lists saved elements only. Empty element library says Save a button on Elements first and offers Go to Elements. There is no raw div control.
- What is selected? This selection names the element or the group, and the kind Element or Group.
- Where do I change it? A placement shows text, URL, alt, or link overrides, plus Edit element definition. A group shows Layout and Spacing only. The class line sits under the control.
- How do I save? The only filled button is Save component. The toast reads Saved components.tpscmp.json. Export component library stays off until that save, then downloads that file.

Fixture built from refs only: yes — unit test builds the product card from Frame, Image, Heading, Price, Strike price, and Button placements. Stored JSON has refs and overrides. It does not copy bg-brand onto the component.
Element edit updates card: yes — resolver reads the live element definition. Changing Button radius to rounded-none changes compiled HTML without rewriting the component JSON.
Override does not rewrite element library: yes — Heading override Desert Stone Tee leaves the element default text as Heading.
Import reject of element file on this shelf: yes — kind elements returns This file is an element library. Open it on Elements.
Phase 0 and 1 exit tests still pass: not re-run in a browser this session. Phase 0 and 1 shelves, schemas, and schemaVersion 1 were not redesigned. Human click-through is still the gate.
Console errors: none expected from the unit path. Browser console was not captured in this session.

Notes:
- Components shelf is enabled. Sections, Features, and Pages stay disabled with Available in a later phase.
- New component uses a saved Frame element as the root placement when one exists, so the card surface stays an element. Classes stay on the element, not the ref.
- Group wraps the selected placement and the next sibling when one exists, with flex flex-row items-baseline gap-2. Gap is edited on that row.
- Move up and Move down reorder siblings.
- Compiled code is the open disclosure. Library source is the closed JSON disclosure.
- Missing element id renders Missing: <id> (element).
- schemaVersion stays 1. No detach, no free canvas, no AI API.
