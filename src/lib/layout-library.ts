import { readDataSafe, updateData } from "./data";
import { generateId, now } from "./utils";
import type { BrandLayout, LayoutLibraryData } from "@/types/layout-library";
import type { AspectRatio } from "@/types/carousel";
import type { BrandConfig } from "@/types/brand";
import type { LayoutId } from "@/types/layout";
import {
  LAYOUT_IDS,
  LAYOUT_LABELS,
  defaultFields,
  renderLayout,
} from "@/lib/slide-layouts";

const FILE = "layout-library.json";
const EMPTY: LayoutLibraryData = { layouts: [] };

export const XOOK_LIBRARY_BRAND: BrandConfig = {
  name: "XookTech",
  colors: {
    primary: "#1B2B6B",
    secondary: "#2D4BD4",
    accent: "#00D4FF",
    background: "linear-gradient(135deg, #1B2B6B 0%, #2D4BD4 50%, #00D4FF 100%)",
    surface: "#0f1a4a",
    text: "#ffffff",
  },
  fonts: { heading: "Borscha", body: "Rostex" },
  customFonts: [],
  logoPath: null,
  styleKeywords: ["xooktech", "bold", "tech"],
  createdAt: "",
  updatedAt: "",
};

function seedLayouts(): BrandLayout[] {
  const ratios: AspectRatio[] = ["4:5", "9:16"];
  const createdAt = now();
  const out: BrandLayout[] = [];
  for (const ratio of ratios) {
    for (const layout of LAYOUT_IDS) {
      const fields = {
        ...defaultFields(layout, XOOK_LIBRARY_BRAND),
        kicker: layout === "hook" ? "XOOKTECH" : undefined,
        footer: "XookTech",
      };
      out.push({
        id: `xook-${layout}-${ratio.replace(":", "x")}`,
        name: `XookTech · ${LAYOUT_LABELS[layout]} · ${ratio}`,
        description: `Layout ${LAYOUT_LABELS[layout]} con marca XookTech (${ratio}).`,
        layout: layout as LayoutId,
        aspectRatio: ratio,
        html: renderLayout(layout as LayoutId, fields, XOOK_LIBRARY_BRAND, ratio),
        tags: ["xooktech", layout, ratio],
        brand: "XookTech",
        createdAt,
      });
    }
  }
  return out;
}

async function load(): Promise<LayoutLibraryData> {
  return readDataSafe<LayoutLibraryData>(FILE, EMPTY);
}

export async function listBrandLayouts(): Promise<BrandLayout[]> {
  const data = await load();
  if (data.layouts.length === 0) {
    const seeded = seedLayouts();
    await updateData<LayoutLibraryData>(FILE, EMPTY, (store) => {
      store.layouts = seeded;
    });
    return seeded;
  }
  return data.layouts;
}

export async function getBrandLayout(id: string): Promise<BrandLayout | null> {
  const layouts = await listBrandLayouts();
  return layouts.find((l) => l.id === id) ?? null;
}

export async function reseedBrandLayouts(): Promise<BrandLayout[]> {
  const seeded = seedLayouts();
  await updateData<LayoutLibraryData>(FILE, EMPTY, (store) => {
    store.layouts = seeded;
  });
  return seeded;
}

export async function saveBrandLayout(
  input: Omit<BrandLayout, "id" | "createdAt"> & { id?: string }
): Promise<BrandLayout> {
  let saved!: BrandLayout;
  await updateData<LayoutLibraryData>(FILE, EMPTY, (data) => {
    saved = {
      ...input,
      id: input.id || generateId(),
      createdAt: now(),
    };
    const idx = data.layouts.findIndex((l) => l.id === saved.id);
    if (idx >= 0) data.layouts[idx] = saved;
    else data.layouts.push(saved);
  });
  return saved;
}
