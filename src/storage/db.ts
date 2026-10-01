import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { DesignSystemFile } from "@/design/types";
import type { ElementLibraryFile } from "@/elements/types";
import type { ComponentLibraryFile } from "@/component-library/types";

const DB_NAME = "compositional-canvas";
const STORE = "kv";

export const WORKING_KEY = "design-system";
export const SAVED_KEY = "design-system-saved";
export const ELEMENTS_WORKING_KEY = "elements";
export const ELEMENTS_SAVED_KEY = "elements-saved";
export const COMPONENTS_WORKING_KEY = "components";
export const COMPONENTS_SAVED_KEY = "components-saved";

type StoredFile = DesignSystemFile | ElementLibraryFile | ComponentLibraryFile;

interface StudioDB extends DBSchema {
  kv: {
    key: string;
    value: StoredFile;
  };
}

let database: Promise<IDBPDatabase<StudioDB>> | null = null;

function db() {
  if (!database) {
    database = openDB<StudioDB>(DB_NAME, 1, {
      upgrade(next) {
        if (!next.objectStoreNames.contains(STORE)) next.createObjectStore(STORE);
      },
    });
  }
  return database;
}

export async function getDocument<T>(key: string): Promise<T | undefined> {
  const value = await (await db()).get(STORE, key);
  return value as T | undefined;
}

export async function putDocument(key: string, value: StoredFile): Promise<void> {
  await (await db()).put(STORE, value, key);
}

export async function deleteDocument(key: string): Promise<void> {
  await (await db()).delete(STORE, key);
}
