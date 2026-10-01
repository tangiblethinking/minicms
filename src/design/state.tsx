import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createDefaultDesignSystem, signature, uniqueId } from "@/design/defaults";
import type { DesignSystemFile, Selection } from "@/design/types";
import { DESIGN_SYSTEM_FILENAME, WRONG_FILE_MESSAGE } from "@/design/types";
import { validateDesignSystem } from "@/design/validate";
import { createElementFromStarter, STARTERS } from "@/elements/starters";
import {
  createDefaultElementLibrary,
  librarySignature,
  missingImageMessage,
  touchLibrary,
} from "@/elements/library";
import type { ElementItem, ElementLibraryFile, Node } from "@/elements/types";
import { ELEMENTS_FILENAME, OTHER_DESIGN_SYSTEM_MESSAGE } from "@/elements/types";
import { validateElementLibrary } from "@/elements/validate";
import type { ShelfId } from "@/shell/shelves";
import {
  deleteDocument,
  ELEMENTS_SAVED_KEY,
  ELEMENTS_WORKING_KEY,
  getDocument,
  putDocument,
  SAVED_KEY,
  WORKING_KEY,
} from "@/storage/db";
import { downloadDesignSystem, downloadElementLibrary } from "@/storage/files";

type DialogState =
  | { type: "none" }
  | { type: "import"; file: DesignSystemFile }
  | { type: "import-elements"; file: ElementLibraryFile }
  | { type: "delete" }
  | { type: "delete-element" }
  | { type: "reset" };

type ToastState = { tone: "ok" | "error"; message: string } | null;

type StudioContextValue = {
  ready: boolean;
  shelf: ShelfId;
  file: DesignSystemFile;
  selection: Selection | null;
  headingFontId: string;
  canExport: boolean;
  unsaved: boolean;
  library: ElementLibraryFile;
  openElementId: string | null;
  openElement: ElementItem | null;
  elementCanExport: boolean;
  elementUnsaved: boolean;
  showTransparency: boolean;
  elementSelected: boolean;
  toast: ToastState;
  dialog: DialogState;
  setShelf: (shelf: ShelfId) => void;
  setName: (name: string) => void;
  select: (selection: Selection) => void;
  setHeadingFontId: (id: string) => void;
  addColor: () => void;
  addFont: () => void;
  updateColor: (id: string, patch: { name?: string; value?: string }) => void;
  updateFont: (id: string, patch: { name?: string; stack?: string }) => void;
  updateRadius: (id: string, patch: { value?: string }) => void;
  addElement: (starterId: string) => void;
  openElementById: (id: string) => void;
  renameOpenElement: (name: string) => void;
  setOpenClasses: (classes: string[]) => void;
  setOpenText: (text: string) => void;
  setOpenAttr: (key: string, value: string) => void;
  setShowTransparency: (value: boolean) => void;
  markElementSelected: () => void;
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
  const [shelf, setShelfState] = useState<ShelfId>("design-system");
  const [file, setFile] = useState<DesignSystemFile>(() => createDefaultDesignSystem());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [headingFontId, setHeadingFontIdState] = useState("display");
  const [savedSig, setSavedSig] = useState<string | null>(null);
  const [library, setLibrary] = useState<ElementLibraryFile>(() =>
    createDefaultElementLibrary("pending"),
  );
  const [openElementId, setOpenElementId] = useState<string | null>(null);
  const [savedLibrarySig, setSavedLibrarySig] = useState<string | null>(null);
  const [showTransparency, setShowTransparency] = useState(false);
  const [elementSelected, setElementSelected] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const fileRef = useRef(file);
  const libraryRef = useRef(library);
  const shelfRef = useRef(shelf);
  const openElementIdRef = useRef(openElementId);
  fileRef.current = file;
  libraryRef.current = library;
  shelfRef.current = shelf;
  openElementIdRef.current = openElementId;

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const working = await getDocument<DesignSystemFile>(WORKING_KEY);
        const saved = await getDocument<DesignSystemFile>(SAVED_KEY);
        const workingLib = await getDocument<ElementLibraryFile>(ELEMENTS_WORKING_KEY);
        const savedLib = await getDocument<ElementLibraryFile>(ELEMENTS_SAVED_KEY);
        if (cancel) return;
        const workingResult = working ? validateDesignSystem(working) : null;
        const savedResult = saved ? validateDesignSystem(saved) : null;
        const ds = workingResult?.ok ? workingResult.file : createDefaultDesignSystem();
        const workingLibResult = workingLib ? validateElementLibrary(workingLib) : null;
        const savedLibResult = savedLib ? validateElementLibrary(savedLib) : null;
        setFile(ds);
        if (savedResult?.ok) setSavedSig(signature(savedResult.file));
        setLibrary(
          workingLibResult?.ok ? workingLibResult.file : createDefaultElementLibrary(ds.id),
        );
        if (savedLibResult?.ok) setSavedLibrarySig(librarySignature(savedLibResult.file));
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
    if (!ready) return;
    const handle = window.setTimeout(() => {
      void putDocument(ELEMENTS_WORKING_KEY, libraryRef.current);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [library, ready]);

  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), toast.tone === "error" ? 6000 : 4000);
    return () => window.clearTimeout(handle);
  }, [toast]);

  useEffect(() => {
    if (file.fonts.some((font) => font.id === headingFontId)) return;
    setHeadingFontIdState(
      file.fonts.find((font) => font.id === "display")?.id ?? file.fonts[0]?.id ?? "",
    );
  }, [file.fonts, headingFontId]);

  useEffect(() => {
    if (openElementId && library.items.some((item) => item.id === openElementId)) return;
    if (openElementId) setOpenElementId(null);
  }, [library.items, openElementId]);

  const currentSig = signature(file);
  const canExport = savedSig !== null && savedSig === currentSig;
  const unsaved = savedSig !== currentSig;
  const currentLibrarySig = librarySignature(library);
  const elementCanExport = savedLibrarySig !== null && savedLibrarySig === currentLibrarySig;
  const elementUnsaved = savedLibrarySig !== currentLibrarySig;
  const openElement = library.items.find((item) => item.id === openElementId) ?? null;

  const edit = useCallback((next: DesignSystemFile) => {
    setFile(touch(next));
  }, []);

  const editLibrary = useCallback((next: ElementLibraryFile) => {
    setLibrary(touchLibrary(next));
  }, []);

  const setName = useCallback(
    (name: string) => {
      edit({ ...fileRef.current, name });
    },
    [edit],
  );

  const addColor = useCallback(() => {
    const current = fileRef.current;
    const id = uniqueId(
      "New color",
      current.colors.map((color) => color.id),
    );
    edit({
      ...current,
      colors: [...current.colors, { id, name: "New color", value: "#a8a29e" }],
    });
    setSelection({ kind: "color", id });
  }, [edit]);

  const addFont = useCallback(() => {
    const current = fileRef.current;
    const id = uniqueId(
      "New font",
      current.fonts.map((font) => font.id),
    );
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

  const replaceOpenRoot = useCallback(
    (root: Node) => {
      const id = openElementIdRef.current;
      if (!id) return;
      const current = libraryRef.current;
      editLibrary({
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, root } : item)),
      });
    },
    [editLibrary],
  );

  const addElement = useCallback(
    (starterId: string) => {
      const starter = STARTERS.find((item) => item.id === starterId);
      if (!starter) return;
      const current = libraryRef.current;
      const item = createElementFromStarter(starter, current.items);
      editLibrary({ ...current, items: [...current.items, item] });
      setOpenElementId(item.id);
      setElementSelected(true);
    },
    [editLibrary],
  );

  const openElementById = useCallback((id: string) => {
    if (!libraryRef.current.items.some((item) => item.id === id)) return;
    setOpenElementId(id);
    setElementSelected(true);
  }, []);

  const renameOpenElement = useCallback(
    (name: string) => {
      const id = openElementIdRef.current;
      if (!id) return;
      const current = libraryRef.current;
      editLibrary({
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, name } : item)),
      });
    },
    [editLibrary],
  );

  const setOpenClasses = useCallback(
    (classes: string[]) => {
      const item = libraryRef.current.items.find((entry) => entry.id === openElementIdRef.current);
      if (!item) return;
      replaceOpenRoot({ ...item.root, classes });
    },
    [replaceOpenRoot],
  );

  const setOpenText = useCallback(
    (text: string) => {
      const item = libraryRef.current.items.find((entry) => entry.id === openElementIdRef.current);
      if (!item) return;
      replaceOpenRoot({ ...item.root, text });
    },
    [replaceOpenRoot],
  );

  const setOpenAttr = useCallback(
    (key: string, value: string) => {
      const item = libraryRef.current.items.find((entry) => entry.id === openElementIdRef.current);
      if (!item) return;
      replaceOpenRoot({ ...item.root, attrs: { ...item.root.attrs, [key]: value } });
    },
    [replaceOpenRoot],
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

  const removeOpenElement = useCallback(() => {
    const id = openElementIdRef.current;
    if (!id) return;
    const current = libraryRef.current;
    editLibrary({ ...current, items: current.items.filter((item) => item.id !== id) });
    setOpenElementId(null);
    setElementSelected(false);
  }, [editLibrary]);

  const requestDelete = useCallback(() => {
    if (shelfRef.current === "elements") {
      if (!openElementIdRef.current) return;
      setDialog({ type: "delete-element" });
      return;
    }
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
      setToast({
        tone: "error",
        message:
          shelfRef.current === "elements"
            ? "This file is not an element library. Open it on its own shelf."
            : WRONG_FILE_MESSAGE,
      });
      return;
    }
    if (shelfRef.current === "elements") {
      const result = validateElementLibrary(parsed);
      if (!result.ok) {
        setToast({ tone: "error", message: result.message });
        return;
      }
      setDialog({ type: "import-elements", file: result.file });
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
    if (dialog.type === "delete-element") {
      removeOpenElement();
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
      setHeadingFontIdState(
        dialog.file.fonts.some((font) => font.id === "display")
          ? "display"
          : (dialog.file.fonts[0]?.id ?? ""),
      );
      setSavedSig(null);
      setDialog({ type: "none" });
      void deleteDocument(SAVED_KEY);
      void putDocument(WORKING_KEY, dialog.file);
      return;
    }
    if (dialog.type === "import-elements") {
      const mismatch = dialog.file.designSystemId !== fileRef.current.id;
      setLibrary(dialog.file);
      setOpenElementId(dialog.file.items[0]?.id ?? null);
      setElementSelected(dialog.file.items.length > 0);
      setSavedLibrarySig(null);
      setDialog({ type: "none" });
      void deleteDocument(ELEMENTS_SAVED_KEY);
      void putDocument(ELEMENTS_WORKING_KEY, dialog.file);
      if (mismatch) setToast({ tone: "error", message: OTHER_DESIGN_SYSTEM_MESSAGE });
    }
  }, [dialog, removeOpenElement, removeSelection]);

  const cancelDialog = useCallback(() => setDialog({ type: "none" }), []);

  const save = useCallback(() => {
    if (shelfRef.current === "elements") {
      const current = libraryRef.current;
      const problem = current.items.map((item) => missingImageMessage(item.root)).find(Boolean);
      if (problem) {
        setToast({ tone: "error", message: problem });
        return;
      }
      const next = touchLibrary({ ...current, designSystemId: fileRef.current.id });
      setLibrary(next);
      setSavedLibrarySig(librarySignature(next));
      void putDocument(ELEMENTS_WORKING_KEY, next);
      void putDocument(ELEMENTS_SAVED_KEY, next);
      setToast({ tone: "ok", message: `Saved ${ELEMENTS_FILENAME}` });
      return;
    }
    const next = touch(fileRef.current);
    setFile(next);
    setSavedSig(signature(next));
    void putDocument(WORKING_KEY, next);
    void putDocument(SAVED_KEY, next);
    setToast({ tone: "ok", message: `Saved ${DESIGN_SYSTEM_FILENAME}` });
  }, []);

  const exportFile = useCallback(() => {
    if (shelfRef.current === "elements") {
      void (async () => {
        const saved = await getDocument<ElementLibraryFile>(ELEMENTS_SAVED_KEY);
        const result = saved ? validateElementLibrary(saved) : null;
        if (!result?.ok || librarySignature(result.file) !== librarySignature(libraryRef.current)) {
          setToast({ tone: "error", message: "Save element first." });
          return;
        }
        downloadElementLibrary(result.file);
      })();
      return;
    }
    void (async () => {
      const saved = await getDocument<DesignSystemFile>(SAVED_KEY);
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
      shelf,
      file,
      selection,
      headingFontId,
      canExport,
      unsaved,
      library,
      openElementId,
      openElement,
      elementCanExport,
      elementUnsaved,
      showTransparency,
      elementSelected,
      toast,
      dialog,
      setShelf: setShelfState,
      setName,
      select: setSelection,
      setHeadingFontId: setHeadingFontIdState,
      addColor,
      addFont,
      updateColor,
      updateFont,
      updateRadius,
      addElement,
      openElementById,
      renameOpenElement,
      setOpenClasses,
      setOpenText,
      setOpenAttr,
      setShowTransparency,
      markElementSelected: () => setElementSelected(true),
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
      shelf,
      file,
      selection,
      headingFontId,
      canExport,
      unsaved,
      library,
      openElementId,
      openElement,
      elementCanExport,
      elementUnsaved,
      showTransparency,
      elementSelected,
      toast,
      dialog,
      setName,
      addColor,
      addFont,
      updateColor,
      updateFont,
      updateRadius,
      addElement,
      openElementById,
      renameOpenElement,
      setOpenClasses,
      setOpenText,
      setOpenAttr,
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
