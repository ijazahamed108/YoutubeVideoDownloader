# ---- Frontend build ----
FROM node:20-alpine AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Served from the Express root inside the container.
ENV BASE_PATH=/
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS backend

RUN apk add --no-cache python3 py3-pip ffmpeg \
  && pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ .
COPY --from=frontend-build /app/dist ../dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]
