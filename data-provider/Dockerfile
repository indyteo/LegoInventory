FROM node:lts-alpine AS build

WORKDIR /app/data-provider
COPY data-provider/package*.json ./
RUN npm install
COPY shared ../shared
RUN cd ../shared && npm install && npm run build
COPY data-provider .
RUN npm run build

FROM node:lts-alpine

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node

COPY --from=build --chown=node:node /app/data-provider/build ./

ENTRYPOINT [ "node", "index.js" ]
