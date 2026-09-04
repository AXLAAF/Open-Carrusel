import { readDataSafe, updateData } from "./data";
import { now } from "./utils";
import type { BrandConfig } from "@/types/brand";
import { DEFAULT_BRAND } from "@/types/brand";

const FILE = "brand.json";

export async function getBrand(): Promise<BrandConfig> {
  return readDataSafe<BrandConfig>(FILE, DEFAULT_BRAND);
}

export async function updateBrand(
  updates: Partial<Omit<BrandConfig, "createdAt" | "updatedAt">>
): Promise<BrandConfig> {
  const colors =
    updates.colors && typeof updates.colors === "object" ? updates.colors : undefined;
  const fonts =
    updates.fonts && typeof updates.fonts === "object" ? updates.fonts : undefined;

  let updated!: BrandConfig;
  await updateData<BrandConfig>(FILE, DEFAULT_BRAND, (current) => {
    if (typeof updates.name === "string") current.name = updates.name;
    if (colors) current.colors = { ...current.colors, ...colors };
    if (fonts) current.fonts = { ...current.fonts, ...fonts };
    if (Array.isArray(updates.customFonts)) current.customFonts = updates.customFonts;
    if (updates.logoPath === null || typeof updates.logoPath === "string") {
      current.logoPath = updates.logoPath;
    }
    if (Array.isArray(updates.styleKeywords)) {
      current.styleKeywords = updates.styleKeywords.filter((k) => typeof k === "string");
    }
    current.updatedAt = now();
    current.createdAt = current.createdAt || now();
    updated = current;
  });
  return updated;
}

export function isBrandConfigured(brand: BrandConfig): boolean {
  return brand.name.trim().length > 0;
}
