# Contexto del Proyecto: OpenCarrusel

## 1. Información General

- **Nombre del Proyecto**: OpenCarrusel
- **Descripción**: Generador y editor de carruseles y anuncios de Instagram. Se edita a mano, con Cursor, con el CLI `oc`, o con el chat de Claude CLI (opcional).
- **Ruta Absoluta**: `/home/axelmc/Documentos/Proyectos_JunDic/XookTech/Projects/OpenCarrusel`
- **Repositorio GitHub**: `https://github.com/AXLAAF/Open-Carrusel`
- **URL Local**: `http://localhost:3000`

---

## 2. Arquitectura Tecnológica

- **Framework**: Next.js 16.2 (App Router) + React 19 + TypeScript.
- **Estilos**: Tailwind CSS v4 + PostCSS.
- **Lienzo**: diapositivas como HTML/CSS. `wrapSlideHtml()` en `src/lib/slide-html.ts` arma el documento, fuentes locales (`/fonts/local.css`) y Google Fonts.
- **Preview**: `SlideRenderer` en iframes `sandbox=""`. El editor hace polling cada 2s.
- **Editor**: tira de diapositivas (dnd-kit), panel HTML, caption editable, duplicar / añadir en blanco.
- **CLI**: `npm run oc -- <comando>` (`scripts/oc.mjs`). Es la interfaz para Cursor y cualquier agente.
- **Archivos de slide**: `data/slides/{carouselId}/{slideId}.html` — Cursor puede escribirlos directo.
- **Exportación**: Puppeteer → PNG ZIP.
- **Storage JSON**: `data/` con `async-mutex` y escrituras atómicas.
- **Chat embebido**: Claude CLI vía SSE en `/api/chat` (opcional; no es requisito).

---

## 3. Formatos

- **1:1** 1080×1080
- **4:5** 1080×1350 (recomendado)
- **9:16** 1080×1920
- Máximo 20 diapositivas

---

## 4. CLI rápido

```bash
npm run oc -- list
npm run oc -- create "Nombre" --ratio 4:5
npm run oc -- slide add <id> --blank
npm run oc -- slide update <id> <slideId> --html-file ./slide.html
npm run oc -- export <id>
npm run oc -- help
```

Skill de Cursor: `.cursor/skills/open-carrusel/SKILL.md`

---

## 5. Comandos

```bash
cd /home/axelmc/Documentos/Proyectos_JunDic/XookTech/Projects/OpenCarrusel
npm run dev      # webpack, http://localhost:3000
npm run oc -- help
npm run build
npm run start
```

---

## 6. Fuentes locales

Borscha y Rostex en `public/fonts/`, declaradas en `public/fonts/local.css`. En slides usar `"Borscha"`, `"BorschaBold"`, `"Rostex"`, `"RostexRegular"`, o las clases `.xook-slide`, `.xook-title`, `.xook-body`, `.xook-tag`, `.xook-logo`.
