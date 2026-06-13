# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE=
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV WORKVAULT_API_URL=https://workvault.netlify.app

RUN npm install express@5 http-proxy-middleware@3

COPY --from=build /app/dist ./dist
COPY deploy/server/index.mjs ./server.mjs

EXPOSE 8080
CMD ["node", "server.mjs"]
