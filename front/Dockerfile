FROM node:lts-alpine AS build

WORKDIR /app
COPY front/package*.json ./
RUN npm install
COPY front .
RUN npm run build

FROM nginx:stable-alpine-slim

COPY --from=build --chown=nginx:nginx /app/build /usr/share/nginx/html
