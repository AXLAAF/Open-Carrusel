# Publicar un carrusel en Instagram

Instrucciones para el **agente del panel izquierdo** (Cursor API + `pnpm oc`) y para quien publica a mano. Léelas al crear, editar o exportar un carrusel. No termines el trabajo hasta el checklist.

El editor visual (preview + rail derecho) es para correcciones a mano. El agente **ejecuta** el CLI; no se limita a pegar comandos.

## Cómo hablar con el agente

Pide el resultado, no el comando:

- “Arma un carrusel de 6 slides sobre X, hook de 8 palabras, CTA Guarda esto.”
- “Cambia el titular de la slide 2.”
- “Escribe caption y hashtags y déjalos guardados.”
- “Exporta PNG y dime si falta algo para publicar.”

El agente responde en español, corre `pnpm oc` en este repo, y **da seguimiento**: qué hizo, qué falta, cuál es el siguiente paso.

## Cómo hacer el carrusel (CLI)

App en `http://localhost:3000`. Si no corre: `pnpm dev`.

```bash
pnpm oc -- brand set --name "Marca" --accent "#e94560" --heading Borscha --body Rostex
pnpm oc -- make --name "5 errores" --topic "Tu hook de 8 palabras" --points "Uno|Dos|Tres" --cta "Guarda esto" --ratio 4:5
pnpm oc -- slide add <id> --layout hook --title "..." --body "..."
pnpm oc -- slide field <id> <slideId> --title "Nuevo titular"
pnpm oc -- caption <id> --text "..." --hashtags tag1,tag2,tag3
pnpm oc -- export <id> --format png
```

El CLI acepta un brief en **markdown** (o el chat):

```bash
pnpm oc -- compose examples/carousel-brief.md
pnpm oc -- playbook docs/publicacion.md
pnpm oc -- palette <id> --background "#111" --text "#fff" --accent "#e94560"
pnpm oc -- hook variants <id>
pnpm oc -- hook pick <id> 2
```

Layouts: `hook` `setup` `value` `list` `quote` `stat` `summary` `cta`.

HTML de cada slide: `data/slides/<carouselId>/<slideId>.html` (solo body). El preview se actualiza solo.

Reglas de diseño: `.cursor/skills/swipeforge/SKILL.md` y `.cursor/skills/sn-ppt-standard/SKILL.md`. Una idea por slide. Última slide = CTA. Sin copy de IA.

## Cómo publicar

1. **Arco** — 5 a 10 slides. 1 = hook (≤8 palabras). Última = CTA concreto (“Guarda esto”, “Escríbenos”, “Prueba X”).
2. **Revisar** — a mano (preview) y con revisión automática (`pnpm oc -- review <id>` o rail **Revisión**: contraste, padding, hook ≤8 palabras, CTA al final). Zonas seguras: contenido crítico al 80 % central.
3. **Swipe** — vista completa del editor. La slide 1 puede llevar un “desliza →” discreto.
4. **Caption** — 150–300 caracteres: primera línea que para el scroll, una frase de valor, CTA. Tono directo, sin clichés.
5. **Hashtags** — mínimo 3; ideal 8–15. Mezcla alcance alto, medio y nicho. Guárdalos en el carrusel (`pnpm oc -- caption` o el panel Caption).
6. **Export** — PNG (o JPG calidad 90). Una imagen por slide, dimensiones exactas del ratio (4:5 = 1080×1350). El export marca `lastExportAt` y habilita la cola.
7. **Cola** — con caption + export listos: programa fecha (`pnpm oc -- schedule <id> --at "…"` o panel Publicar). Revisa en inicio → **Cola**.
8. **Subir a Instagram** — crear publicación carrusel, pegar las imágenes en orden, pegar caption + hashtags, publicar. Luego `schedule status <id> published`.

Import desde web/Notion/PDF: `pnpm oc -- import <url|file.pdf> --compose` o inicio → **Importar**.

Layouts SwipeForge reutilizables: inicio → **Biblioteca**, o `pnpm oc -- library apply forge-hook-4x5 <id> --add`.

El agente, después de componer, **no se despide**. Pregunta o ejecuta lo que falte: slides, revisión, caption, export, cola, checklist.

## Checklist (no cerrar hasta esto)

- [ ] 5–10 slides
- [ ] Primera = hook
- [ ] Última = CTA
- [ ] Caption guardado
- [ ] ≥ 3 hashtags guardados
- [ ] Zonas seguras / centro 80 % revisados
- [ ] Revisión automática OK (contraste / padding / hook / CTA)
- [ ] Export PNG/JPG hecho
- [ ] En cola / fecha programada (si aplica)
- [ ] Orden de slides listo para swipe

## Caption (formato)

```
Línea gancho.

Una frase de valor.

CTA.

#nicho #marca #tema
```

Guardar:

```bash
pnpm oc -- caption <id> --text "Línea gancho. Valor. CTA." --hashtags nicho,marca,tema
```

## Export

```bash
pnpm oc -- export <id> --format png
pnpm oc -- export <id> --slide <slideId> --format jpg --quality 90 --out slide.jpg
```

Los PNG salen listos para el carrusel de Instagram. El feed 1:1 recorta el centro del 4:5: no pongas el titular pegado al borde.

## Si el servidor está caído

`--file` escribe en `data/` igual. `--json` para leer IDs. `pnpm oc -- doctor` si algo no responde.
