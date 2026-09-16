# Build context = raíz del repo (necesita package.json/lockfile de raíz).
# npm instala (matchea 1:1 el package-lock.json, sin la migración a bun.lock que
# rompe en resolver paquetes con alias @npm: del lockfile); bun solo corre el server.
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM oven/bun:1.2.19-slim
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY wss ./wss

ENV NODE_ENV=production
EXPOSE 3005

CMD ["bun", "run", "wss/server.ts"]
