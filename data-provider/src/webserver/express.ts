import express, { Request } from "express";
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

  app.get("/", (_req, res, next) => {
    // res.sendStatus(200);
    res.status(200).contentType("text/html").send(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <title>Add element</title>
        </head>
        <body>
          <form method="post" id="form">
            <select name="type" required>
              <option value="S">Set</option>
              <option value="M">Minifigure</option>
            </select>
            <input type="text" name="id" placeholder="ID" required />
            <input type="submit" />
          </form>
          <script>
            const form = document.getElementById("form");
            form.addEventListener("submit", () => {
              form.setAttribute("action", \`/element/\${form.elements["type"].value}/\${form.elements["id"].value}\`);
            })
          </script>
        </body>
      </html>
    `);
    next();
  });

  app.param("elementType", (_req, res, next, value) => {
    if (isElementType(value))
      next();
    else
      res.sendStatus(400);
  });

  app.post("/element/:elementType/:id", asyncHandler(async (req: Request<ElementTypeAndId>, res, next) => {
    const { elementType: type, id } = req.params;
    console.log(`Fetching requested ${elementTypeDisplay[type]} ${id}`);
    const items = await recursivelyFetchCatalogItems({ type, id });
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
