# Imagen del servicio de API. Render puede usar buildCommand/startCommand
# (ver render.yaml) o este Dockerfile. Se deja como alternativa para
# despliegues con contenedor propio.
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /srv

# Dependencias primero para aprovechar la cache de capas.
COPY backend/package.json backend/package-lock.json* ./backend/
RUN npm --prefix backend ci --omit=dev

# Codigo y esquema (las migraciones viven en database/).
COPY backend ./backend
COPY database ./database

ENV MIGRATIONS_DIR=/srv/database/migrations \
    SEED_FILE=/srv/database/seed.sql

EXPOSE 3000
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/src/server.js"]
