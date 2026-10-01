import { DESIGN_SYSTEM_FILENAME } from "@/design/types";
import type { DesignSystemFile } from "@/design/types";
import { COMPONENTS_FILENAME } from "@/component-library/types";
import type { ComponentLibraryFile } from "@/component-library/types";
import { ELEMENTS_FILENAME } from "@/elements/types";
import type { ElementLibraryFile } from "@/elements/types";

export function downloadJson(filename: string, file: unknown) {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadDesignSystem(file: DesignSystemFile) {
  downloadJson(DESIGN_SYSTEM_FILENAME, file);
}

export function downloadElementLibrary(file: ElementLibraryFile) {
  downloadJson(ELEMENTS_FILENAME, file);
}

export function downloadComponentLibrary(file: ComponentLibraryFile) {
  downloadJson(COMPONENTS_FILENAME, file);
}
