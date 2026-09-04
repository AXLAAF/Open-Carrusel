# Construccion de Software y Calidad de Codigo - SwipeForge

## 1. Directrices de Ingenieria
- **Tipado Fuerte**: Todo el modelo de datos y rutas API se rigen por interfaces TypeScript estrictas (`src/types/`).
- **Prevencion de Bucles Infinitos**: Sustitucion de bucles `while` no acotados por algoritmos deterministas O(1) con conjuntos de sufijos finitos y terminacion matematica garantizada.
- **Reglas de React 19**: Eliminacion total de mutaciones de referencias mutables durante el renderizado y eliminacion de llamadas sincronicas a `setState` en efectos secundarios para prevenir cascading re-renders.
- **Escritura Atomica Segura**: Persistencia mediante archivos temporales `.tmp` y renombrado atomico POSIX protegido por mutex asincronos.

## 2. CLI `oc`
El archivo `scripts/oc.mjs` expone todos los comandos del sistema:
- `npm run oc -- make`: Creacion de carrusel por parametros.
- `npm run oc -- compose`: Compilacion desde brief en Markdown o JSON.
- `npm run oc -- hook variants`: Generacion de 3 opciones de titular de portada.
- `npm run oc -- review`: Auditoria de contraste y accesibilidad WCAG.
- `npm run oc -- export`: Exportacion a PNG o JPG de alta fidelidad.

## 3. Pruebas y Certificacion
- Ejecucion de suite con `npm test`: 23 pruebas unitarias aprobadas.
- Verificacion de linter con `npm run lint`: Cero errores y cero advertencias.
