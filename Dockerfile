# ==========================================
# Etapa 1: Base con Node.js y Chromium
# ==========================================
FROM node:22-bookworm-slim AS base

ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NEXT_TELEMETRY_DISABLED=1

# Instalar Chromium y fuentes para Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-roboto \
    ca-certificates \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ==========================================
# Etapa 2: Dependencias completas
# ==========================================
FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --include=dev

# ==========================================
# Etapa 3: Builder de Next.js
# ==========================================
FROM deps AS builder

WORKDIR /app
COPY . .

# Construir Next.js en producción
RUN npm run build

# ==========================================
# Etapa 4: Runner de Producción
# ==========================================
FROM base AS runner

WORKDIR /app

# Crear directorios de datos y uploads con permisos adecuados
RUN mkdir -p data public/uploads && chown -R node:node /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=node:node /app/scripts ./scripts

USER node

EXPOSE 3000
ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "run", "start"]
