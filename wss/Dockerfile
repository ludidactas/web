# Build context = raíz del repo (necesita package.json/lockfile de raíz).
# npm instala (matchea 1:1 el package-lock.json, sin la migración a bun.lock que
# rompe en resolver paquetes con alias @npm: del lockfile); bun solo corre el server.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM oven/bun:1.2.19-slim
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY wss ./wss

ENV NODE_ENV=production

# Documentativo: el puerto real lo decide la env var PORT en runtime (default 3005,
# ver wss/server.ts). Este ARG solo permite que Coolify detecte el puerto correcto
# por instancia si se buildea con --build-arg PORT=<otro>.
ARG PORT=3005
EXPOSE ${PORT}

CMD ["bun", "run", "wss/server.ts"]
