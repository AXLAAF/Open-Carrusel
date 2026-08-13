# Open Carrusel

AI-powered Instagram carousel builder. Next.js 16 + React 19 + TypeScript + Tailwind v4.

## Architecture

- **Frontend**: React app at localhost:3000 with chat (left), preview (center), HTML inspector (right), filmstrip (bottom)
- **Agents**: Cursor SDK in-app chat (`/api/chat` SSE) or this repo + `pnpm oc`
- **CLI**: `pnpm oc -- <command>` — create/edit/export without the chat panel
- **Storage**: JSON in `/data/` plus slide HTML at `data/slides/{carouselId}/{slideId}.html`
- **Export**: Puppeteer screenshots HTML slides to PNG at exact Instagram dimensions
- **Slides**: Body-level HTML. `wrapSlideHtml()` in `src/lib/slide-html.ts` is the shared rendering contract

## Key Files

- `scripts/oc.mjs` — Agent CLI (`pnpm oc -- help`)
- `src/lib/chat-system-prompt.ts` — Dynamic system prompt (brand + carousel)
- `src/lib/slide-html.ts` — `wrapSlideHtml()` wraps slide body HTML into full documents
- `src/lib/slide-files.ts` — HTML files on disk (Cursor edits these)
- `src/lib/data.ts` — JSON storage with async-mutex and atomic writes
- `src/lib/carousels.ts` — Carousel and slide CRUD with version history
- `src/lib/cursor-auth.ts` — `CURSOR_API_KEY` for in-app Cursor SDK chat

## CLI (Cursor / any agent)

```bash
pnpm oc -- list
pnpm oc -- create "Nombre" --ratio 4:5
pnpm oc -- slide add <id> --blank
pnpm oc -- slide update <id> <slideId> --html-file ./slide.html
pnpm oc -- export <id>
```

After a slide exists, edit `data/slides/<carouselId>/<slideId>.html` directly. The editor polls and refreshes.

## API Routes

All at localhost:3000:

- `POST /api/chat` — Cursor SDK local agent + SSE streaming
- `GET/POST /api/carousels` — List/create carousels
- `GET/PUT/DELETE /api/carousels/[id]` — Single carousel (GET supports ETag / 304)
- `POST /api/carousels/[id]/slides` — Add slide (`html`, or `{ blank: true }`, or `{ duplicateFrom }`)
- `PUT/DELETE /api/carousels/[id]/slides/[slideId]` — Update/delete slide
- `POST /api/carousels/[id]/slides/[slideId]/duplicate` — Duplicate slide
- `PUT /api/carousels/[id]/slides` — Reorder slides (body: { slideIds: [...] })
- `POST /api/carousels/[id]/slides/[slideId]/undo` — Undo slide change
- `POST /api/carousels/[id]/export` — Export all slides to PNG ZIP
- `GET/PUT /api/brand` — Brand configuration
- `GET/POST /api/templates` — Templates
- `POST /api/upload` — Image upload (PNG/JPG/WebP only, max 10MB)
- `GET /api/fonts` — Google Fonts list

## Conventions

- Components max ~300 lines per file
- Use `cn()` from `src/lib/utils.ts` for class merging
- Types in `src/types/`, libs in `src/lib/`, components in `src/components/`
- All JSON mutations go through `src/lib/data.ts`; slide HTML files go through `src/lib/slide-files.ts`
- iframe slides always use `sandbox=""` (no JavaScript execution)
- In-app Cursor agent loads project skills via `local.settingSources: ["project"]` and should prefer `pnpm oc`

## Instagram Dimensions

- 1:1 = 1080x1080 (square)
- 4:5 = 1080x1350 (portrait, recommended)
- 9:16 = 1080x1920 (story)
- Max 20 slides per carousel

## Slide HTML Rules

Slides store body-level HTML only (no `<html>`, `<head>`, `<!DOCTYPE>`). The `wrapSlideHtml()` function adds the full document structure, local fonts (`/fonts/local.css`), Google Fonts, and dimension constraints. Slides should:

- Use inline styles or `<style>` tags
- Reference images as `/uploads/{filename}` paths
- Use Google Font family names or local `Borscha` / `Rostex`
- NOT contain `<script>` tags (enforced by iframe sandbox)
- Target the carousel's aspect ratio dimensions
