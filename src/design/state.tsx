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
import {
  componentLibrarySignature,
  createComponent,
  createDefaultComponentLibrary,
  placementNode,
  touchComponentLibrary,
} from "@/component-library/library";
import {
  findNode,
  groupSelection,
  insertPlacement,
  insertTargetId,
  moveSibling,
  removeNode,
  trailLabels,
  ungroupSelection,
  updateNode,
} from "@/component-library/tree";
import type { ComponentItem, ComponentLibraryFile, ComponentNode } from "@/component-library/types";
import { COMPONENTS_FILENAME, OTHER_DESIGN_SYSTEM_MESSAGE as OTHER_COMPONENT_DESIGN_SYSTEM } from "@/component-library/types";
import { validateComponentLibrary } from "@/component-library/validate";
import type { ShelfId } from "@/shell/shelves";
import {
  COMPONENTS_SAVED_KEY,
  COMPONENTS_WORKING_KEY,
  deleteDocument,
  ELEMENTS_SAVED_KEY,
  ELEMENTS_WORKING_KEY,
  getDocument,
  putDocument,
  SAVED_KEY,
  WORKING_KEY,
} from "@/storage/db";
import { downloadComponentLibrary, downloadDesignSystem, downloadElementLibrary } from "@/storage/files";

type DialogState =
  | { type: "none" }
  | { type: "import"; file: DesignSystemFile }
  | { type: "import-elements"; file: ElementLibraryFile }
  | { type: "import-components"; file: ComponentLibraryFile }
  | { type: "delete" }
  | { type: "delete-element" }
  | { type: "delete-component" }
  | { type: "delete-placement" }
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
  components: ComponentLibraryFile;
  openComponentId: string | null;
  openComponent: ComponentItem | null;
  selectedComponentNodeId: string | null;
  selectedComponentNode: ComponentNode | null;
  componentCanExport: boolean;
  componentUnsaved: boolean;
  componentTrail: string[];
  canGroup: boolean;
  canUngroup: boolean;
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
  createComponent: () => void;
  openComponentById: (id: string) => void;
  renameOpenComponent: (name: string) => void;
  addPlacement: (elementId: string) => void;
  selectComponentNode: (id: string) => void;
  setPlacementOverride: (key: "text" | "src" | "alt" | "href", value: string) => void;
  setGroupClasses: (classes: string[]) => void;
  renameGroup: (name: string) => void;
  movePlacement: (direction: -1 | 1) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  editElementDefinition: (elementId: string) => void;
  goToElements: () => void;
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
  const [components, setComponents] = useState<ComponentLibraryFile>(() =>
    createDefaultComponentLibrary("pending"),
  );
  const [openComponentId, setOpenComponentId] = useState<string | null>(null);
  const [selectedComponentNodeId, setSelectedComponentNodeId] = useState<string | null>(null);
  const [savedComponentSig, setSavedComponentSig] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const fileRef = useRef(file);
  const libraryRef = useRef(library);
  const componentsRef = useRef(components);
  const shelfRef = useRef(shelf);
  const openElementIdRef = useRef(openElementId);
  const openComponentIdRef = useRef(openComponentId);
  const selectedComponentNodeIdRef = useRef(selectedComponentNodeId);
  fileRef.current = file;
  libraryRef.current = library;
  componentsRef.current = components;
  shelfRef.current = shelf;
  openElementIdRef.current = openElementId;
  openComponentIdRef.current = openComponentId;
  selectedComponentNodeIdRef.current = selectedComponentNodeId;

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const working = await getDocument<DesignSystemFile>(WORKING_KEY);
        const saved = await getDocument<DesignSystemFile>(SAVED_KEY);
        const workingLib = await getDocument<ElementLibraryFile>(ELEMENTS_WORKING_KEY);
        const savedLib = await getDocument<ElementLibraryFile>(ELEMENTS_SAVED_KEY);
        const workingComponents = await getDocument<ComponentLibraryFile>(COMPONENTS_WORKING_KEY);
        const savedComponents = await getDocument<ComponentLibraryFile>(COMPONENTS_SAVED_KEY);
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
        const workingComponentsResult = workingComponents
          ? validateComponentLibrary(workingComponents)
          : null;
        const savedComponentsResult = savedComponents
          ? validateComponentLibrary(savedComponents)
          : null;
        setComponents(
          workingComponentsResult?.ok
            ? workingComponentsResult.file
            : createDefaultComponentLibrary(ds.id),
        );
        if (savedComponentsResult?.ok) {
          setSavedComponentSig(componentLibrarySignature(savedComponentsResult.file));
        }
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
    if (!ready) return;
    const handle = window.setTimeout(() => {
      void putDocument(COMPONENTS_WORKING_KEY, componentsRef.current);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [components, ready]);

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

  useEffect(() => {
    if (openComponentId && components.items.some((item) => item.id === openComponentId)) return;
    if (openComponentId) {
      setOpenComponentId(null);
      setSelectedComponentNodeId(null);
    }
  }, [components.items, openComponentId]);

  const currentSig = signature(file);
  const canExport = savedSig !== null && savedSig === currentSig;
  const unsaved = savedSig !== currentSig;
  const currentLibrarySig = librarySignature(library);
  const elementCanExport = savedLibrarySig !== null && savedLibrarySig === currentLibrarySig;
  const elementUnsaved = savedLibrarySig !== currentLibrarySig;
  const openElement = library.items.find((item) => item.id === openElementId) ?? null;
  const currentComponentSig = componentLibrarySignature(components);
  const componentCanExport = savedComponentSig !== null && savedComponentSig === currentComponentSig;
  const componentUnsaved = savedComponentSig !== currentComponentSig;
  const openComponent = components.items.find((item) => item.id === openComponentId) ?? null;
  const selectedComponentNode =
    openComponent && selectedComponentNodeId
      ? findNode(openComponent.root, selectedComponentNodeId)
      : openComponent?.root ?? null;
  const componentTrail = openComponent
    ? trailLabels(
        openComponent.name,
        openComponent.root,
        selectedComponentNode?.id ?? null,
        library.items,
      )
    : [];
  const canGroup = Boolean(
    openComponent && selectedComponentNode && selectedComponentNode.id !== openComponent.root.id,
  );
  const canUngroup = Boolean(
    openComponent &&
      selectedComponentNode &&
      !selectedComponentNode.ref &&
      selectedComponentNode.id !== openComponent.root.id,
  );

  const edit = useCallback((next: DesignSystemFile) => {
    setFile(touch(next));
  }, []);

  const editLibrary = useCallback((next: ElementLibraryFile) => {
    setLibrary(touchLibrary(next));
  }, []);

  const editComponents = useCallback((next: ComponentLibraryFile) => {
    setComponents(touchComponentLibrary(next));
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

  const replaceOpenComponent = useCallback(
    (root: ComponentNode) => {
      const id = openComponentIdRef.current;
      if (!id) return;
      const current = componentsRef.current;
      editComponents({
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, root } : item)),
      });
    },
    [editComponents],
  );

  const createComponentItem = useCallback(() => {
    const current = componentsRef.current;
    const item = createComponent(current.items, libraryRef.current.items);
    editComponents({ ...current, items: [...current.items, item] });
    setOpenComponentId(item.id);
    setSelectedComponentNodeId(item.root.id);
  }, [editComponents]);

  const openComponentById = useCallback((id: string) => {
    const item = componentsRef.current.items.find((entry) => entry.id === id);
    if (!item) return;
    setOpenComponentId(id);
    setSelectedComponentNodeId(item.root.id);
  }, []);

  const renameOpenComponent = useCallback(
    (name: string) => {
      const id = openComponentIdRef.current;
      if (!id) return;
      const current = componentsRef.current;
      editComponents({
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, name } : item)),
      });
    },
    [editComponents],
  );

  const addPlacement = useCallback(
    (elementId: string) => {
      const element = libraryRef.current.items.find((item) => item.id === elementId);
      const openId = openComponentIdRef.current;
      if (!element || !openId) return;
      const current = componentsRef.current.items.find((item) => item.id === openId);
      if (!current) return;
      const parentId = insertTargetId(current.root, selectedComponentNodeIdRef.current);
      const next = insertPlacement(current.root, parentId, placementNode(element));
      replaceOpenComponent(next);
    },
    [replaceOpenComponent],
  );

  const selectComponentNode = useCallback((id: string) => {
    setSelectedComponentNodeId(id);
  }, []);

  const setPlacementOverride = useCallback(
    (key: "text" | "src" | "alt" | "href", value: string) => {
      const openId = openComponentIdRef.current;
      const nodeId = selectedComponentNodeIdRef.current;
      if (!openId || !nodeId) return;
      const current = componentsRef.current.items.find((item) => item.id === openId);
      if (!current) return;
      replaceOpenComponent(
        updateNode(current.root, nodeId, (node) => ({
          ...node,
          overrides: { ...node.overrides, [key]: value },
        })),
      );
    },
    [replaceOpenComponent],
  );

  const setGroupClasses = useCallback(
    (classes: string[]) => {
      const openId = openComponentIdRef.current;
      const nodeId = selectedComponentNodeIdRef.current;
      if (!openId || !nodeId) return;
      const current = componentsRef.current.items.find((item) => item.id === openId);
      if (!current) return;
      replaceOpenComponent(updateNode(current.root, nodeId, (node) => ({ ...node, classes })));
    },
    [replaceOpenComponent],
  );

  const renameGroup = useCallback(
    (name: string) => {
      const openId = openComponentIdRef.current;
      const nodeId = selectedComponentNodeIdRef.current;
      if (!openId || !nodeId) return;
      const current = componentsRef.current.items.find((item) => item.id === openId);
      if (!current) return;
      replaceOpenComponent(
        updateNode(current.root, nodeId, (node) => ({
          ...node,
          attrs: { ...node.attrs, "data-name": name },
        })),
      );
    },
    [replaceOpenComponent],
  );

  const movePlacement = useCallback(
    (direction: -1 | 1) => {
      const openId = openComponentIdRef.current;
      const nodeId = selectedComponentNodeIdRef.current;
      if (!openId || !nodeId) return;
      const current = componentsRef.current.items.find((item) => item.id === openId);
      if (!current) return;
      replaceOpenComponent(moveSibling(current.root, nodeId, direction));
    },
    [replaceOpenComponent],
  );

  const groupSelected = useCallback(() => {
    const openId = openComponentIdRef.current;
    const nodeId = selectedComponentNodeIdRef.current;
    if (!openId || !nodeId) return;
    const current = componentsRef.current.items.find((item) => item.id === openId);
    if (!current || nodeId === current.root.id) return;
    const next = groupSelection(current.root, nodeId);
    const parent = findNode(next, nodeId);
    replaceOpenComponent(next);
    const created = next.children.find((child) => child.children.some((entry) => entry.id === nodeId));
    const walk = (node: ComponentNode): ComponentNode | null => {
      if (node.children.some((child) => child.id === nodeId) && node.id !== current.root.id) return node;
      for (const child of node.children) {
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };
    const group = walk(next);
    if (group) setSelectedComponentNodeId(group.id);
    else if (parent) setSelectedComponentNodeId(nodeId);
  }, [replaceOpenComponent]);

  const ungroupSelected = useCallback(() => {
    const openId = openComponentIdRef.current;
    const nodeId = selectedComponentNodeIdRef.current;
    if (!openId || !nodeId) return;
    const current = componentsRef.current.items.find((item) => item.id === openId);
    if (!current) return;
    const node = findNode(current.root, nodeId);
    replaceOpenComponent(ungroupSelection(current.root, nodeId));
    setSelectedComponentNodeId(node?.children[0]?.id ?? current.root.id);
  }, [replaceOpenComponent]);

  const removeOpenComponent = useCallback(() => {
    const id = openComponentIdRef.current;
    if (!id) return;
    editComponents({
      ...componentsRef.current,
      items: componentsRef.current.items.filter((item) => item.id !== id),
    });
    setOpenComponentId(null);
    setSelectedComponentNodeId(null);
  }, [editComponents]);

  const removeSelectedPlacement = useCallback(() => {
    const openId = openComponentIdRef.current;
    const nodeId = selectedComponentNodeIdRef.current;
    if (!openId || !nodeId) return;
    const current = componentsRef.current.items.find((item) => item.id === openId);
    if (!current) return;
    if (nodeId === current.root.id) {
      removeOpenComponent();
      return;
    }
    const next = removeNode(current.root, nodeId);
    if (!next) {
      removeOpenComponent();
      return;
    }
    replaceOpenComponent(next);
    setSelectedComponentNodeId(current.root.id);
  }, [removeOpenComponent, replaceOpenComponent]);

  const editElementDefinition = useCallback((elementId: string) => {
    if (!libraryRef.current.items.some((item) => item.id === elementId)) return;
    setShelfState("elements");
    setOpenElementId(elementId);
    setElementSelected(true);
  }, []);

  const goToElements = useCallback(() => {
    setShelfState("elements");
  }, []);

  const requestDelete = useCallback(() => {
    if (shelfRef.current === "components") {
      if (!openComponentIdRef.current) return;
      if (
        selectedComponentNodeIdRef.current &&
        selectedComponentNodeIdRef.current !==
          componentsRef.current.items.find((item) => item.id === openComponentIdRef.current)?.root.id
      ) {
        setDialog({ type: "delete-placement" });
        return;
      }
      setDialog({ type: "delete-component" });
      return;
    }
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
          shelfRef.current === "components"
            ? "This file is not a component library. Open it on its own shelf."
            : shelfRef.current === "elements"
              ? "This file is not an element library. Open it on its own shelf."
              : WRONG_FILE_MESSAGE,
      });
      return;
    }
    if (shelfRef.current === "components") {
      const result = validateComponentLibrary(parsed);
      if (!result.ok) {
        setToast({ tone: "error", message: result.message });
        return;
      }
      setDialog({ type: "import-components", file: result.file });
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
    if (dialog.type === "delete-component" || dialog.type === "delete-placement") {
      removeSelectedPlacement();
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
      return;
    }
    if (dialog.type === "import-components") {
      const mismatch = dialog.file.designSystemId !== fileRef.current.id;
      setComponents(dialog.file);
      setOpenComponentId(dialog.file.items[0]?.id ?? null);
      setSelectedComponentNodeId(dialog.file.items[0]?.root.id ?? null);
      setSavedComponentSig(null);
      setDialog({ type: "none" });
      void deleteDocument(COMPONENTS_SAVED_KEY);
      void putDocument(COMPONENTS_WORKING_KEY, dialog.file);
      if (mismatch) setToast({ tone: "error", message: OTHER_COMPONENT_DESIGN_SYSTEM });
    }
  }, [dialog, removeOpenElement, removeSelectedPlacement, removeSelection]);

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
    if (shelfRef.current === "components") {
      const next = touchComponentLibrary({
        ...componentsRef.current,
        designSystemId: fileRef.current.id,
      });
      setComponents(next);
      setSavedComponentSig(componentLibrarySignature(next));
      void putDocument(COMPONENTS_WORKING_KEY, next);
      void putDocument(COMPONENTS_SAVED_KEY, next);
      setToast({ tone: "ok", message: `Saved ${COMPONENTS_FILENAME}` });
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
    if (shelfRef.current === "components") {
      void (async () => {
        const saved = await getDocument<ComponentLibraryFile>(COMPONENTS_SAVED_KEY);
        const result = saved ? validateComponentLibrary(saved) : null;
        if (
          !result?.ok ||
          componentLibrarySignature(result.file) !== componentLibrarySignature(componentsRef.current)
        ) {
          setToast({ tone: "error", message: "Save component first." });
          return;
        }
        downloadComponentLibrary(result.file);
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
      components,
      openComponentId,
      openComponent,
      selectedComponentNodeId,
      selectedComponentNode,
      componentCanExport,
      componentUnsaved,
      componentTrail,
      canGroup,
      canUngroup,
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
      createComponent: createComponentItem,
      openComponentById,
      renameOpenComponent,
      addPlacement,
      selectComponentNode,
      setPlacementOverride,
      setGroupClasses,
      renameGroup,
      movePlacement,
      groupSelected,
      ungroupSelected,
      editElementDefinition,
      goToElements,
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
      components,
      openComponentId,
      openComponent,
      selectedComponentNodeId,
      selectedComponentNode,
      componentCanExport,
      componentUnsaved,
      componentTrail,
      canGroup,
      canUngroup,
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
      createComponentItem,
      openComponentById,
      renameOpenComponent,
      addPlacement,
      selectComponentNode,
      setPlacementOverride,
      setGroupClasses,
      renameGroup,
      movePlacement,
      groupSelected,
      ungroupSelected,
      editElementDefinition,
      goToElements,
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
