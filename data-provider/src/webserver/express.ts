import express from "express";
import asyncHandler from "express-async-handler";
import { ElementType, elementTypeDisplay, isElementType } from "../types";
import { recursivelyFetchCatalogItems } from "../scraping/bricklink";
import { createCatalogItems } from "../database/neo4j";

interface ElementTypeAndId {
  elementType: ElementType;
  id: string;
}

export function startWebServer(port: number) {
  const app = express();

  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.group();
    next();
  });

  app.get("/", (_req, res) => {
    res.sendStatus(200);
  });

  app.param("elementType", (_req, res, next, value) => {
    if (isElementType(value))
      next();
    else
      res.sendStatus(400);
  });

  app.post("/element/:elementType/:id", asyncHandler(async (req: express.Request<ElementTypeAndId>, res, next) => {
    console.log(`Fetching requested ${elementTypeDisplay[req.params.elementType]} ${req.params.id}`);
    const items = await recursivelyFetchCatalogItems({ type: req.params.elementType, id: req.params.id });
    if (items.length === 0) {
      console.log("Requested item not found");
      res.sendStatus(404);
    } else {
      console.log(`Found requested item and scraped ${items.length} elements`);
      console.log("Creating elements");
      const stats = await createCatalogItems(items);
      console.log(`Created ${stats.nodesCreated} nodes and ${stats.relationshipsCreated} relationships`);
      res.sendStatus(200);
    }
    next();
  }));

  app.use((_req, _res, next) => {
    console.groupEnd();
    next();
  });

  app.listen(port, () => {
    console.log(`DataProvider web server listening on port ${port}`);
  });
}
