import type { DesignSystemFile } from "@/design/types";
import { ALIGN_OPTIONS, TAG_OPTIONS, type Properties } from "@/props/model";

const fieldClass =
  "h-11 w-full rounded-sm border border-line bg-panel px-3 text-base text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function PropertyFields({
  file,
  props,
  onChange,
  testPrefix,
}: {
  file: DesignSystemFile;
  props: Properties;
  onChange: (patch: Partial<Properties>) => void;
  testPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Tag</span>
        <select
          className={fieldClass}
          data-testid={`${testPrefix}-tag`}
          value={props.tag ?? "div"}
          onChange={(event) => onChange({ tag: event.target.value })}
        >
          {TAG_OPTIONS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <span className="font-mono text-xs text-muted">{props.tag}</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Text</span>
        <input
          className={fieldClass}
          data-testid={`${testPrefix}-text`}
          value={props.text ?? ""}
          onChange={(event) => onChange({ text: event.target.value })}
        />
        <span className="text-xs text-muted">Canvas text uses this same value.</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Size</span>
        <select
          className={fieldClass}
          data-testid={`${testPrefix}-size`}
          value={props.sizeId ?? ""}
          onChange={(event) => onChange({ sizeId: event.target.value })}
        >
          <option value="">Not set</option>
          {file.typeScale.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <span className="font-mono text-xs text-muted">{props.sizeId || "Not set"}</span>
      </label>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Layout</legend>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Width</span>
          <select
            className={fieldClass}
            data-testid={`${testPrefix}-width-mode`}
            value={props.widthMode ?? "hug"}
            onChange={(event) => onChange({ widthMode: event.target.value as Properties["widthMode"] })}
          >
            <option value="hug">Hug</option>
            <option value="fill">Fill</option>
            <option value="fixed">Fixed</option>
          </select>
          <span className="font-mono text-xs text-muted">{props.widthMode ?? "hug"}</span>
        </label>
        {props.widthMode === "fixed" ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Width value</span>
            <input
              className={fieldClass}
              data-testid={`${testPrefix}-width`}
              value={props.width ?? ""}
              onChange={(event) => onChange({ width: event.target.value })}
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Height</span>
          <select
            className={fieldClass}
            data-testid={`${testPrefix}-height-mode`}
            value={props.heightMode ?? "hug"}
            onChange={(event) => onChange({ heightMode: event.target.value as Properties["heightMode"] })}
          >
            <option value="hug">Hug</option>
            <option value="fill">Fill</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        {props.heightMode === "fixed" ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Height value</span>
            <input
              className={fieldClass}
              data-testid={`${testPrefix}-height`}
              value={props.height ?? ""}
              onChange={(event) => onChange({ height: event.target.value })}
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Align</span>
          <select
            className={fieldClass}
            data-testid={`${testPrefix}-align`}
            value={props.align ?? "left"}
            onChange={(event) => onChange({ align: event.target.value as Properties["align"] })}
          >
            {ALIGN_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Spacing</legend>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Padding</span>
          <select
            className={fieldClass}
            data-testid={`${testPrefix}-padding`}
            value={props.paddingId ?? ""}
            onChange={(event) => onChange({ paddingId: event.target.value })}
          >
            <option value="">Not set</option>
            {file.spacing.padding.map((token) => (
              <option key={token.id} value={token.id}>
                {token.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">Vertical space between items.</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Gap</span>
          <select
            className={fieldClass}
            data-testid={`${testPrefix}-gap`}
            value={props.gapId ?? ""}
            onChange={(event) => onChange({ gapId: event.target.value })}
          >
            <option value="">Not set</option>
            {file.spacing.gap.map((token) => (
              <option key={token.id} value={token.id}>
                {token.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">Horizontal space inside this item.</span>
        </label>
      </fieldset>
    </div>
  );
}
