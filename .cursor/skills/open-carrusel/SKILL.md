---
name: open-carrusel
description: Creates and edits Instagram carousels in OpenCarrusel via the oc CLI and HTML slide files. Use when designing slides, carousels, Instagram ads, Stories, Reels, or when the user asks to generate, edit, or export OpenCarrusel content.
---

# OpenCarrusel

CLI-first Instagram carousel editor. The app at `http://localhost:3000` is a **manual editor** (text, type, layers, brand, export). AI is optional. Slides are body-level HTML.

## How to make a carousel (do this; do not wait for chat)

1. Confirm the app is running (`npm run dev` → localhost:3000). If not, start it.
2. Set brand once: `npm run oc -- brand set --name "Marca" --accent "#e94560" --heading Inter --body Inter`
3. Compose the whole carousel from a brief (no AI):

```bash
npm run oc -- compose --name "5 errores" --topic "Tu hook de 8 palabras" --points "Uno|Dos|Tres" --cta "Guarda esto" --ratio 4:5
# or
npm run oc -- compose examples/carousel-brief.json
```

4. Open the printed editor URL. Correct copy, type, padding, and layers **by hand**.
5. Export: `npm run oc -- export <id> --format png`

The preview polls every 2s. Do not restart the app after HTML edits.

## Narrative (default 5–8 slides)

1. Hook (huge type, ≤8 words)
2. Setup / context
3. List or one insight per slide
4. Summary
5. CTA (always last)

Layouts: `hook` `setup` `value` `list` `quote` `stat` `summary` `cta`  
(`npm run oc -- layouts`)

## CLI

```bash
npm run oc -- list
npm run oc -- compose --name "..." --topic "..." --points "a|b|c" --cta "Guarda"
npm run oc -- slide add <id> --layout hook --title "..." --body "..." --kicker "CARRUSEL"
npm run oc -- slide add <id> --layout list --title "..." --items "Uno|Dos|Tres"
npm run oc -- slide restyle <id> <slideId> --layout value
npm run oc -- caption <id> --text "..." --hashtags tag1,tag2
npm run oc -- brand apply <id>
npm run oc -- templates save <id> --name "..."
npm run oc -- templates use <templateId>
npm run oc -- presets apply <presetId> --carousel <id>
npm run oc -- upload ./image.png
npm run oc -- export <id> --slide <slideId> --format jpg --quality 90 --out slide.jpg
npm run oc -- doctor
npm run oc -- help
```

`--json` for machine-readable output. `--html-file -` reads stdin. `--file` writes `data/` if the server is down.

## HTML files (manual + Cursor)

`data/slides/<carouselId>/<slideId>.html`

Body-level HTML only. Prefer layouts with:

- `data-oc-layout="hook"`
- `data-oc-field="kicker|title|body|footer|..."`
- `data-oc-layer="title"`

The editor reads those attributes for text, type, padding, and layers. You can still edit the file directly.

## Slide HTML rules

- No `<html>`, `<head>`, `<!DOCTYPE>`, `<script>`.
- Dimensions: 1:1 = 1080×1080, 4:5 = 1080×1350, 9:16 = 1080×1920.
- Local fonts: `"Borscha"`, `"BorschaBold"`, `"Rostex"`, `"RostexRegular"`.
- Images: `/uploads/{filename}` (`npm run oc -- upload`).
- Padding ≥ 80px. Max ~8 words on the hook. Contrast > 4.5:1.

## Editor (hand corrections)

Right rail: Diseño · Capas · Marca · Medios · Historial · Publicar · HTML.

Shortcuts: ← → slides, ⌘D duplicate, Delete, ⌘Z undo, ⌘⇧Z redo, ⌘0 fit, ⌘+/- zoom, space-drag pan.

Do not depend on in-app Claude. Chat is optional. Prefer `npm run oc` and the visual editor.

## Do not

- Do not spawn Claude CLI unless the user asks for the in-app chat.
- Do not put full HTML documents in slide files.
- Do not exceed 20 slides.
- Do not skip the CTA on the last slide.
