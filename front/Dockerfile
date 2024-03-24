FROM node:lts-alpine AS build

WORKDIR /app
COPY /package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:stable-alpine-slim

COPY --from=build --chown=nginx:nginx /app/build /usr/share/nginx/html
