# ===== Etapa 1: Build =====
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:frontend && npm run build:backend

# ===== Etapa 2: Produccion =====
FROM node:22-alpine

RUN apk add --no-cache curl

RUN addgroup -g 1001 astrobet && \
    adduser -u 1001 -G astrobet -s /bin/sh -D astrobet

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY firebase-applet-config.json ./

RUN chown -R astrobet:astrobet /app

USER astrobet

ENV NODE_ENV=production
ENV SERVE_STATIC=true
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
