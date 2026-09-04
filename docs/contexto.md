# Contexto del Proyecto: SwipeForge

## 1. Información General

- **Nombre del Proyecto**: SwipeForge
- **Descripción**: Generador y editor de carruseles y anuncios de Instagram. Se edita a mano, con Cursor, con el CLI `oc`, o con el chat de Claude CLI (opcional).
- **Ruta Absoluta**: `/home/axelmc/Documentos/Proyectos_JunDic/XookTech/Projects/SwipeForge`
- **Repositorio GitHub**: `https://github.com/AXLAAF/Open-Carrusel`
- **URL Local**: `http://localhost:3000`

---

## 2. Arquitectura Tecnológica

- **Framework**: Next.js 16.2 (App Router) + React 19 + TypeScript.
- **Estilos**: Tailwind CSS v4 + PostCSS.
- **Lienzo**: diapositivas como HTML/CSS. `wrapSlideHtml()` en `src/lib/slide-html.ts` arma el documento, fuentes locales (`/fonts/local.css`) y Google Fonts.
- **Preview**: `SlideRenderer` en iframes `sandbox=""`. El editor hace polling cada 3s (1s mientras genera) con ETag.
- **Editor**: tira de diapositivas (dnd-kit), panel HTML, caption editable, duplicar / añadir en blanco.
- **CLI**: `pnpm oc -- <comando>` (`scripts/oc.mjs`). Es la interfaz para Cursor y cualquier agente.
- **Archivos de slide**: `data/slides/{carouselId}/{slideId}.html` — Cursor puede escribirlos directo.
- **Exportación**: Puppeteer → PNG ZIP.
- **Storage JSON**: `data/` con `async-mutex` y escrituras atómicas.
- **Chat embebido**: Cursor SDK vía SSE en `/api/chat` (`CURSOR_API_KEY` en `.env.local`).

---

## 3. Formatos

- **1:1** 1080×1080
- **4:5** 1080×1350 (recomendado)
- **9:16** 1080×1920
- Máximo 20 diapositivas

---

## 4. CLI rápido

```bash
pnpm oc -- list
pnpm oc -- create "Nombre" --ratio 4:5
pnpm oc -- slide add <id> --blank
pnpm oc -- slide update <id> <slideId> --html-file ./slide.html
pnpm oc -- export <id>
pnpm oc -- help
```

Skill de Cursor: `.cursor/skills/swipeforge/SKILL.md`

---

## 5. Comandos

```bash
cd /home/axelmc/Documentos/Proyectos_JunDic/XookTech/Projects/SwipeForge
pnpm dev         # turbopack, http://localhost:3000
pnpm oc -- help
pnpm build
pnpm start
```

---

## 6. Fuentes locales

Borscha y Rostex en `public/fonts/`, declaradas en `public/fonts/local.css`. En slides usar `"Borscha"`, `"BorschaBold"`, `"Rostex"`, `"RostexRegular"`, o las clases `.xook-slide`, `.xook-title`, `.xook-body`, `.xook-tag`, `.xook-logo`.
