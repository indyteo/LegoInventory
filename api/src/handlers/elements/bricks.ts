import { Express, Request } from "express";
import asyncHandler from "express-async-handler";
import { Brick, Color, readDatabaseMany, Element, readDatabaseOne } from "shared";
import { computePaginationParams, PaginatedRequest } from "../pagination";

interface BrickIdParams {
  brickId: string;
}

interface ListBricksResult {
  b: Brick;
  colors: Color[];
}

interface GetBrickResult {
  b: Brick;
  colors: Color[];
  isPartOf: {
    element: Element;
    color: Color | null;
    quantity: number;
  }[];
}

export default function (app: Express): void {
  app.get("/elements/bricks", asyncHandler(async (req: PaginatedRequest, res, next) => {
    const pagination = await computePaginationParams(req, "MATCH (b:Brick) RETURN count(b) AS total");
    if (pagination === null) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      next();
      return;
    }
    const { limit, skip } = pagination;
    const bricks = await readDatabaseMany(tx => tx.run<ListBricksResult>(`
      MATCH (b:Brick)
      WITH b ORDER BY b.name SKIP toInteger($skip) LIMIT toInteger($limit)
      OPTIONAL MATCH (b)-[:PRODUCED_IN]->(c:Color)
      WITH b, c ORDER BY b.name, c.name
      RETURN b, collect(c) AS colors
    `, { limit, skip }));
    res.json(bricks.map(brick => ({
      ...brick.get("b").properties,
      colors: brick.get("colors").map(color => color.properties)
    })));
    next();
  }));

  app.get("/elements/bricks/:brickId", asyncHandler(async (req: Request<BrickIdParams>, res, next) => {
    const id = req.params.brickId;
    const brick = await readDatabaseOne(tx => tx.run<GetBrickResult>(`
      MATCH (b:Brick { id: $id })
      OPTIONAL MATCH (b)-[:PRODUCED_IN]->(c:Color)
      WITH b, c ORDER BY c.name
      WITH b, collect(c) AS colors
      OPTIONAL MATCH (b)-[:IS_PART]->(p:Part)-[:OF_ELEMENT]->(e:Element)
      OPTIONAL MATCH (p)-[:WITH_COLOR]->(c:Color)
      WITH b, colors, e, c, p ORDER BY e.name
      RETURN b, colors, collect({ element: e, color: c, quantity: p.quantity }) AS isPartOf
    `, { id }));
    if (brick === null) {
      res.status(404).json({ error: "Unknown brick" });
      next();
      return;
    }
    res.json({
      ...brick.get("b").properties,
      colors: brick.get("colors").map(color => color.properties),
      isPartOf: brick.get("isPartOf").map(part => ({
        ...part,
        element: {
          ...part.element.properties,
          type: part.element.labels.includes("Set") ? "S" : "M"
        },
        color: part.color?.properties ?? null
      }))
    });
    next();
  }));
}
