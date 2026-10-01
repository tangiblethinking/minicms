import { useRef } from "react";
import { AddPane, CanvasPane, SelectionPane, StudioDialog, StudioToast } from "@/design/DesignSystemEditor";
import { useStudio, StudioProvider } from "@/design/state";
import { ShelfNav } from "@/shell/ShelfNav";

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
        <p className="text-base">Loading the design system.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink lg:h-dvh">
      <Header />
      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <div className="order-2 border-b border-line bg-panel lg:order-1 lg:w-72 lg:overflow-y-auto lg:border-r lg:border-b-0">
          <ShelfNav />
          <AddPane />
        </div>
        <div className="order-1 min-w-0 flex-1 bg-paper lg:order-2 lg:overflow-y-auto">
          <CanvasPane />
        </div>
        <div className="order-3 border-t border-line bg-panel lg:w-80 lg:overflow-y-auto lg:border-t-0 lg:border-l">
          <SelectionPane />
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

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-line bg-panel px-4 py-3 lg:flex-row lg:items-center">
      <div className="min-w-0">
        <h1 className="font-display text-xl tracking-tight">Compositional Canvas</h1>
        <p className="text-sm text-muted">Design system</p>
      </div>
      <div className="flex flex-col gap-2 lg:ml-auto lg:flex-row lg:items-center">
        <p className="text-sm text-muted" data-testid="save-state">
          {studio.unsaved ? "Save to enable export." : "Export uses the saved file."}
        </p>
        <button type="button" data-testid="save-design-system" onClick={studio.save} className={primaryButton}>
          Save design system
        </button>
        <button
          type="button"
          data-testid="export-design-system"
          className={secondaryButton}
          disabled={!studio.canExport}
          title={studio.canExport ? "Download design-system.tpsds.json" : "Save design system first."}
          onClick={studio.exportFile}
        >
          Export design system
        </button>
        <button
          type="button"
          className={secondaryButton}
          data-testid="import-design-system"
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
  const itemName = !studio.selection
    ? ""
    : studio.selection.kind === "color"
      ? (studio.file.colors.find((color) => color.id === studio.selection?.id)?.name ?? "Color")
      : studio.selection.kind === "font"
        ? (studio.file.fonts.find((font) => font.id === studio.selection?.id)?.name ?? "Font")
        : (studio.file.radius.find((token) => token.id === studio.selection?.id)?.id ?? "Radius");

  return (
    <footer className="flex shrink-0 flex-col gap-3 border-t border-line bg-panel px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm" data-testid="where">
        Where you are: Design system{itemName ? ` / ${itemName}` : ""}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className={secondaryButton} disabled title="Available in a later phase">
          Group
        </button>
        <button type="button" className={secondaryButton} disabled title="Available in a later phase">
          Ungroup
        </button>
        <button
          type="button"
          className={secondaryButton}
          data-testid="delete-selection"
          disabled={!studio.selection}
          onClick={studio.requestDelete}
        >
          Delete
        </button>
      </div>
    </footer>
  );
}
