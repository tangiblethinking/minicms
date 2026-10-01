import { DESIGN_SYSTEM_FILENAME } from "@/design/types";
import type { DesignSystemFile } from "@/design/types";

export function downloadDesignSystem(file: DesignSystemFile) {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = DESIGN_SYSTEM_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
