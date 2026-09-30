/* Tiny promise wrapper over IndexedDB. The database name and store names are permanent:
 * changing them would orphan the data already on a phone.
 */
const DB_NAME = "fitly";
const DB_VERSION = 1;

export const STORE = { entries: "entries", customFoods: "customFoods", kv: "kv" } as const;
type StoreName = (typeof STORE)[keyof typeof STORE];

let opening: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is not available"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(STORE.entries, { keyPath: "id" }).createIndex("date", "date");
      db.createObjectStore(STORE.customFoods, { keyPath: "id" });
      db.createObjectStore(STORE.kv);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return opening;
}

function wrap<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await open();
  return wrap<T[]>(db.transaction(store).objectStore(store).getAll());
}

export async function getValue<T>(key: string): Promise<T | undefined> {
  const db = await open();
  return wrap<T | undefined>(db.transaction(STORE.kv).objectStore(STORE.kv).get(key));
}

export async function setValue(key: string, value: unknown): Promise<void> {
  const db = await open();
  const tx = db.transaction(STORE.kv, "readwrite");
  tx.objectStore(STORE.kv).put(value, key);
  await done(tx);
}

export async function putRecord(store: typeof STORE.entries | typeof STORE.customFoods, value: unknown): Promise<void> {
  const db = await open();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(value);
  await done(tx);
}

export async function deleteRecord(store: typeof STORE.entries | typeof STORE.customFoods, id: string): Promise<void> {
  const db = await open();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).delete(id);
  await done(tx);
}

/** Removes everything, then writes the given records, in one transaction. */
export async function replaceEverything(data: { entries: unknown[]; customFoods: unknown[]; kv: Record<string, unknown> }): Promise<void> {
  const db = await open();
  const tx = db.transaction([STORE.entries, STORE.customFoods, STORE.kv], "readwrite");
  const entries = tx.objectStore(STORE.entries);
  const foods = tx.objectStore(STORE.customFoods);
  const kv = tx.objectStore(STORE.kv);
  entries.clear();
  foods.clear();
  kv.clear();
  data.entries.forEach((e) => entries.put(e));
  data.customFoods.forEach((f) => foods.put(f));
  Object.entries(data.kv).forEach(([k, v]) => kv.put(v, k));
  await done(tx);
}
