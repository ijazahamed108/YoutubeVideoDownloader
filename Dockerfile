# Multi-stage build
FROM node:18-alpine AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS backend

# Install Python and yt-dlp
RUN apk add --no-cache python3 py3-pip ffmpeg
RUN pip3 install yt-dlp

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install

COPY server/ .
COPY --from=frontend-build /app/dist ../dist

EXPOSE 3001

CMD ["npm", "start"]