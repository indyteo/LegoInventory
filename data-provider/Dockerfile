FROM node:lts-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:lts-alpine

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node

COPY --from=build --chown=node:node /app/build ./

ENTRYPOINT [ "node", "index.js" ]
