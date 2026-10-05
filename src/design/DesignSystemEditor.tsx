import { useEffect, useId, useRef, type ReactNode } from "react";
import { normalizeHex } from "@/design/defaults";
import { EMPTY_COLORS_MESSAGE } from "@/design/types";
import { useStudio } from "@/design/state";
import { buildSampleSrcDoc, sanitizeRadius } from "@/preview/srcdoc";
import { PreviewFrame } from "@/preview/PreviewFrame";

const fieldClass =
  "h-11 w-full rounded-sm border border-line bg-panel px-3 text-base text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink read-only:bg-paper";

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-line bg-panel px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="font-mono text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function selectedClass(active: boolean) {
  return active ? "bg-ink text-panel" : "bg-panel text-ink hover:bg-paper";
}

export function AddPane() {
  const studio = useStudio();
  const nameId = useId();
  return (
    <section aria-label="Add" className="flex flex-col gap-5 px-4 py-4">
      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted">Add</h2>
        <label className="mt-3 flex flex-col gap-1" htmlFor={nameId}>
          <span className="text-sm font-medium">Name</span>
          <input
            id={nameId}
            className={fieldClass}
            value={studio.file.name}
            onChange={(event) => studio.setName(event.target.value)}
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className={secondaryButton} onClick={studio.addColor} data-testid="add-color">
            Add color
          </button>
          <button type="button" className={secondaryButton} onClick={studio.addFont} data-testid="add-font">
            Add font
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium">Padding</h3>
        <p className="mt-1 text-xs text-muted">Vertical space between items. Mobile and desktop.</p>
        <ul className="mt-2 flex flex-col gap-2">
          {studio.file.spacing.padding.map((token) => (
            <li key={token.id} className="rounded-sm border border-line p-2">
              <span className="text-sm font-medium">{token.name}</span>
              <label className="mt-2 flex flex-col gap-1 text-sm">
                Mobile
                <input className={fieldClass} data-testid={`padding-${token.id}-mobile`} value={token.mobile} onChange={(event) => studio.updateSpacing("padding", token.id, { mobile: event.target.value })} />
              </label>
              <label className="mt-2 flex flex-col gap-1 text-sm">
                Desktop
                <input className={fieldClass} data-testid={`padding-${token.id}-desktop`} value={token.desktop} onChange={(event) => studio.updateSpacing("padding", token.id, { desktop: event.target.value })} />
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium">Gap</h3>
        <p className="mt-1 text-xs text-muted">Horizontal space inside an item.</p>
        <ul className="mt-2 flex flex-col gap-2">
          {studio.file.spacing.gap.map((token) => (
            <li key={token.id} className="rounded-sm border border-line p-2">
              <span className="text-sm font-medium">{token.name}</span>
              <label className="mt-2 flex flex-col gap-1 text-sm">
                Mobile
                <input className={fieldClass} value={token.mobile} onChange={(event) => studio.updateSpacing("gap", token.id, { mobile: event.target.value })} />
              </label>
              <label className="mt-2 flex flex-col gap-1 text-sm">
                Desktop
                <input className={fieldClass} value={token.desktop} onChange={(event) => studio.updateSpacing("gap", token.id, { desktop: event.target.value })} />
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-medium">Colors</h3>
        {studio.file.colors.length === 0 ? (
          <p className="mt-2 text-sm text-muted" data-testid="empty-colors">
            {EMPTY_COLORS_MESSAGE}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {studio.file.colors.map((color) => {
              const active = studio.selection?.kind === "color" && studio.selection.id === color.id;
              return (
                <li key={color.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    data-testid={`color-${color.id}`}
                    onClick={() => studio.select({ kind: "color", id: color.id })}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-sm border border-line px-3 py-2 text-left ${selectedClass(active)}`}
                  >
                    <span
                      className="size-6 shrink-0 rounded-sm border border-line"
                      style={{ backgroundColor: normalizeHex(color.value) ?? "transparent" }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{color.name || "Untitled"}</span>
                      <span className={`block font-mono text-xs ${active ? "text-panel" : "text-muted"}`}>{color.id}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium">Fonts</h3>
        {studio.file.fonts.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Add a font. The sample heading uses it by name.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {studio.file.fonts.map((font) => {
              const active = studio.selection?.kind === "font" && studio.selection.id === font.id;
              return (
                <li key={font.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    data-testid={`font-${font.id}`}
                    onClick={() => studio.select({ kind: "font", id: font.id })}
                    className={`flex min-h-11 w-full flex-col items-start justify-center rounded-sm border border-line px-3 py-2 text-left ${selectedClass(active)}`}
                  >
                    <span className="text-sm font-medium">{font.name || "Untitled"}</span>
                    <span className={`block max-w-full truncate font-mono text-xs ${active ? "text-panel" : "text-muted"}`}>
                      {font.stack}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium">Radius</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {studio.file.radius.map((token) => {
            const active = studio.selection?.kind === "radius" && studio.selection.id === token.id;
            return (
              <li key={token.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => studio.select({ kind: "radius", id: token.id })}
                  className={`flex min-h-11 w-full items-center justify-between rounded-sm border border-line px-3 py-2 text-left text-sm ${selectedClass(active)}`}
                >
                  <span className="font-medium">{token.id}</span>
                  <span className={`font-mono text-xs ${active ? "text-panel" : "text-muted"}`}>{token.value}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button type="button" className={`${secondaryButton} self-start`} onClick={studio.requestReset} data-testid="reset-data">
        Reset data
      </button>
    </section>
  );
}

export function CanvasPane() {
  const studio = useStudio();
  const srcDoc = buildSampleSrcDoc(studio.file, studio.headingFontId);
  const headingId = useId();
  return (
    <section aria-label="Sample" className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl tracking-tight">Sample</h2>
          <p className="text-sm text-muted">Edits show here before you save.</p>
        </div>
        <label className="flex w-full flex-col gap-1 sm:w-56" htmlFor={headingId}>
          <span className="text-sm font-medium">Heading font</span>
          <select
            id={headingId}
            data-testid="heading-font"
            className={fieldClass}
            value={studio.headingFontId}
            onChange={(event) => studio.setHeadingFontId(event.target.value)}
          >
            {studio.file.fonts.map((font) => (
              <option key={font.id} value={font.id}>
                {font.name}
              </option>
            ))}
          </select>
          {studio.headingFontId ? <span className="font-mono text-xs text-muted">font-{studio.headingFontId}</span> : null}
        </label>
      </div>
      {studio.file.colors.length === 0 ? (
        <p className="rounded-lg border border-line bg-panel p-6 text-base" data-testid="canvas-empty">
          {EMPTY_COLORS_MESSAGE}
        </p>
      ) : (
        <div className="min-h-[28rem] flex-1 overflow-hidden rounded-lg border border-line bg-panel p-3">
          <PreviewFrame srcDoc={srcDoc} />
        </div>
      )}
    </section>
  );
}

export function SelectionPane() {
  const studio = useStudio();
  const color =
    studio.selection?.kind === "color" ? studio.file.colors.find((item) => item.id === studio.selection?.id) : undefined;
  const font =
    studio.selection?.kind === "font" ? studio.file.fonts.find((item) => item.id === studio.selection?.id) : undefined;
  const radius =
    studio.selection?.kind === "radius" ? studio.file.radius.find((item) => item.id === studio.selection?.id) : undefined;
  const name = color?.name || font?.name || radius?.id || "";
  const kind = color ? "Color" : font ? "Font" : radius ? "Radius" : "";
  const hex = color ? normalizeHex(color.value) : null;

  return (
    <section aria-label="This selection" className="flex flex-col gap-4 px-4 py-4">
      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted">This selection</h2>
        {color || font || radius ? (
          <p className="mt-2 text-lg font-medium">
            {name || "Untitled"}
            <span className="mt-1 block text-sm font-normal text-muted">{kind}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink" data-testid="selection-empty">
            Nothing is selected. Click a color, font, or radius in Add.
          </p>
        )}
      </div>

      {color ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-medium">Color</legend>
          <Field label="Name">
            <input
              className={fieldClass}
              value={color.name}
              data-testid="color-name"
              onChange={(event) => studio.updateColor(color.id, { name: event.target.value })}
            />
          </Field>
          <Field label="Id" hint="Locked after create.">
            <input className={fieldClass} value={color.id} readOnly data-testid="color-id" />
          </Field>
          <Field label="Hex" hint={hex ? `text-${color.id}` : "Use a hex color like #1d4ed8."}>
            <input
              className={fieldClass}
              value={color.value}
              spellCheck={false}
              data-testid="color-hex"
              onChange={(event) => studio.updateColor(color.id, { value: event.target.value })}
            />
          </Field>
          <Field label="Color picker">
            <input
              type="color"
              className="h-11 w-16 rounded-sm border border-line bg-panel disabled:opacity-40"
              disabled={!hex}
              value={hex ?? "#000000"}
              onChange={(event) => studio.updateColor(color.id, { value: event.target.value })}
            />
          </Field>
        </fieldset>
      ) : null}

      {font ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-medium">Type</legend>
          <Field label="Name">
            <input
              className={fieldClass}
              value={font.name}
              data-testid="font-name"
              onChange={(event) => studio.updateFont(font.id, { name: event.target.value })}
            />
          </Field>
          <Field label="Id" hint="Locked after create.">
            <input className={fieldClass} value={font.id} readOnly />
          </Field>
          <Field label="Stack" hint={`font-${font.id}`}>
            <input
              className={fieldClass}
              value={font.stack}
              spellCheck={false}
              data-testid="font-stack"
              onChange={(event) => studio.updateFont(font.id, { stack: event.target.value })}
            />
          </Field>
        </fieldset>
      ) : null}

      {radius ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-medium">Surface</legend>
          <Field label="Id" hint="Locked after create.">
            <input className={fieldClass} value={radius.id} readOnly />
          </Field>
          <Field label="Value" hint={sanitizeRadius(radius.value) ? `rounded-${radius.id}` : "Use a size like 1rem."}>
            <input
              className={fieldClass}
              value={radius.value}
              spellCheck={false}
              onChange={(event) => studio.updateRadius(radius.id, { value: event.target.value })}
            />
          </Field>
        </fieldset>
      ) : null}
    </section>
  );
}

export function StudioDialog() {
  const studio = useStudio();
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const open = studio.dialog.type !== "none";
  const cancelDialog = studio.cancelDialog;

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelDialog();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, cancelDialog]);

  if (!open) return null;

  const selectedName =
    studio.selection?.kind === "color"
      ? studio.file.colors.find((color) => color.id === studio.selection?.id)?.name
      : studio.selection?.kind === "font"
        ? studio.file.fonts.find((font) => font.id === studio.selection?.id)?.name
        : studio.selection?.kind === "radius"
          ? studio.file.radius.find((token) => token.id === studio.selection?.id)?.id
          : "";

  const elementName = studio.openElement?.name ?? "";
  const componentName = studio.openComponent?.name ?? "this component";
  const placementName = studio.selectedComponentNode?.ref
    ? (studio.library.items.find((item) => item.id === studio.selectedComponentNode?.ref?.id)?.name ??
      "this placement")
    : "this group";
  const copy =
    studio.dialog.type === "import"
      ? "Replace the current design system?"
      : studio.dialog.type === "import-elements"
        ? studio.dialog.file.designSystemId !== studio.file.id
          ? "Replace the current element library? This element library was built with another design system."
          : "Replace the current element library?"
        : studio.dialog.type === "import-components"
          ? studio.dialog.file.designSystemId !== studio.file.id
            ? "Replace the current component library? This component library was built with another design system."
            : "Replace the current component library?"
          : studio.dialog.type === "reset"
            ? "Clear the saved design system and start over?"
            : studio.dialog.type === "delete-component"
              ? `Delete ${componentName}? This cannot be undone.`
              : studio.dialog.type === "delete-placement"
                ? `Delete ${placementName}? This cannot be undone.`
                : `Delete ${studio.dialog.type === "delete-element" ? elementName : selectedName || "this item"}? This cannot be undone.`;
  const confirmLabel =
    studio.dialog.type === "import" ||
    studio.dialog.type === "import-elements" ||
    studio.dialog.type === "import-components"
      ? "Replace"
      : studio.dialog.type === "reset"
        ? "Reset data"
        : "Delete";

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md rounded-lg border border-line bg-panel p-5">
        <h2 id={titleId} className="text-lg font-medium">
          {copy}
        </h2>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" className={secondaryButton} onClick={studio.cancelDialog}>
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-dialog"
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-ink px-4 text-sm font-medium text-panel"
            onClick={studio.confirmDialog}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudioToast() {
  const studio = useStudio();
  if (!studio.toast) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-20 left-4 z-40 flex justify-end sm:left-auto">
      <p
        role={studio.toast.tone === "error" ? "alert" : "status"}
        data-testid="toast"
        className={`studio-toast pointer-events-auto max-w-sm rounded-lg border border-line px-4 py-3 text-sm ${
          studio.toast.tone === "error" ? "bg-ink text-panel" : "bg-panel text-ink"
        }`}
      >
        {studio.toast.message}
      </p>
    </div>
  );
}
