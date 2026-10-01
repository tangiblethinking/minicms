Phase: 1
Date: 2026-10-01
Commit: f696a7e0d5c937f5648a6b937a648f2a311fc785

UI five answers:
- Where am I? The header reads Compositional Canvas and Elements. The footer reads Where you are: Elements / Button when that element is open.
- What can I add? The left column is titled Add and lists Frame, Image, Heading, Body, Price, Strike price, Button, and Pill. Saved elements are listed under Elements.
- What is selected? This selection names the element and its kind (Button, then Link, because the starter is an anchor). With nothing open it says to add an element or choose one from the list.
- Where do I change it? This selection. Groups appear only when they apply, in order: Layout, Spacing, Type, Color, Surface, Image, State. Each control has a label. The class that will be written sits under it (bg-brand). Colors and fonts use design-system names (Brand, Sans). Card radius writes rounded-card.
- How do I save? The only filled button is Save element. The toast reads Saved elements.tpsel.json. Export element library stays off until that save, then downloads that file.

Exit steps 1–7: pass in headless Chromium (Playwright), 2026-10-01
1. pass — Add Button. This selection and the name Button are shown. Footer is Elements / Button.
2. pass — Background set to Brand. Class line is bg-brand. Canvas background is rgb(154, 52, 18), the seed Brand swatch.
3. pass — Text set to View details. Code shows that label.
4. pass — Image, Heading, Price, Strike price, and Frame added. Six items in the list.
5. pass — Save toast is Saved elements.tpsel.json. Export downloads elements.tpsel.json. After reload the names are still there. Import asks Replace the current element library? Names, View details, and bg-brand match.
6. pass — Brand set to #1d4ed8 on Design system. Button canvas becomes rgb(29, 78, 216) without editing the button. Class line stays bg-brand.
7. pass for the five answers above in the running UI. A designer should still click through once before Phase 2; this pass is the implementer session, not a substitute for that look.

Button classes include bg-brand and not a hex: yes
Design-system change repaints button: yes
Import reject of design-system file: yes — This file is a design system. Open it on Design system. No replace dialog. The open library stays.
Other design system id: warns This element library was built with another design system and still opens.
Console errors: none
Regressions in Phase 0 exit test: Brand hex still repaints the design-system sample heading (rgb(29, 78, 216)) before save. Shelves Components through Pages stay disabled with Available in a later phase.

Notes:
- Writer replaces only the active family. px-4 py-2 stays until Padding is changed. line-through, absolute, left-3, and top-3 are not owned by a family and are not deleted.
- Image starter shows URL and Alt. Default src is https://picsum.photos/id/1011/800/1000. Default alt is Photo so Save is not blocked; clearing either one blocks save with one sentence and the next action.
- Code is a closed disclosure. Opened, the button is formatted on multiple lines, not one line.
- Opening an element does not create a component. schemaVersion stays 1.
- Human click-through in the phase file is still the gate for Phase 2.
