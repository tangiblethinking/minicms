import { useRef } from "react";
import {
  AddPane,
  CanvasPane,
  SelectionPane,
  StudioDialog,
  StudioToast,
} from "@/design/DesignSystemEditor";
import { StudioProvider, useStudio } from "@/design/state";
import {
  ElementsAddPane,
  ElementsCanvasPane,
  ElementsSelectionPane,
} from "@/elements/ElementsEditor";
import { ShelfNav } from "@/shell/ShelfNav";
import { shelfLabel } from "@/shell/shelves";

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-line bg-panel px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-sm bg-ink px-4 text-sm font-medium text-panel transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function Shell() {
  return (
    <StudioProvider>
      <StudioFrame />
    </StudioProvider>
  );
}

function StudioFrame() {
  const studio = useStudio();
  if (!studio.ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper px-6 text-ink">
        <p className="text-base">Loading the studio.</p>
      </div>
    );
  }

  const onElements = studio.shelf === "elements";

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink lg:h-dvh">
      <Header />
      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <div className="order-2 border-b border-line bg-panel lg:order-1 lg:w-72 lg:overflow-y-auto lg:border-r lg:border-b-0">
          <ShelfNav active={studio.shelf} onSelect={studio.setShelf} />
          {onElements ? <ElementsAddPane /> : <AddPane />}
        </div>
        <div className="order-1 min-w-0 flex-1 bg-paper lg:order-2 lg:overflow-y-auto">
          {onElements ? <ElementsCanvasPane /> : <CanvasPane />}
        </div>
        <div className="order-3 border-t border-line bg-panel lg:w-80 lg:overflow-y-auto lg:border-t-0 lg:border-l">
          {onElements ? <ElementsSelectionPane /> : <SelectionPane />}
        </div>
      </div>
      <Footer />
      <StudioDialog />
      <StudioToast />
    </div>
  );
}

function Header() {
  const studio = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);
  const onElements = studio.shelf === "elements";
  const unsaved = onElements ? studio.elementUnsaved : studio.unsaved;
  const canExport = onElements ? studio.elementCanExport : studio.canExport;
  const saveLabel = onElements ? "Save element" : "Save design system";
  const exportLabel = onElements ? "Export element library" : "Export design system";

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-line bg-panel px-4 py-3 lg:flex-row lg:items-center">
      <div className="min-w-0">
        <h1 className="font-display text-xl tracking-tight">Compositional Canvas</h1>
        <p className="text-sm text-muted" data-testid="shelf-label">
          {shelfLabel(studio.shelf)}
        </p>
      </div>
      <div className="flex flex-col gap-2 lg:ml-auto lg:flex-row lg:items-center">
        <p className="text-sm text-muted" data-testid="save-state">
          {unsaved ? "Save to enable export." : "Export uses the saved file."}
        </p>
        <button
          type="button"
          data-testid={onElements ? "save-element" : "save-design-system"}
          onClick={studio.save}
          className={primaryButton}
        >
          {saveLabel}
        </button>
        <button
          type="button"
          data-testid={onElements ? "export-element-library" : "export-design-system"}
          className={secondaryButton}
          disabled={!canExport}
          title={
            canExport
              ? `Download ${onElements ? "elements.tpsel.json" : "design-system.tpsds.json"}`
              : `${saveLabel} first.`
          }
          onClick={studio.exportFile}
        >
          {exportLabel}
        </button>
        <button
          type="button"
          className={secondaryButton}
          data-testid={onElements ? "import-elements" : "import-design-system"}
          onClick={() => fileRef.current?.click()}
        >
          Import
        </button>
        <input
          ref={fileRef}
          data-testid="import-file"
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            void file.text().then((text) => studio.chooseImport(text));
          }}
        />
      </div>
    </header>
  );
}

function Footer() {
  const studio = useStudio();
  const onElements = studio.shelf === "elements";
  const itemName = onElements
    ? (studio.openElement?.name ?? "")
    : !studio.selection
      ? ""
      : studio.selection.kind === "color"
        ? (studio.file.colors.find((color) => color.id === studio.selection?.id)?.name ?? "Color")
        : studio.selection.kind === "font"
          ? (studio.file.fonts.find((font) => font.id === studio.selection?.id)?.name ?? "Font")
          : (studio.file.radius.find((token) => token.id === studio.selection?.id)?.id ?? "Radius");

  return (
    <footer className="flex shrink-0 flex-col gap-3 border-t border-line bg-panel px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm" data-testid="where">
        Where you are: {shelfLabel(studio.shelf)}
        {itemName ? ` / ${itemName}` : ""}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className={secondaryButton}
          disabled
          title="Available in a later phase"
        >
          Group
        </button>
        <button
          type="button"
          className={secondaryButton}
          disabled
          title="Available in a later phase"
        >
          Ungroup
        </button>
        <button
          type="button"
          className={secondaryButton}
          data-testid="delete-selection"
          disabled={onElements ? !studio.openElement : !studio.selection}
          onClick={studio.requestDelete}
        >
          Delete
        </button>
      </div>
    </footer>
  );
}
