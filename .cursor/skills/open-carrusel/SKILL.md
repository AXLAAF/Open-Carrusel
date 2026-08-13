---
name: open-carrusel
description: Creates and edits Instagram carousels in OpenCarrusel via the oc CLI and HTML slide files. Use when designing slides, carousels, Instagram ads, Stories, Reels, or when the user asks to generate, edit, or export OpenCarrusel content.
---

# OpenCarrusel

CLI-first Instagram carousel editor. The app at `http://localhost:3000` is a **manual editor** (text, type, layers, brand, export). AI is optional. Slides are body-level HTML.

Before designing, follow `.cursor/skills/sn-ppt-standard/SKILL.md` so slides do not look AI-generated: one idea per slide, editable HTML, sober type/color, no cliché copy.

## How to make a carousel (do this; do not wait for chat)

1. Confirm the app is running (`pnpm dev` → localhost:3000). If not, start it.
2. Set brand once: `pnpm oc -- brand set --name "Marca" --accent "#e94560" --heading Borscha --body Rostex`
3. Compose the whole carousel from a brief (no AI):

```bash
pnpm oc -- compose --name "5 errores" --topic "Tu hook de 8 palabras" --points "Uno|Dos|Tres" --cta "Guarda esto" --ratio 4:5
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
pnpm oc -- compose --name "..." --topic "..." --points "a|b|c" --cta "Guarda"
pnpm oc -- slide add <id> --layout hook --title "..." --body "..." --kicker "CARRUSEL"
pnpm oc -- slide add <id> --layout list --title "..." --items "Uno|Dos|Tres"
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

The editor reads those attributes for text, type, padding, and layers. You can still edit the file directly.

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

Shortcuts: ← → slides, ⌘D duplicate, Delete, ⌘Z undo, ⌘⇧Z redo, ⌘0 fit, ⌘+/- zoom, space-drag pan.

Do not depend on in-app chat. Prefer `pnpm oc` and the visual editor. Chat uses Cursor SDK when `CURSOR_API_KEY` is set.

Read brand from `pnpm oc -- brand` and stay on-palette. Copy: casual, direct, no AI clichés (see sn-ppt-standard).

## Do not

- Do not spawn Claude CLI unless the user asks for it.
- Do not put full HTML documents in slide files.
- Do not exceed 20 slides.
- Do not skip the CTA on the last slide.
- Do not use AI-slop layout or copy. Follow sn-ppt-standard.
