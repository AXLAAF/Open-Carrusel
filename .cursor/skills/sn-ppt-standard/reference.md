# Diseño anti-IA (Vercel + Frontend Design, adaptado a slides)

Referencia compacta. Las slides de SwipeForge no son UI interactiva: aplica jerarquía, tipo, color y espacio. Ignora focus rings, forms y hover.

## Tipografía

- Familias de marca: `"Borscha"`, `"BorschaBold"`, `"Rostex"`, `"RostexRegular"`.
- Si el brand pide Google Font, elige una con carácter (no Inter / Roboto / Poppins / Montserrat / Open Sans).
- Una familia para título, otra para cuerpo. Nunca tres.
- Títulos: `text-wrap: balance`, tracking ligeramente negativo en display (−0.02em a −0.04em).
- Cuerpo: line-height 1.35–1.5. No justified.
- Comillas `“ ”`, ellipsis `…`, no `...`.
- Comparar números: `font-variant-numeric: tabular-nums`.

## Color

- 90% neutros (fondo + tinta). 10% acento.
- Acento = brand.accent o un solo tono. No púrpura #7C3AED, no cyan neon, no gold foil.
- Fondos: sólido o un bloque geométrico plano. No mesh, no aurora, no photo overlay al 40%.
- Contraste: texto/fondo > 4.5:1 (mejor, percepción APCA: tinta casi negra sobre casi blanco, o al revés).
- Tintar bordes hacia el matiz del fondo. Nada de gris frío sobre beige cálido.

## Espacio y jerarquía

- Grilla 8px. Padding exterior 80–120px.
- Un eje: izquierda o centro, no mezclar al azar.
- Título grande. Cuerpo pequeño. Un label 12–14px uppercase + letter-spacing si hace falta contexto.
- No centrar un muro de texto. El gancho puede ser enorme y asimétrico.
- Nested radius: si hay un recuadro, radio hijo ≤ padre. Radios chicos (8–16px), no 40px “pill cards” en todo.

## Layout editable

```html
<section class="forge-slide" style="...flex column, padding, solid bg">
  <p class="label">contexto corto</p>
  <h1 class="forge-title">Tesis en ≤8 palabras</h1>
  <p class="forge-body">Una frase que la sostiene.</p>
</section>
```

Mal: 4 columnas de iconos, gradient overlay, texto en `<text>` SVG, `background-image` decorativa, 12 `position:absolute`.

## Anti-patrones (IA slop)

- Inter + purple gradient + rounded cards + fake 3D
- “3 pilares” con iconos genéricos
- Viñetas que empiezan todas igual (“Mejorar…”, “Impulsar…”, “Optimizar…”)
- Foto stock de handshake / laptop / cohete
- Sombra `0 25px 50px rgba(0,0,0,.25)` en cada caja
