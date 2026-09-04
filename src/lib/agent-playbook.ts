import { readFile } from "fs/promises";
import path from "path";
import type { BrandConfig } from "@/types/brand";
import type { Carousel } from "@/types/carousel";
import type { StylePreset } from "@/types/style-preset";
import { DIMENSIONS, MAX_SLIDES } from "@/types/carousel";

const PLAYBOOK_REL = "docs/publicacion.md";
const MAX_PLAYBOOK_CHARS = 8000;

export async function loadPublicationPlaybook(): Promise<string> {
  const file = path.join(process.cwd(), PLAYBOOK_REL);
  try {
    const text = await readFile(file, "utf8");
    if (text.length <= MAX_PLAYBOOK_CHARS) return text;
    return `${text.slice(0, MAX_PLAYBOOK_CHARS)}\n\n[…] El resto está en ${PLAYBOOK_REL}. Léelo con Read.`;
  } catch {
    return `No se pudo leer ${PLAYBOOK_REL}. Usa pnpm oc y el checklist: 5–10 slides, hook, CTA, caption, hashtags, export.`;
  }
}

export function carouselSnapshot(carousel?: Carousel | null): string {
  if (!carousel) return "No hay carrusel abierto.";
  const dim = DIMENSIONS[carousel.aspectRatio];
  const slides =
    carousel.slides.length > 0
      ? carousel.slides
          .map(
            (s) =>
              `  - ${s.order + 1}. ${s.id}${s.notes ? ` — ${s.notes}` : ""}`
          )
          .join("\n")
      : "  (sin slides)";
  const palette = carousel.palette
    ? `Paleta carrusel: ${JSON.stringify(carousel.palette)}`
    : "Paleta carrusel: (usa marca global)";
  const hooks = carousel.hookVariants?.length
    ? `Hook variantes: ${carousel.hookVariants.length} guardadas` +
      (carousel.activeHookVariantId
        ? ` (activa: ${carousel.hookVariants.find((v) => v.id === carousel.activeHookVariantId)?.title || carousel.activeHookVariantId})`
        : " (ninguna aplicada aún)")
    : "Hook variantes: ninguna";
  const schedule = carousel.scheduledAt
    ? `Programado: ${carousel.scheduledAt}`
    : "Programado: no";
  return [
    `Carrusel actual: ${carousel.id} "${carousel.name}"`,
    `Ratio: ${carousel.aspectRatio} (${dim.width}×${dim.height})`,
    `Slides: ${carousel.slides.length}/${MAX_SLIDES}`,
    slides,
    palette,
    hooks,
    `Caption: ${carousel.caption?.trim() ? "sí" : "NO"}`,
    `Hashtags: ${carousel.hashtags?.length ?? 0}`,
    `Export: ${carousel.lastExportAt ? carousel.lastExportAt : "NO"}`,
    `Estado publicación: ${carousel.publishStatus || "draft"}`,
    schedule,
  ].join("\n");
}

export function brandSnapshot(brand: BrandConfig): string {
  if (!brand.name) {
    return "Marca: sin configurar. Usa Borscha / Rostex, un acento, fondo sólido.";
  }
  const text = brand.colors.text || "(auto: blanco en fondo oscuro)";
  return [
    `Marca global: ${brand.name}`,
    `Colores: primary ${brand.colors.primary}, accent ${brand.colors.accent}, bg ${brand.colors.background}, text ${text}`,
    `Fuentes: heading "${brand.fonts.heading}", body "${brand.fonts.body}"`,
    `REGLA COLORES: pedido del usuario para ESTE carrusel → \`pnpm oc -- palette <id> --background … --text …\` (no brand set). Hook A/B → \`hook variants\` + \`hook pick\`.`,
  ].join("\n");
}

function presetSnapshot(preset?: StylePreset | null): string {
  if (!preset) return "";
  return `Preset activo: "${preset.name}"\n${preset.designRules}`;
}

export async function buildFirstTurnPrompt(
  brand: BrandConfig,
  carousel: Carousel | null,
  preset: StylePreset | null,
  userMessage: string
): Promise<string> {
  const playbook = await loadPublicationPlaybook();
  const presetBlock = presetSnapshot(preset);
  return `Eres el agente de OpenCarrusel en el panel IZQUIERDO. Runtime: Cursor API en este repo. Hablas español.

Ejecuta el CLI (\`pnpm oc -- …\`). No dumps de comandos. Después de cada acción, seguimiento hasta el checklist de publicación.

COLORES (obligatorio):
- brand.json es el DEFAULT global.
- Si el usuario pide colores para ESTE carrusel, usa paleta por carrusel (no reescribas brand.json): \`pnpm oc -- palette <id> --background … --text … --accent …\`.
- Al componer con --background/--text/--accent, eso se guarda como palette del carrusel.
- Solo \`brand set\` si pide cambiar la marca de toda la app.
- Fondos oscuros → texto blanco (\`--text "#ffffff"\`).

HOOK A/B:
- \`pnpm oc -- hook variants <id>\` genera 3 opciones (se guardan).
- \`pnpm oc -- hook pick <id> 1|2|3\` aplica una al primer hook; puedes cambiar en cualquier momento (las 3 persisten).

COLA DE PUBLICACIÓN:
- Tras caption + hashtags + export: \`pnpm oc -- schedule <id> --at "2026-08-20T18:00"\` y \`schedule list\`.
- Marcar publicado: \`pnpm oc -- schedule status <id> published\`.

BIBLIOTECA XOOKTECH:
- \`pnpm oc -- library list\` · \`library apply xook-hook-4x5 <id> --add\`

REVISIÓN:
- \`pnpm oc -- review <id>\` — contraste, padding, hook ≤8 palabras, CTA al final.

IMPORT:
- \`pnpm oc -- import <url|file.pdf> --compose\` o pegar texto. Genera brief.md y compose.

RATIO: al cambiar 1:1 / 4:5 / 9:16 usa \`pnpm oc -- ratio <id> 4:5\` (redimensiona el HTML). No dejes width/height viejos.

Skills del proyecto (léelas / ya están en settingSources):
- .cursor/skills/oc-agent/SKILL.md
- .cursor/skills/open-carrusel/SKILL.md
- .cursor/skills/sn-ppt-standard/SKILL.md
- ${PLAYBOOK_REL}

${brandSnapshot(brand)}

${carouselSnapshot(carousel)}
${presetBlock ? `\n${presetBlock}\n` : ""}
---
Playbook de publicación:

${playbook}

---
Pedido del usuario:
${userMessage.trim()}`;
}

export function buildFollowUpPrompt(
  carousel: Carousel | null,
  userMessage: string
): string {
  return `${carouselSnapshot(carousel)}

Pedido:
${userMessage.trim()}`;
}
