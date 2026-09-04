---
name: swipeforge
description: Creates and edits Instagram carousels in SwipeForge via the oc CLI and HTML slide files. Use when designing slides, carousels, Instagram ads, Stories, Reels, or when the user asks to generate, edit, or export SwipeForge content.
---

# SwipeForge

CLI-first Instagram carousel editor. The app at `http://localhost:3000` is a **manual editor** (text, type, layers, brand, export). AI is optional. Slides are body-level HTML.

Before designing, follow `.cursor/skills/sn-ppt-standard/SKILL.md` so slides do not look AI-generated: one idea per slide, editable HTML, sober type/color, no cliché copy.

## How to make a carousel (do this; do not wait for chat)

1. Confirm the app is running (`pnpm dev` → localhost:3000). If not, start it.
2. Set brand once: `pnpm oc -- brand set --name "Marca" --accent "#e94560" --heading Borscha --body Rostex`
3. Compose the whole carousel from a brief (no AI):

```bash
pnpm oc -- compose --name "5 errores" --topic "Tu hook de 8 palabras" --points "Uno|Dos|Tres" --cta "Guarda esto" --ratio 4:5
# alias
pnpm oc -- make --name "5 errores" --topic "Tu hook de 8 palabras" --points "Uno|Dos|Tres" --cta "Guarda esto"
# one-shot colors (user palette wins over brand.json for this carousel):
pnpm oc -- make --name "..." --topic "..." --points "a|b" --cta "Guarda" --background "#111" --text "#fff" --accent "#e94560"
# or
pnpm oc -- compose examples/carousel-brief.md
# or
pnpm oc -- compose examples/carousel-brief.json
```

4. Open the printed editor URL. Correct copy, type, padding, and layers **by hand**.
5. Export: `pnpm oc -- export <id> --format png`

The preview polls. Do not restart the app after HTML edits.

## Narrative (default 5–8 slides)

1. Hook (huge type, ≤8 words)
2. Setup / context
3. List or one insight per slide
4. Summary
5. CTA (always last)

Layouts: `hook` `setup` `value` `list` `quote` `stat` `summary` `cta`  
(`pnpm oc -- layouts`)

## CLI

```bash
pnpm oc -- list
pnpm oc -- compose --name "..." --topic "..." --points "a|b|c" --cta "Guarda" --background "#111" --text "#fff"
pnpm oc -- ratio <id> 4:5
pnpm oc -- palette <id> --background "#111" --text "#fff" --accent "#e94560"
pnpm oc -- hook variants <id>
pnpm oc -- hook pick <id> 2
pnpm oc -- schedule list
pnpm oc -- schedule <id> --at "2026-08-20T18:00"
pnpm oc -- library list
pnpm oc -- library apply xook-hook-4x5 <id> --add
pnpm oc -- review <id>
pnpm oc -- import https://ejemplo.com --compose
pnpm oc -- import ./doc.pdf --compose
pnpm oc -- brand set --background "#0a0a0a" --text "#ffffff" --accent "#e94560"
pnpm oc -- brand apply <id>
pnpm oc -- slide add <id> --layout hook --title "..." --body "..." --kicker "CARRUSEL"
pnpm oc -- slide add <id> --layout list --title "..." --items "Uno|Dos|Tres"
pnpm oc -- slide field <id> <slideId> --title "Nuevo titular"
pnpm oc -- slide restyle <id> <slideId> --layout value
pnpm oc -- caption <id> --text "..." --hashtags tag1,tag2
pnpm oc -- brand apply <id>
pnpm oc -- templates save <id> --name "..."
pnpm oc -- templates use <templateId>
pnpm oc -- presets apply <presetId> --carousel <id>
pnpm oc -- upload ./image.png
pnpm oc -- export <id> --slide <slideId> --format jpg --quality 90 --out slide.jpg
pnpm oc -- doctor
pnpm oc -- help
```

`--json` for machine-readable output. `--html-file -` reads stdin. `--file` writes `data/` if the server is down. `npm run oc` still works.

## HTML files (manual + Cursor)

`data/slides/<carouselId>/<slideId>.html`

Body-level HTML only. Prefer layouts with:

- `data-oc-layout="hook"`
- `data-oc-field="kicker|title|body|footer|..."`
- `data-oc-layer="title"`

The editor reads those attributes for text, type, padding, and layers. Click text in the preview to edit in place. You can still edit the file directly.

Numbered dump (optional): `pnpm oc -- dump <id>` then `pnpm oc -- apply <id>`.

## Slide HTML rules

- No `<html>`, `<head>`, `<!DOCTYPE>`, `<script>`.
- Dimensions: 1:1 = 1080×1080, 4:5 = 1080×1350, 9:16 = 1080×1920.
- Local fonts: `"Borscha"`, `"BorschaBold"`, `"Rostex"`, `"RostexRegular"`.
- Images: `/uploads/{filename}` (`pnpm oc -- upload`).
- Padding ≥ 80px. Max ~8 words on the hook. Contrast > 4.5:1.
- Prefer `Borscha` / `Rostex` over Inter, Poppins, Montserrat.
- Real text nodes. No stock photos, mesh gradients, or cloned icon-card grids.

## Editor (hand corrections)

Right rail: Diseño · Capas · Marca · Medios · Historial · Publicar · HTML.

        Shortcuts: ← → slides, F Instagram, / agente, E código, P publicar, ? ayuda, ⌘D duplicate, Delete, ⌘Z undo, ⌘⇧Z redo, ⌘0 fit, ⌘+/- zoom, space-drag pan.

Do not depend on waiting for permission. The left-rail in-app agent (Cursor API) runs `pnpm oc`, follows `docs/publicacion.md`, and keeps the session until caption + export are done. Hand corrections stay in the visual editor.

Read brand from `pnpm oc -- brand` as the default palette. If the user asks for other colors for this carousel, those win via **carousel palette** (not brand.json): `pnpm oc -- palette <id> --background … --text …`. Compose `--background/--text/--accent` also saves the palette on the carousel.

Hook A/B: `pnpm oc -- hook variants <id>` then `hook pick <id> 1|2|3`. The three stay saved; switch anytime. Studio shows Activo on the selected one.

Publication queue: after caption + export, `pnpm oc -- schedule <id> --at "…"` and `schedule list`. Home tab **Cola**.

XookTech layout library: `pnpm oc -- library list` / `library apply <layoutId> <carouselId> [--add|--slide]`. Home tab **Biblioteca**; Diseño rail picker.

Auto review: `pnpm oc -- review <id>` (contrast, padding ≥80, hook ≤8 words, CTA last). Studio tab **Revisión**.

Import: `pnpm oc -- import <url|file.pdf> --compose` or home **Importar** (URL / Notion público / PDF → brief `.md` → compose).

Follow `docs/publicacion.md`: 5–10 slides, hook first, CTA last, caption, ≥3 hashtags, PNG export, center-safe for 1:1 crop. Ratio changes must resize slide HTML (`pnpm oc -- ratio <id> 4:5`).

## Do not

- Do not spawn Claude CLI unless the user asks for it.
- Do not put full HTML documents in slide files.
- Do not exceed 20 slides.
- Do not skip the CTA on the last slide.
- Do not use AI-slop layout or copy. Follow sn-ppt-standard.
