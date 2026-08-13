import { NextResponse } from "next/server";
import { getPreset } from "@/lib/style-presets";
import { updateBrand } from "@/lib/brand";
import type { BrandConfig } from "@/types/brand";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const preset = await getPreset(id);
  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  const patch: Partial<Omit<BrandConfig, "createdAt" | "updatedAt">> = {};
  if (preset.brand?.name) patch.name = preset.brand.name;
  if (preset.brand?.colors) patch.colors = preset.brand.colors;
  if (preset.brand?.fonts) patch.fonts = preset.brand.fonts;
  if (preset.brand?.customFonts) patch.customFonts = preset.brand.customFonts;
  if (preset.brand?.logoPath !== undefined) patch.logoPath = preset.brand.logoPath;
  if (preset.brand?.styleKeywords) patch.styleKeywords = preset.brand.styleKeywords;

  const brand = await updateBrand(patch);

  return NextResponse.json({ brand, preset: { id: preset.id, name: preset.name } });
}
