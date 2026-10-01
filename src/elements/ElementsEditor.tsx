import { useEffect, useId, useRef, type ReactNode } from "react";
import { applyFamily, ownedClasses, sameClassSet, type OwnsContext } from "@/catalog/apply";
import { familyOptions, readCatalog } from "@/catalog/options";
import { GROUP_LABEL, GROUP_ORDER, type CatalogFamily, type CatalogGroup } from "@/catalog/types";
import { useStudio } from "@/design/state";
import { formatElementHtml } from "@/elements/html";
import { familyApplies, isTextual } from "@/elements/relevance";
import { STARTERS } from "@/elements/starters";
import { ELEMENTS_EMPTY_SELECTION, EMPTY_ELEMENTS_MESSAGE, kindLabel } from "@/elements/types";
import type { Node } from "@/elements/types";
import { buildElementSrcDoc } from "@/preview/elementSrcDoc";
import { PreviewFrame } from "@/preview/PreviewFrame";

const fieldClass =
  "h-11 w-full rounded-sm border border-line bg-panel px-3 text-base text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-line bg-panel px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function selectedClass(active: boolean) {
  return active ? "bg-ink text-panel" : "bg-panel text-ink hover:bg-paper";
}

function Field({
  label,
  hint,
  hintTestId,
  children,
}: {
  label: string;
  hint?: string;
  hintTestId?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? (
        <span className="font-mono text-xs text-muted" data-testid={hintTestId}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function ElementsAddPane() {
  const studio = useStudio();
  return (
    <section aria-label="Add" className="flex flex-col gap-5 px-4 py-4">
      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted">Add</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {STARTERS.map((starter) => (
            <li key={starter.id}>
              <button
                type="button"
                className={`${secondaryButton} w-full justify-start`}
                data-testid={`add-${starter.id}`}
                onClick={() => studio.addElement(starter.id)}
              >
                {starter.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium">Elements</h3>
        {studio.library.items.length === 0 ? (
          <p className="mt-2 text-sm text-muted" data-testid="empty-elements">
            {EMPTY_ELEMENTS_MESSAGE}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {studio.library.items.map((item) => {
              const active = studio.openElementId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    data-testid={`library-${item.slug}`}
                    onClick={() => studio.openElementById(item.id)}
                    className={`flex min-h-11 w-full flex-col items-start justify-center rounded-sm border border-line px-3 py-2 text-left ${selectedClass(active)}`}
                  >
                    <span className="text-sm font-medium">{item.name || "Untitled"}</span>
                    <span className={`font-mono text-xs ${active ? "text-panel" : "text-muted"}`}>
                      {kindLabel(item.root.type)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export function ElementsCanvasPane() {
  const studio = useStudio();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const open = studio.openElement;
  const srcDoc =
    open === null ? "" : buildElementSrcDoc(studio.file, open.root, studio.showTransparency);
  const markSelected = studio.markElementSelected;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { source?: string; type?: string } | null;
      if (!data || data.source !== "compositional-canvas" || data.type !== "select-node") return;
      markSelected();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [markSelected]);

  return (
    <section aria-label="Element" className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl tracking-tight">Element</h2>
          <p className="text-sm text-muted">
            {open ? "This element only. Click it to select it." : "Add an element to see it here."}
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 accent-ink"
            data-testid="show-transparency"
            checked={studio.showTransparency}
            onChange={(event) => studio.setShowTransparency(event.target.checked)}
          />
          Show transparency
        </label>
      </div>
      {open ? (
        <>
          <div
            className={`min-h-[28rem] flex-1 overflow-hidden rounded-lg border border-line p-3 ${
              studio.showTransparency ? "checkerboard" : "bg-panel"
            }`}
          >
            <PreviewFrame
              frameRef={frameRef}
              srcDoc={srcDoc}
              title="Element preview"
              testId="element-frame"
              transparent={studio.showTransparency}
            />
          </div>
          <details className="rounded-lg border border-line bg-panel" data-testid="code-disclosure">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Code</summary>
            <pre
              data-testid="element-code"
              className="overflow-x-auto border-t border-line px-4 py-3 font-mono text-xs leading-relaxed text-ink"
            >
              {formatElementHtml(open.root)}
            </pre>
          </details>
        </>
      ) : (
        <p
          className="rounded-lg border border-line bg-panel p-6 text-base"
          data-testid="canvas-empty"
        >
          Nothing is open. Add an element, or choose one from the list.
        </p>
      )}
    </section>
  );
}

function ClassControl({
  family,
  node,
  ctx,
  onClasses,
}: {
  family: CatalogFamily;
  node: Node;
  ctx: OwnsContext;
  onClasses: (classes: string[]) => void;
}) {
  const studio = useStudio();
  const options = familyOptions(family, studio.file);
  const current = ownedClasses(node.classes, family.id, ctx);
  const match = options.find((option) => sameClassSet(option.className, current));
  const value = match ? match.className : current.length > 0 ? "__current__" : "";
  const hint = current.length > 0 ? current.join(" ") : "Not set";
  const selectId = useId();
  return (
    <Field label={family.label} hint={hint} hintTestId={`class-${family.id}`}>
      <select
        id={selectId}
        className={fieldClass}
        data-testid={`control-${family.id}`}
        value={value}
        onChange={(event) => {
          if (event.target.value === "__current__") return;
          onClasses(applyFamily(node.classes, family.id, event.target.value, ctx));
        }}
      >
        {current.length > 0 && !match ? (
          <option value="__current__">Current ({current.join(" ")})</option>
        ) : null}
        {options.map((option) => (
          <option key={`${option.label}:${option.className}`} value={option.className}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function groupFamilies(node: Node): Map<CatalogGroup, CatalogFamily[]> {
  const grouped = new Map<CatalogGroup, CatalogFamily[]>();
  for (const family of readCatalog().families) {
    if (!familyApplies(family, node)) continue;
    const list = grouped.get(family.group) ?? [];
    list.push(family);
    grouped.set(family.group, list);
  }
  return grouped;
}

export function ElementsSelectionPane() {
  const studio = useStudio();
  const open = studio.openElement;
  const families = open ? groupFamilies(open.root) : null;
  const ctx: OwnsContext = { fontIds: studio.file.fonts.map((font) => font.id) };

  return (
    <section aria-label="This selection" className="flex flex-col gap-4 px-4 py-4">
      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted">This selection</h2>
        {open ? (
          <p className="mt-2 text-lg font-medium" data-testid="selection-name">
            {open.name || "Untitled"}
            <span
              className="mt-1 block text-sm font-normal text-muted"
              data-testid="selection-kind"
            >
              {kindLabel(open.root.type)}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink" data-testid="selection-empty">
            {ELEMENTS_EMPTY_SELECTION}
          </p>
        )}
      </div>

      {open ? (
        <Field label="Name" hint="Slug stays locked.">
          <input
            className={fieldClass}
            data-testid="element-name"
            value={open.name}
            onChange={(event) => studio.renameOpenElement(event.target.value)}
          />
        </Field>
      ) : null}

      {open && families
        ? GROUP_ORDER.map((group) => {
            const list = families.get(group);
            const showText = group === "type" && isTextual(open.root);
            const showImage = group === "image" && open.root.type === "image";
            if ((!list || list.length === 0) && !showText && !showImage) return null;
            return (
              <fieldset key={group} className="flex flex-col gap-4">
                <legend className="text-sm font-medium">{GROUP_LABEL[group]}</legend>
                {showImage ? (
                  <>
                    <Field label="URL">
                      <input
                        className={fieldClass}
                        data-testid="image-src"
                        spellCheck={false}
                        value={open.root.attrs?.src ?? ""}
                        onChange={(event) => studio.setOpenAttr("src", event.target.value)}
                      />
                    </Field>
                    <Field label="Alt">
                      <input
                        className={fieldClass}
                        data-testid="image-alt"
                        value={open.root.attrs?.alt ?? ""}
                        onChange={(event) => studio.setOpenAttr("alt", event.target.value)}
                      />
                    </Field>
                  </>
                ) : null}
                {list?.map((family) => (
                  <ClassControl
                    key={family.id}
                    family={family}
                    node={open.root}
                    ctx={ctx}
                    onClasses={(classes) => studio.setOpenClasses(classes)}
                  />
                ))}
                {showText ? (
                  <Field label="Text">
                    <input
                      className={fieldClass}
                      data-testid="element-text"
                      value={open.root.text ?? ""}
                      onChange={(event) => studio.setOpenText(event.target.value)}
                    />
                  </Field>
                ) : null}
              </fieldset>
            );
          })
        : null}
    </section>
  );
}
