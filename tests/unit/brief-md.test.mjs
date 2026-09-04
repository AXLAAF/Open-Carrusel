import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBriefMarkdown } from "../../scripts/lib/brief-md.mjs";

test("parses heading, kv, points, caption, hashtags", () => {
  const brief = parseBriefMarkdown(`# 5 errores al publicar

Ratio: 4:5
CTA: Guarda esto
Kicker: CARRUSEL

## Topic
Tu carrusel no convierte

## Points
- Hook débil
- Texto largo
- Sin CTA claro

## Caption
Si no convierte, no es el algoritmo.

## Hashtags
#carrusel instagram contenido
`);
  assert.equal(brief.name, "5 errores al publicar");
  assert.equal(brief.ratio, "4:5");
  assert.equal(brief.cta, "Guarda esto");
  assert.equal(brief.topic, "Tu carrusel no convierte");
  assert.deepEqual(brief.points, ["Hook débil", "Texto largo", "Sin CTA claro"]);
  assert.match(brief.caption, /algoritmo/);
  assert.deepEqual(brief.hashtags, ["carrusel", "instagram", "contenido"]);
});

test("parses frontmatter and explicit slides", () => {
  const brief = parseBriefMarkdown(`---
name: Manual
ratio: 1:1
cta: Escríbenos
---

## Slides
### hook
title: Hola
body: Desliza

### cta
title: Listo
`);
  assert.equal(brief.name, "Manual");
  assert.equal(brief.ratio, "1:1");
  assert.equal(brief.slides.length, 2);
  assert.equal(brief.slides[0].title, "Hola");
  assert.equal(brief.slides[1].layout, "cta");
});
