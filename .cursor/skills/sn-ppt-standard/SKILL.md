---
name: sn-ppt-standard
description: >-
  Genera estructuras de negocios y diapositivas lógicas que priorizan elementos
  limpios y editables en lugar de imágenes infladas o bloques difíciles de
  modificar. Use when designing SwipeForge slides, carousels, Instagram ads,
  pitch decks, or any presentation HTML so output does not look AI-generated.
---

# sn-ppt-standard

Una skill enfocada en generar estructuras de negocios y diapositivas lógicas que priorizan elementos limpios y editables en lugar de imágenes infladas o bloques difíciles de modificar en PowerPoint.

Léela **siempre** al crear o editar slides. Combínala con `.cursor/skills/swipeforge/SKILL.md`.

## Estructura basada en significado

Diseña diapositivas enfocadas en un solo concepto clave por lámina, evitando exceso de texto y viñetas aburridas.

- 1 idea = 1 slide. Si hay dos mensajes, son dos slides.
- Arco de negocio (5–8 láminas): gancho → tensión → insight → prueba → acción.
- El título es la tesis, no una etiqueta. El cuerpo (si existe) es una frase, no un párrafo.
- Máximo 3 líneas de texto además del título. Cero listas de 5+ bullets.
- Números concretos > adjetivos. Un dato gana a tres viñetas.

## Elementos limpios y editables

Las slides son HTML de cuerpo. El usuario las va a editar a mano.

- Texto real en `<h1>`, `<p>`, `<span>`. Nunca texto metido en SVG, imagen o canvas.
- Layout con flex/grid y padding. Evita `position: absolute` salvo un acento (número, tag).
- Sin fotos stock, blobs 3D, orbes, mesh gradients, glassmorphism, ni collages.
- Sin “cards” clonadas (6 iconos iguales). Si hay módulos, máximo 3, cada uno con un hecho.
- Un acento visual por slide (número enorme, regla, o bloque de color), no diez.

## Diseño (Vercel Web Interface Guidelines / Frontend Design)

Úsalas como referencia de diseño para evitar la tipografía y los colores genéricos típicos de la IA, aplicando estándares estrictos de jerarquía visual, espacio y paletas sobrias.

Detalle en [reference.md](reference.md). Resumen:

- Tipografía de marca: `Borscha` / `Rostex`. No Inter, Roboto, Arial, Poppins, Montserrat, ni system-ui salvo que el brand lo pida.
- Escala fija por carrusel: título 56–88px, cuerpo 22–28px. Máximo 2 familias.
- Paleta sobria: fondo + tinta + 1 acento. Sin púrpura-on-white, sin rainbow, sin glow.
- Espacio en grilla de 8px. Padding ≥ 80px. Aire > relleno.
- Contraste alto. `text-wrap: balance` en títulos. Comillas tipográficas. Números con `tabular-nums` si comparas cifras.
- Sólidos > degradados. Si hay borde, 1px semitransparente, no sombra suave de 40px.

## Lenguaje humano

Tono casual y directo. Habla como una persona que sabe del tema, no como un deck corporativo.

Prohibido (y equivalentes EN/ES):

- “en el panorama actual”, “en un mundo donde”, “es crucial destacar”
- “revolucionario”, “profundo”, “transformador”, “innovador”, “disruptivo”
- “desbloquea”, “potencia”, “sinergia”, “elevar”, “impulsar el siguiente nivel”
- “descubre cómo”, “el secreto que”, “nunca más”, “sumérgete”
- EN: “delve”, “leverage”, “unlock”, “game-changing”, “seamless”, “cutting-edge”, “empower”, “in today’s landscape”

En su lugar: verbo concreto, sujeto claro, cero relleno. “Cortamos el ciclo a 4 días.” no “Optimizamos de forma revolucionaria el time-to-value.”

## Checklist antes de guardar el HTML

- [ ] Un concepto. Título = tesis.
- [ ] Texto editable (no imagen).
- [ ] Sin clichés. Sin Inter/Poppins. Sin gradient purple.
- [ ] Padding ≥ 80px. Contraste legible.
- [ ] Última slide = CTA concreto (“Guarda esto”, “Escríbenos”, “Prueba X”).
