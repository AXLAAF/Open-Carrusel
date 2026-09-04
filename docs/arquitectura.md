# Arquitectura del Sistema - SwipeForge

## 1. Vision Arquitectonica
SwipeForge es un sistema desacoplado para la creacion, edicion y exportacion de carruseles editoriales para redes sociales. Esta disenado para operar bajo alta concurrencia local o en servidor, garantizando consumo minimo de memoria y CPU.

```mermaid
flowchart TB
    subgraph Frontend["Frontend / Cliente"]
        UI["Next.js 16 + React 19 UI"]
        Preview["Lienzo Aislado (iframe sandbox)"]
        DnD["Tira dnd-kit"]
    end

    subgraph Backend["API & Servicios"]
        Routes["App Router /api/*"]
        ETag["ETag & Cache 304"]
        SSE["Chat SSE Stream"]
    end

    subgraph Core["Motores de Negocio"]
        Compose["Motor de Composicion"]
        Hooks["Generador Hooks A/B (O(1))"]
        ExportEngine["Puppeteer Headless + Sharp"]
        Review["Auditoria WCAG Contraste"]
    end

    subgraph Storage["Persistencia"]
        Mutex["async-mutex"]
        DataJSON["data/*.json"]
        SlideHTML["data/slides/:id/:slide.html"]
    end

    Frontend --> Backend
    Backend --> Core
    Core --> Storage
```

## 2. Componentes Clave
- **Next.js 16 & React 19**: App Router, compilacion optimizada y eliminacion de cascading re-renders.
- **async-mutex**: Gestion de bloqueos para escrituras atomicas concurrentes (`safeWrite`).
- **Puppeteer Headless**: Generacion de capturas de pantalla de alta fidelidad con aislamiento de procesos y flags de ahorro de memoria (`--disable-dev-shm-usage`, `--no-zygote`).
- **Sharp & Archiver**: Optimizacion de buffers de imagen y empaquetado en archivos ZIP comprimidos.
