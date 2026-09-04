# Despliegue en Produccion y Operacion - OpenCarrusel

## 1. Despliegue con Docker
Se incluye un `Dockerfile` multi-etapa con Node 22 slim y Chromium headless preinstalado:

```bash
# Iniciar servicios con docker-compose
docker compose up -d --build

# Ver logs en vivo
docker compose logs -f
```

## 2. Despliegue Nativo en Servidor Linux (PM2)
```bash
# Instalar y compilar
npm ci
npm run build

# Iniciar proceso de produccion
pm2 start npm --name "open-carrusel" --max-memory-restart 1024M -- start
pm2 save
```

## 3. Optimizaciones Criticas para Produccion
- **PUPPETEER_EXECUTABLE_PATH**: Permite usar el Chromium del sistema reduciendo el tamano de la imagen Docker en 300MB.
- **Flags `--disable-dev-shm-usage` y `--no-zygote`**: Evitan fallos por agotamiento de memoria compartida en contenedores.
- **next start vs next dev**: Siempre utilizar `next start` en servidores para reducir el uso de RAM de 700MB a menos de 100MB y evitar picos de CPU del compilador Turbopack.
