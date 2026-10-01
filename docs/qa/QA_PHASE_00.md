Phase: 0
Date: 2026-10-01
Repo commit: none (workspace has no git repository)

UI answers (must be obvious):
- Where am I? The header reads Compositional Canvas and Design system. The footer reads Where you are: Design system, and adds the selected name (for example Design system / Brand).
- What can I add? The left column is titled Add, with Add color and Add font. Colors, fonts, and radius are listed under those buttons.
- What is selected? This selection names the item and its kind (Color, Font, or Radius). With nothing selected it says to click a color, font, or radius in Add.
- Where do I change it? This selection, in the group that applies: Color (Name, Id, Hex, Color picker), Type (Name, Id, Stack), or Surface (Id, Value). The Tailwind class sits under the control (text-brand, font-display, rounded-card).
- How do I save? The only filled button is Save design system. The toast reads Saved design-system.tpsds.json. Export stays off until that save, then downloads that file.

Exit test: pass/fail per step 1–7
1. pass — All six shelves render. Only Design system is enabled. Elements, Components, Sections, Features, and Pages are disabled and labeled Available in a later phase.
2. pass — Brand set to #1d4ed8. Sample heading computed color became rgb(29, 78, 216) before save.
3. pass — Display stack set to "Georgia", serif. Heading font switched to Sans (ui-sans-serif) and back to Display (Georgia, serif).
4. pass — Toast text was Saved design-system.tpsds.json.
5. pass — After reload, Brand hex was #1d4ed8 and the Display stack was still "Georgia", serif.
6. pass — Export downloaded design-system.tpsds.json. Reset data restored Brand to #9a3412. Import asked Replace the current design system? After replace, Brand was #1d4ed8 and the sample heading was rgb(29, 78, 216) again.
7. pass — A random JSON file showed This file is not a design system. Open it on its own shelf. No replace dialog. Brand stayed #1d4ed8.

Console errors: none
Schema reject tested: yes
Known gaps: none allowed except disabled shelves

Notes:
- Working copy autosaves to IndexedDB key design-system after 300ms. Explicit Save writes design-system-saved and is what Export downloads.
- Sample preview is a sandboxed iframe (allow-scripts only) using @tailwindcss/browser@4 and an @theme block. No @import inside that style tag.
- Checked in src/catalog/tailwind-catalog.json with tailwindVersion 4.3 and families [].
