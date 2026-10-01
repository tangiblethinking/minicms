import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createDefaultDesignSystem, signature, uniqueId } from "@/design/defaults";
import type { DesignSystemFile, Selection } from "@/design/types";
import { DESIGN_SYSTEM_FILENAME, WRONG_FILE_MESSAGE } from "@/design/types";
import { validateDesignSystem } from "@/design/validate";
import { deleteDocument, getDocument, putDocument, SAVED_KEY, WORKING_KEY } from "@/storage/db";
import { downloadDesignSystem } from "@/storage/files";

type DialogState =
  | { type: "none" }
  | { type: "import"; file: DesignSystemFile }
  | { type: "delete" }
  | { type: "reset" };

type ToastState = { tone: "ok" | "error"; message: string } | null;

type StudioContextValue = {
  ready: boolean;
  file: DesignSystemFile;
  selection: Selection | null;
  headingFontId: string;
  canExport: boolean;
  unsaved: boolean;
  toast: ToastState;
  dialog: DialogState;
  setName: (name: string) => void;
  select: (selection: Selection) => void;
  setHeadingFontId: (id: string) => void;
  addColor: () => void;
  addFont: () => void;
  updateColor: (id: string, patch: { name?: string; value?: string }) => void;
  updateFont: (id: string, patch: { name?: string; stack?: string }) => void;
  updateRadius: (id: string, patch: { value?: string }) => void;
  requestDelete: () => void;
  requestReset: () => void;
  chooseImport: (text: string) => void;
  confirmDialog: () => void;
  cancelDialog: () => void;
  save: () => void;
  exportFile: () => void;
  dismissToast: () => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

function touch(file: DesignSystemFile): DesignSystemFile {
  return { ...file, updatedAt: new Date().toISOString() };
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [file, setFile] = useState<DesignSystemFile>(() => createDefaultDesignSystem());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [headingFontId, setHeadingFontIdState] = useState("display");
  const [savedSig, setSavedSig] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const fileRef = useRef(file);
  fileRef.current = file;

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const working = await getDocument(WORKING_KEY);
        const saved = await getDocument(SAVED_KEY);
        if (cancel) return;
        const workingResult = working ? validateDesignSystem(working) : null;
        const savedResult = saved ? validateDesignSystem(saved) : null;
        if (workingResult?.ok) setFile(workingResult.file);
        if (savedResult?.ok) setSavedSig(signature(savedResult.file));
      } finally {
        if (!cancel) setReady(true);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const handle = window.setTimeout(() => {
      void putDocument(WORKING_KEY, fileRef.current);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [file, ready]);

  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), toast.tone === "error" ? 6000 : 4000);
    return () => window.clearTimeout(handle);
  }, [toast]);

  useEffect(() => {
    if (file.fonts.some((font) => font.id === headingFontId)) return;
    setHeadingFontIdState(file.fonts.find((font) => font.id === "display")?.id ?? file.fonts[0]?.id ?? "");
  }, [file.fonts, headingFontId]);

  const currentSig = signature(file);
  const canExport = savedSig !== null && savedSig === currentSig;
  const unsaved = savedSig !== currentSig;

  const edit = useCallback((next: DesignSystemFile) => {
    setFile(touch(next));
  }, []);

  const setName = useCallback(
    (name: string) => {
      edit({ ...fileRef.current, name });
    },
    [edit],
  );

  const addColor = useCallback(() => {
    const current = fileRef.current;
    const id = uniqueId("New color", current.colors.map((color) => color.id));
    edit({
      ...current,
      colors: [...current.colors, { id, name: "New color", value: "#a8a29e" }],
    });
    setSelection({ kind: "color", id });
  }, [edit]);

  const addFont = useCallback(() => {
    const current = fileRef.current;
    const id = uniqueId("New font", current.fonts.map((font) => font.id));
    edit({
      ...current,
      fonts: [
        ...current.fonts,
        { id, name: "New font", stack: "ui-sans-serif, system-ui, sans-serif" },
      ],
    });
    setSelection({ kind: "font", id });
  }, [edit]);

  const updateColor = useCallback(
    (id: string, patch: { name?: string; value?: string }) => {
      const current = fileRef.current;
      edit({
        ...current,
        colors: current.colors.map((color) => (color.id === id ? { ...color, ...patch } : color)),
      });
    },
    [edit],
  );

  const updateFont = useCallback(
    (id: string, patch: { name?: string; stack?: string }) => {
      const current = fileRef.current;
      edit({
        ...current,
        fonts: current.fonts.map((font) => (font.id === id ? { ...font, ...patch } : font)),
      });
    },
    [edit],
  );

  const updateRadius = useCallback(
    (id: string, patch: { value?: string }) => {
      const current = fileRef.current;
      edit({
        ...current,
        radius: current.radius.map((token) => (token.id === id ? { ...token, ...patch } : token)),
      });
    },
    [edit],
  );

  const removeSelection = useCallback(() => {
    const current = fileRef.current;
    if (!selection) return;
    if (selection.kind === "color") {
      edit({ ...current, colors: current.colors.filter((color) => color.id !== selection.id) });
    } else if (selection.kind === "font") {
      edit({ ...current, fonts: current.fonts.filter((font) => font.id !== selection.id) });
    } else {
      edit({ ...current, radius: current.radius.filter((token) => token.id !== selection.id) });
    }
    setSelection(null);
  }, [edit, selection]);

  const requestDelete = useCallback(() => {
    if (!selection) return;
    setDialog({ type: "delete" });
  }, [selection]);

  const requestReset = useCallback(() => {
    setDialog({ type: "reset" });
  }, []);

  const chooseImport = useCallback((text: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setToast({ tone: "error", message: WRONG_FILE_MESSAGE });
      return;
    }
    const result = validateDesignSystem(parsed);
    if (!result.ok) {
      setToast({ tone: "error", message: result.message });
      return;
    }
    setDialog({ type: "import", file: result.file });
  }, []);

  const confirmDialog = useCallback(() => {
    if (dialog.type === "delete") {
      removeSelection();
      setDialog({ type: "none" });
      return;
    }
    if (dialog.type === "reset") {
      const next = createDefaultDesignSystem();
      setFile(next);
      setSelection(null);
      setHeadingFontIdState("display");
      setSavedSig(null);
      setDialog({ type: "none" });
      void deleteDocument(SAVED_KEY);
      void putDocument(WORKING_KEY, next);
      return;
    }
    if (dialog.type === "import") {
      setFile(dialog.file);
      setSelection(null);
      setHeadingFontIdState(dialog.file.fonts.some((font) => font.id === "display") ? "display" : (dialog.file.fonts[0]?.id ?? ""));
      setSavedSig(null);
      setDialog({ type: "none" });
      void deleteDocument(SAVED_KEY);
      void putDocument(WORKING_KEY, dialog.file);
    }
  }, [dialog, removeSelection]);

  const cancelDialog = useCallback(() => setDialog({ type: "none" }), []);

  const save = useCallback(() => {
    const next = touch(fileRef.current);
    setFile(next);
    setSavedSig(signature(next));
    void putDocument(WORKING_KEY, next);
    void putDocument(SAVED_KEY, next);
    setToast({ tone: "ok", message: `Saved ${DESIGN_SYSTEM_FILENAME}` });
  }, []);

  const exportFile = useCallback(() => {
    void (async () => {
      const saved = await getDocument(SAVED_KEY);
      const result = saved ? validateDesignSystem(saved) : null;
      if (!result?.ok || signature(result.file) !== signature(fileRef.current)) {
        setToast({ tone: "error", message: "Save design system first." });
        return;
      }
      downloadDesignSystem(result.file);
    })();
  }, []);

  const value = useMemo<StudioContextValue>(
    () => ({
      ready,
      file,
      selection,
      headingFontId,
      canExport,
      unsaved,
      toast,
      dialog,
      setName,
      select: setSelection,
      setHeadingFontId: setHeadingFontIdState,
      addColor,
      addFont,
      updateColor,
      updateFont,
      updateRadius,
      requestDelete,
      requestReset,
      chooseImport,
      confirmDialog,
      cancelDialog,
      save,
      exportFile,
      dismissToast: () => setToast(null),
    }),
    [
      ready,
      file,
      selection,
      headingFontId,
      canExport,
      unsaved,
      toast,
      dialog,
      setName,
      addColor,
      addFont,
      updateColor,
      updateFont,
      updateRadius,
      requestDelete,
      requestReset,
      chooseImport,
      confirmDialog,
      cancelDialog,
      save,
      exportFile,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const value = useContext(StudioContext);
  if (!value) throw new Error("Studio is unavailable.");
  return value;
}
