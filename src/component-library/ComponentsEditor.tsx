import { useEffect, useId, useRef, type ReactNode } from "react";
import { applyFamily, ownedClasses, sameClassSet, type OwnsContext } from "@/catalog/apply";
import { familyOptions, readCatalog } from "@/catalog/options";
import { GROUP_LABEL, type CatalogFamily, type CatalogGroup } from "@/catalog/types";
import { formatResolvedHtml, librarySource, resolveNode } from "@/component-library/tree";
import {
  CANVAS_EMPTY_MESSAGE,
  COMPONENTS_EMPTY_SELECTION,
  EMPTY_COMPONENTS_MESSAGE,
  EMPTY_ELEMENTS_ON_COMPONENTS,
  groupLabel,
  isGroup,
} from "@/component-library/types";
import type { ComponentNode } from "@/component-library/types";
import { useStudio } from "@/design/state";
import { isTextual } from "@/elements/relevance";
import type { ElementItem, Node } from "@/elements/types";
import { buildComponentSrcDoc } from "@/preview/componentSrcDoc";
import { PreviewFrame } from "@/preview/PreviewFrame";

const fieldClass =
  "h-11 w-full rounded-sm border border-line bg-panel px-3 text-base text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-line bg-panel px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40";

const linkButton =
  "inline-flex min-h-11 items-center justify-start rounded-sm px-1 text-sm font-medium text-ink underline underline-offset-4 hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

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

export function ComponentsAddPane() {
  const studio = useStudio();
  const elements = studio.library.items;
  return (
    <section aria-label="Add" className="flex flex-col gap-5 px-4 py-4">
      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted">Add</h2>
        <button
          type="button"
          className={`${secondaryButton} mt-3 w-full justify-start`}
          data-testid="new-component"
          onClick={studio.createComponent}
        >
          New component
        </button>
        {elements.length === 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-muted" data-testid="empty-elements-on-components">
              {EMPTY_ELEMENTS_ON_COMPONENTS}
            </p>
            <button type="button" className={linkButton} data-testid="go-to-elements" onClick={studio.goToElements}>
              Go to Elements
            </button>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {elements.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${secondaryButton} w-full justify-start`}
                  data-testid={`add-element-${item.slug}`}
                  onClick={() => studio.addPlacement(item.id)}
                >
                  {item.name || "Untitled"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium">Components</h3>
        {studio.components.items.length === 0 ? (
          <p className="mt-2 text-sm text-muted" data-testid="empty-components">
            {EMPTY_COMPONENTS_MESSAGE}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {studio.components.items.map((item) => {
              const active = studio.openComponentId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    data-testid={`component-${item.slug}`}
                    onClick={() => studio.openComponentById(item.id)}
                    className={`flex min-h-11 w-full items-center rounded-sm border border-line px-3 py-2 text-left text-sm font-medium ${selectedClass(active)}`}
                  >
                    {item.name || "Untitled"}
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

function TreeRows({
  node,
  elements,
  selectedId,
  depth,
  onSelect,
}: {
  node: ComponentNode;
  elements: ElementItem[];
  selectedId: string | null;
  depth: number;
  onSelect: (id: string) => void;
}) {
  const element = node.ref ? elements.find((item) => item.id === node.ref?.id) : undefined;
  const label = node.ref ? element?.name || `Missing: ${node.ref.id} (element)` : groupLabel(node);
  const active = selectedId === node.id;
  return (
    <>
      <li>
        <button
          type="button"
          aria-pressed={active}
          data-testid={`tree-${node.id}`}
          onClick={() => onSelect(node.id)}
          className={`flex min-h-11 w-full items-center rounded-sm border border-line px-3 py-2 text-left text-sm ${selectedClass(active)}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {label}
        </button>
      </li>
      {node.children.map((child) => (
        <TreeRows
          key={child.id}
          node={child}
          elements={elements}
          selectedId={selectedId}
          depth={depth + 1}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export function ComponentsCanvasPane() {
  const studio = useStudio();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const open = studio.openComponent;
  const srcDoc = open
    ? buildComponentSrcDoc(studio.file, open.root, studio.library.items)
    : "";
  const selectNode = studio.selectComponentNode;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { source?: string; type?: string; id?: string } | null;
      if (!data || data.source !== "compositional-canvas" || data.type !== "select-node") return;
      if (data.id) selectNode(data.id);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [selectNode]);

  const compiled = open ? formatResolvedHtml(resolveNode(open.root, studio.library.items)) : "";

  return (
    <section aria-label="Component" className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div>
        <h2 className="font-display text-xl tracking-tight">Component</h2>
        <p className="text-sm text-muted">
          {open
            ? "Place saved elements. Click a row or the canvas to select it."
            : "Add a component to see it here."}
        </p>
      </div>
      {open ? (
        <>
          <ul className="flex flex-col gap-2" aria-label="Component structure">
            <TreeRows
              node={open.root}
              elements={studio.library.items}
              selectedId={studio.selectedComponentNodeId}
              depth={0}
              onSelect={studio.selectComponentNode}
            />
          </ul>
          <div className="min-h-[28rem] flex-1 overflow-hidden rounded-lg border border-line bg-panel p-3">
            <PreviewFrame
              frameRef={frameRef}
              srcDoc={srcDoc}
              title="Component preview"
              testId="component-frame"
            />
          </div>
          <details className="rounded-lg border border-line bg-panel" open data-testid="compiled-code">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Compiled code</summary>
            <pre
              data-testid="compiled-html"
              className="overflow-x-auto border-t border-line px-4 py-3 font-mono text-xs leading-relaxed text-ink"
            >
              {compiled}
            </pre>
          </details>
          <details className="rounded-lg border border-line bg-panel" data-testid="library-source">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Library source</summary>
            <pre
              data-testid="library-json"
              className="overflow-x-auto border-t border-line px-4 py-3 font-mono text-xs leading-relaxed text-ink"
            >
              {librarySource(open)}
            </pre>
          </details>
        </>
      ) : (
        <p className="rounded-lg border border-line bg-panel p-6 text-base" data-testid="canvas-empty">
          {CANVAS_EMPTY_MESSAGE}
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

export function ComponentsSelectionPane() {
  const studio = useStudio();
  const open = studio.openComponent;
  const selected = studio.selectedComponentNode;
  const element = selected?.ref
    ? studio.library.items.find((item) => item.id === selected.ref?.id)
    : undefined;
  const ctx: OwnsContext = { fontIds: studio.file.fonts.map((font) => font.id) };
  const groupNode: Node | null =
    selected && isGroup(selected)
      ? {
          id: selected.id,
          type: selected.type,
          tag: selected.tag,
          classes: selected.classes,
          children: [],
        }
      : null;
  const families = readCatalog().families.filter(
    (family) => family.group === "layout" || family.group === "spacing",
  );
  const grouped = new Map<CatalogGroup, CatalogFamily[]>();
  if (groupNode) {
    for (const family of families) {
      if (family.id === "direction" || family.id === "gap") {
        if (!groupNode.classes.some((className) => className === "flex" || className === "inline-flex" || className === "grid")) {
          continue;
        }
      }
      const list = grouped.get(family.group) ?? [];
      list.push(family);
      grouped.set(family.group, list);
    }
  }

  return (
    <section aria-label="This selection" className="flex flex-col gap-4 px-4 py-4">
      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted">This selection</h2>
        {open && selected ? (
          <p className="mt-2 text-lg font-medium" data-testid="selection-name">
            {selected.ref ? element?.name || `Missing: ${selected.ref.id} (element)` : groupLabel(selected)}
            <span className="mt-1 block text-sm font-normal text-muted" data-testid="selection-kind">
              {selected.ref ? "Element" : "Group"}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink" data-testid="selection-empty">
            {open ? "Nothing is selected. Click a placed element or group." : COMPONENTS_EMPTY_SELECTION}
          </p>
        )}
      </div>

      {open ? (
        <Field label="Name" hint="Slug stays locked.">
          <input
            className={fieldClass}
            data-testid="component-name"
            value={open.name}
            onChange={(event) => studio.renameOpenComponent(event.target.value)}
          />
        </Field>
      ) : null}

      {selected?.ref ? (
        <>
          {element && isTextual(element.root) ? (
            <Field label="Text" hint="Override. Does not change the element.">
              <input
                className={fieldClass}
                data-testid="override-text"
                value={selected.overrides?.text ?? element.root.text ?? ""}
                onChange={(event) => studio.setPlacementOverride("text", event.target.value)}
              />
            </Field>
          ) : null}
          {element?.root.type === "image" ? (
            <>
              <Field label="URL" hint="Override. Does not change the element.">
                <input
                  className={fieldClass}
                  data-testid="override-src"
                  spellCheck={false}
                  value={selected.overrides?.src ?? element.root.attrs?.src ?? ""}
                  onChange={(event) => studio.setPlacementOverride("src", event.target.value)}
                />
              </Field>
              <Field label="Alt" hint="Override. Does not change the element.">
                <input
                  className={fieldClass}
                  data-testid="override-alt"
                  value={selected.overrides?.alt ?? element.root.attrs?.alt ?? ""}
                  onChange={(event) => studio.setPlacementOverride("alt", event.target.value)}
                />
              </Field>
            </>
          ) : null}
          {element && (element.root.type === "link" || element.root.type === "button") ? (
            <Field label="Link" hint="Override. Does not change the element.">
              <input
                className={fieldClass}
                data-testid="override-href"
                spellCheck={false}
                value={selected.overrides?.href ?? element.root.attrs?.href ?? ""}
                onChange={(event) => studio.setPlacementOverride("href", event.target.value)}
              />
            </Field>
          ) : null}
          <button
            type="button"
            className={`${secondaryButton} w-full justify-start`}
            data-testid="edit-element-definition"
            disabled={!element}
            onClick={() => element && studio.editElementDefinition(element.id)}
          >
            Edit element definition
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={secondaryButton} data-testid="move-up" onClick={() => studio.movePlacement(-1)}>
              Move up
            </button>
            <button type="button" className={secondaryButton} data-testid="move-down" onClick={() => studio.movePlacement(1)}>
              Move down
            </button>
          </div>
        </>
      ) : null}

      {selected && groupNode
        ? (["layout", "spacing"] as const).map((group) => {
            const list = grouped.get(group);
            if (!list || list.length === 0) return null;
            return (
              <fieldset key={group} className="flex flex-col gap-4">
                <legend className="text-sm font-medium">{GROUP_LABEL[group]}</legend>
                {group === "layout" ? (
                  <Field label="Name">
                    <input
                      className={fieldClass}
                      data-testid="group-name"
                      value={groupLabel(selected)}
                      onChange={(event) => studio.renameGroup(event.target.value)}
                    />
                  </Field>
                ) : null}
                {list.map((family) => (
                  <ClassControl
                    key={family.id}
                    family={family}
                    node={groupNode}
                    ctx={ctx}
                    onClasses={(classes) => studio.setGroupClasses(classes)}
                  />
                ))}
              </fieldset>
            );
          })
        : null}

      {selected && !selected.ref ? (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={secondaryButton} data-testid="move-up" onClick={() => studio.movePlacement(-1)}>
            Move up
          </button>
          <button type="button" className={secondaryButton} data-testid="move-down" onClick={() => studio.movePlacement(1)}>
            Move down
          </button>
        </div>
      ) : null}
    </section>
  );
}
