# Diseno y Brand System - SwipeForge

Sistema de diseño editorial y visual basado en la síntesis del **Estilo Tipográfico Internacional (Modernismo Suizo)** y la tactilidad hiperfuncional de entornos de desarrollo modernos (**Thermal Obsidian Grid**).

---

## 1. Paleta de Colores y Tokens

### Lienzo y Superficies (Obsidian Base)
- **Fondo Primario (`substrate`)**: `#08090D` / `#0C0D12` (Negro obsidiana profundo, absorbe distracciones).
- **Superficie de Paneles (`surface`)**: `#0F1017` / `#12141C` (Superficie base de paneles y barras de herramientas).
- **Contenedores Elevados (`surface-container`)**: `#151620` / `#1A1B24` (Tarjetas interactivas y modales).
- **Bordes Estructurales (`border`)**: `#232736` y líneas traslúcidas `rgba(255, 255, 255, 0.08)`.

### Emisiones Térmicas (Thermal Accents)
- **Acento Primario (Forge Orange)**: `#FF5500` / `#FF7733` (Señal interactiva principal y foco activo).
- **Acento Secundario (Crimson Flame)**: `#D82B6B` / `#FF4071` (Gradientes y estados de validación).
- **Gradiente Térmico de Portada**: `linear-gradient(135deg, #FF5500 0%, #D82B6B 50%, #79154A 100%)`.

### Tipografía y Monocromo
- **Texto Principal en Alto Contraste**: `#FFFFFF` y `#F4F4F7` (Titulares y lectura prioritaria).
- **Texto Secundario y Metadatos**: `#9496A1` (Descripciones y etiquetas secundarias).
- **Guías y Estados Inactivos**: `#4B4F63`.

---

## 2. Tipografías Oficiales

1. **Headlines y Titulares (Space Grotesk)**:
   - Claridad geométrica suiza, tracking condensado para titulares y ganchos editoriales de máximo impacto.
2. **Cuerpo de Texto y UI (Geist)**:
   - Lectura limpia, neutra y balanceada para interfaces y textos extensos.
3. **Metadatos, Badges y Código (JetBrains Mono)**:
   - Estética técnica para ratios (`4:5`, `1:1`, `9:16`), índices de diapositiva, comandos CLI y tokens.
4. **Tipografías Locales Complementarias**:
   - `Borscha` (`BorschaBold`, `BorschaRegular`) y `Rostex` (`RostexRegular`) en `public/fonts/`.

---

## 3. Relaciones de Aspecto

- **4:5 (1080x1350 px)**: Formato nativo recomendado para el feed vertical de Instagram.
- **1:1 (1080x1080 px)**: Formato cuadrado universal.
- **9:16 (1080x1920 px)**: Formato vertical para Stories y Reels.

---

## 4. Márgenes, Grilla y Safe Zones

- **Grilla base**: Módulos e incrementos basados en 8px.
- **Padding interior obligatorio**: Mínimo 80px en diapositivas.
- **Margen superior seguro**: 120px libres de elementos críticos.
- **Margen inferior seguro**: 140px libres para evitar solapamiento con botones de redes sociales.
- **Safe Zone de Recorte 1:1**: El núcleo visual de diapositivas 4:5 debe permanecer centrado para evitar cortes en la cuadrícula del perfil.

---

## 5. Logotipo Oficial

- **Isotipo "The Swiss Monolith"**: Dos pilares constructivistas arquitectónicos en blanco (`#FFFFFF`) y naranja forja (`#FF5500`), con base en `public/logo.svg`.
