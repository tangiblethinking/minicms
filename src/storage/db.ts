import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { DesignSystemFile } from "@/design/types";

const DB_NAME = "compositional-canvas";
const STORE = "kv";

export const WORKING_KEY = "design-system";
export const SAVED_KEY = "design-system-saved";

interface StudioDB extends DBSchema {
  kv: {
    key: string;
    value: DesignSystemFile;
  };
}

let database: Promise<IDBPDatabase<StudioDB>> | null = null;

function db() {
  if (!database) {
    database = openDB<StudioDB>(DB_NAME, 1, {
      upgrade(next) {
        next.createObjectStore(STORE);
      },
    });
  }
  return database;
}

export async function getDocument(key: string): Promise<DesignSystemFile | undefined> {
  return (await db()).get(STORE, key);
}

export async function putDocument(key: string, value: DesignSystemFile): Promise<void> {
  await (await db()).put(STORE, value, key);
}

export async function deleteDocument(key: string): Promise<void> {
  await (await db()).delete(STORE, key);
}
