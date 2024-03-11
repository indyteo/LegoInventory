FROM node:lts-alpine AS build

WORKDIR /app/api
COPY api/package*.json ./
RUN npm install
COPY shared ../shared
RUN cd ../shared && npm install && npm run build
COPY api .
RUN npm run build

FROM node:lts-alpine

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node

COPY --from=build --chown=node:node /app/api/build ./

ENTRYPOINT [ "node", "index.js" ]
