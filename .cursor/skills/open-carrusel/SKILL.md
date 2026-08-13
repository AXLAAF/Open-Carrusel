---
name: open-carrusel
description: Creates and edits Instagram carousels in OpenCarrusel via the oc CLI and HTML slide files. Use when designing slides, carousels, Instagram ads, Stories, Reels, or when the user asks to generate, edit, or export OpenCarrusel content.
---

# OpenCarrusel

Instagram carousel editor. Slides are body-level HTML. Preview: `http://localhost:3000`.

Before designing, follow `.cursor/skills/sn-ppt-standard/SKILL.md` so slides do not look AI-generated: one idea per slide, editable HTML, sober type/color, no cliché copy.

## Workflow

1. Confirm the app is running (`pnpm dev` → localhost:3000). If not, start it.
2. Identify the carousel: `pnpm oc -- list` or the URL `/carousel/<id>`.
3. Create or edit slides (CLI or HTML files). The editor polls — do not restart the app.
4. Keep copy short. One idea per slide. Last slide is always a CTA.

## CLI

```bash
pnpm oc -- list
pnpm oc -- create "Nombre" --ratio 4:5
pnpm oc -- get <id>
pnpm oc -- slide add <id> --blank --notes "hook"
pnpm oc -- slide add <id> --html-file ./slide.html --notes "value"
pnpm oc -- slide update <id> <slideId> --html-file ./slide.html
pnpm oc -- slides <id>
pnpm oc -- caption <id> --text "..." --hashtags tag1,tag2
pnpm oc -- export <id>
pnpm oc -- help
```

`--json` for machine-readable output. `--html-file -` reads stdin.

## HTML files (preferred for Cursor)

After a slide exists:

`data/slides/<carouselId>/<slideId>.html`

Write that file directly. The preview updates on its own. Do not wrap with `<html>`, `<head>`, or `<!DOCTYPE>`.

Numbered dump (optional): `pnpm oc -- dump <id>` then `pnpm oc -- apply <id>`.

## Slide HTML rules

- Body-level HTML only. Inline styles or `<style>`. No `<script>`.
- Dimensions: 1:1 = 1080×1080, 4:5 = 1080×1350, 9:16 = 1080×1920.
- Local fonts: `"Borscha"`, `"BorschaBold"`, `"Rostex"`, `"RostexRegular"`.
- Google Fonts work via `font-family: 'Inter', sans-serif`.
- Images: `/uploads/{filename}`.
- Optional classes: `.xook-slide` `.xook-title` `.xook-body` `.xook-tag` `.xook-logo`.
- Padding ≥ 80px. Max ~8 words on the hook. Contrast > 4.5:1.
- Prefer `Borscha` / `Rostex` over Inter, Poppins, Montserrat.
- Real text nodes. No stock photos, mesh gradients, or cloned icon-card grids.

## Narrative (default 5–8 slides)

1. Hook (huge type, ≤8 words)
2–3. Problem / context
4–6. One insight per slide
7. Summary
8. CTA

Read brand from `pnpm oc -- brand` and stay on-palette. Copy: casual, direct, no AI clichés (see sn-ppt-standard).

## Do not

- Do not spawn Claude CLI from this repo unless the user asks for the in-app chat.
- Do not put full HTML documents in slide files.
- Do not exceed 20 slides.
- Do not use AI-slop layout or copy. Follow sn-ppt-standard.
