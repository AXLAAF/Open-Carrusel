# Open Carrusel

CLI-first Instagram carousel editor. Next.js 16 + React 19 + TypeScript + Tailwind v4. AI is optional.

## Architecture

- **Frontend**: React app at localhost:3000 — preview (center), studio editor (right: text/type/layers/brand/media/history/publish/HTML), filmstrip (bottom), optional chat (left)
- **CLI**: `npm run oc -- <command>` — compose, brand, templates, export. Cursor and other agents should prefer this
- **Agents**: Cursor (this repo + `npm run oc`) or optional in-app Claude CLI via `/api/chat` SSE
- **Storage**: JSON in `/data/` plus slide HTML at `data/slides/{carouselId}/{slideId}.html`
- **Export**: Puppeteer screenshots HTML slides to PNG/JPG at exact Instagram dimensions
- **Slides**: Body-level HTML with `data-oc-layout` / `data-oc-field` / `data-oc-layer`. `wrapSlideHtml()` in `src/lib/slide-html.ts` is the shared rendering contract

## Key Files

- `scripts/oc.mjs` — Agent CLI (`npm run oc -- help`)
- `scripts/lib/layouts.mjs` — CLI layouts + compose-from-brief (keep in sync with `src/lib/slide-layouts.ts`)
- `src/lib/slide-layouts.ts` — Layout HTML for the app
- `src/lib/slide-fields.ts` — Parse/update `data-oc-field` for the visual editor
- `src/lib/compose.ts` — Create a full carousel from a brief
- `src/lib/chat-system-prompt.ts` — Dynamic system prompt (brand + carousel)
- `src/lib/slide-html.ts` — `wrapSlideHtml()` wraps slide body HTML into full documents
- `src/lib/slide-files.ts` — HTML files on disk (Cursor edits these)
- `src/lib/data.ts` — JSON storage with async-mutex and atomic writes
- `src/lib/carousels.ts` — Carousel and slide CRUD with version history
- `src/lib/claude-path.ts` — Portable Claude CLI discovery (optional)

## How to make a carousel (CLI)

```bash
npm run oc -- brand set --name "Marca" --accent "#e94560" --heading Inter --body Inter
npm run oc -- compose --name "5 errores" --topic "Tu hook" --points "Uno|Dos|Tres" --cta "Guarda esto"
npm run oc -- slide add <id> --layout hook --title "..." --body "..."
npm run oc -- export <id> --format png
```

Brief file: `npm run oc -- compose examples/carousel-brief.json`

After a slide exists, edit `data/slides/<carouselId>/<slideId>.html` or use the studio panel. The editor polls and refreshes. Hand corrections do not require AI.

Layouts: hook, setup, value, list, quote, stat, summary, cta.

## API Routes

All at localhost:3000:

- `POST /api/carousels/compose` — Create carousel + slides from a brief
- `POST /api/carousels/[id]/slides` — Add slide (`layout`+`fields`, `html`, `{ blank: true }`, or `{ duplicateFrom }`)
- `POST /api/carousels/[id]/export` — Body optional: `{ slideIds, format: png|jpg, quality, naming }`
- `GET /api/uploads` — Media library list
- `POST /api/style-presets/[id]/apply` — Copy preset into brand
- `POST /api/carousels/[id]/restyle` — Re-render slides with current brand
- `POST /api/chat` — Claude CLI subprocess + SSE streaming (optional)
- `GET/POST /api/carousels` — List/create carousels
- `GET/PUT /api/brand` — Brand configuration
- `GET/POST /api/templates` — Templates
- `POST /api/upload` — Image upload (PNG/JPG/WebP, max 10MB)

## Conventions

- Components max ~300 lines per file
- Use `cn()` from `src/lib/utils.ts` for class merging
- Types in `src/types/`, libs in `src/lib/`, components in `src/components/`
- All JSON mutations go through `src/lib/data.ts`; slide HTML files go through `src/lib/slide-files.ts`
- iframe slides always use `sandbox=""` (no JavaScript execution)
- In-app Claude (if installed) gets `--allowedTools Bash WebFetch Read` and should prefer `npm run oc`

## Instagram Dimensions

- 1:1 = 1080x1080 (square)
- 4:5 = 1080x1350 (portrait, recommended)
- 9:16 = 1080x1920 (story)
- Max 20 slides per carousel

## Slide HTML Rules

Slides store body-level HTML only (no `<html>`, `<head>`, `<!DOCTYPE>`). The `wrapSlideHtml()` function adds the full document structure, local fonts (`/fonts/local.css`), Google Fonts, and dimension constraints. Slides should:

- Use inline styles or `<style>` tags
- Mark editable blocks with `data-oc-field` / `data-oc-layer` so the studio can edit without AI
- Reference images as `/uploads/{filename}` paths
- Use Google Font family names or local `Borscha` / `Rostex`
- NOT contain `<script>` tags (enforced by iframe sandbox)
- Target the carousel's aspect ratio dimensions
