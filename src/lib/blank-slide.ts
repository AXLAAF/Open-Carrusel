import type { BrandConfig } from "@/types/brand";
import type { AspectRatio } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";

function usesXookFonts(brand: BrandConfig): boolean {
  const heading = brand.fonts.heading.toLowerCase();
  const name = brand.name.toLowerCase();
  return (
    heading.includes("borscha") ||
    heading.includes("rostex") ||
    name.includes("xook")
  );
}

export function blankSlideHtml(
  aspectRatio: AspectRatio,
  brand: BrandConfig
): string {
  const { width, height } = DIMENSIONS[aspectRatio];
  const label = brand.name?.trim() || "Open Carrusel";

  if (usesXookFonts(brand)) {
    return `<div class="xook-slide">
  <div class="xook-tag">NUEVO</div>
  <h1 class="xook-title">Titular</h1>
  <p class="xook-body">Edita este texto o pide a Cursor que disene la diapositiva.</p>
  <div class="xook-logo">${escapeHtml(label)}</div>
</div>`;
  }

  const heading = brand.fonts.heading || "Inter";
  const body = brand.fonts.body || "Inter";
  const bg = brand.colors.background || "#0a0a0a";
  const fg = brand.colors.primary || "#ffffff";
  const accent = brand.colors.accent || "#e94560";

  return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:80px;text-align:center;background:${bg};color:${fg};position:relative;overflow:hidden;">
  <p style="font-family:'${heading}',sans-serif;font-size:18px;letter-spacing:6px;text-transform:uppercase;color:${accent};margin-bottom:28px;">Nuevo</p>
  <h1 style="font-family:'${heading}',sans-serif;font-size:72px;font-weight:800;line-height:1.1;margin:0 0 24px;">Titular</h1>
  <p style="font-family:'${body}',sans-serif;font-size:28px;line-height:1.4;opacity:0.85;max-width:800px;margin:0;">Edita este texto o pide a Cursor que disene la diapositiva.</p>
  <p style="position:absolute;bottom:64px;left:0;right:0;font-family:'${body}',sans-serif;font-size:20px;letter-spacing:2px;text-transform:uppercase;opacity:0.6;">${escapeHtml(label)}</p>
</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
