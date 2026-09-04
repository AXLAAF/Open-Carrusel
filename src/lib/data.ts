import { readFile, writeFile, rename, mkdir, rm } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { Mutex } from "async-mutex";

const DATA_DIR = path.resolve(process.cwd(), "data");
const mutexes = new Map<string, Mutex>();

export class DataFileCorruptError extends Error {
  constructor(filename: string, detail: string) {
    super(`Data file corrupted: ${filename} — ${detail}`);
    this.name = "DataFileCorruptError";
  }
}

function resolveDataFile(filename: string): string {
  if (
    !filename ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    throw new Error("Invalid data filename");
  }
  return path.join(DATA_DIR, filename);
}

function getMutex(filename: string): Mutex {
  let mutex = mutexes.get(filename);
  if (!mutex) {
    mutex = new Mutex();
    mutexes.set(filename, mutex);
  }
  return mutex;
}

function tmpSibling(filePath: string): string {
  return `${filePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const tmpPath = tmpSibling(filePath);
  try {
    await writeFile(tmpPath, contents, "utf-8");
    await rename(tmpPath, filePath);
  } catch (err) {
    await rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
}

async function readJsonFile<T>(filePath: string, filename: string): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw Object.assign(new Error(`Data file not found: ${filename}`), {
        code: "ENOENT",
      });
    }
    if (err instanceof SyntaxError) {
      throw new DataFileCorruptError(filename, err.message);
    }
    throw err;
  }
}

export async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function readData<T>(filename: string): Promise<T> {
  return readJsonFile<T>(resolveDataFile(filename), filename);
}

/** Fallback only when the file is missing — never on corrupt JSON. */
export async function readDataSafe<T>(filename: string, fallback: T): Promise<T> {
  try {
    return await readData<T>(filename);
  } catch (err) {
    if (
      (err as NodeJS.ErrnoException).code === "ENOENT" ||
      (err instanceof Error && err.message.startsWith("Data file not found:"))
    ) {
      return structuredClone(fallback);
    }
    throw err;
  }
}

export async function writeData<T>(filename: string, data: T): Promise<void> {
  const mutex = getMutex(filename);
  await mutex.runExclusive(async () => {
    await ensureDataDir();
    await atomicWrite(resolveDataFile(filename), JSON.stringify(data, null, 2));
  });
}

/**
 * Holds the file mutex across read → mutate → write so concurrent
 * request handlers cannot drop each other's updates.
 */
export async function updateData<T>(
  filename: string,
  fallback: T,
  mutator: (data: T) => void | Promise<void>
): Promise<T> {
  const mutex = getMutex(filename);
  return mutex.runExclusive(async () => {
    await ensureDataDir();
    const filePath = resolveDataFile(filename);
    let data: T;
    try {
      data = await readJsonFile<T>(filePath, filename);
    } catch (err) {
      if (
        (err as NodeJS.ErrnoException).code === "ENOENT" ||
        (err instanceof Error && err.message.startsWith("Data file not found:"))
      ) {
        data = structuredClone(fallback);
      } else {
        throw err;
      }
    }
    await mutator(data);
    await atomicWrite(filePath, JSON.stringify(data, null, 2));
    return data;
  });
}
