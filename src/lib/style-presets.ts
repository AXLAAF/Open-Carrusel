import { readDataSafe, updateData } from "./data";
import { generateId, now } from "./utils";
import type { StylePreset, StylePresetsData } from "@/types/style-preset";

const FILE = "style-presets.json";
const EMPTY: StylePresetsData = { presets: [] };

async function load(): Promise<StylePresetsData> {
  return readDataSafe<StylePresetsData>(FILE, EMPTY);
}

export async function listPresets(): Promise<StylePreset[]> {
  const data = await load();
  return data.presets;
}

export async function getPreset(id: string): Promise<StylePreset | null> {
  const data = await load();
  return data.presets.find((p) => p.id === id) ?? null;
}

export async function createPreset(
  params: Omit<StylePreset, "id" | "createdAt">
): Promise<StylePreset> {
  let preset!: StylePreset;
  await updateData<StylePresetsData>(FILE, EMPTY, (data) => {
    preset = {
      ...params,
      id: generateId(),
      createdAt: now(),
    };
    data.presets.push(preset);
  });
  return preset;
}

export async function deletePreset(id: string): Promise<boolean> {
  let deleted = false;
  await updateData<StylePresetsData>(FILE, EMPTY, (data) => {
    const idx = data.presets.findIndex((p) => p.id === id);
    if (idx === -1) return;
    data.presets.splice(idx, 1);
    deleted = true;
  });
  return deleted;
}
