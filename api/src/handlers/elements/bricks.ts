import { Express, Request } from "express";
import asyncHandler from "express-async-handler";
import { Brick, readDatabaseMany } from "shared";
import { computePaginationParams, PaginationQuery } from "../pagination";

export default function (app: Express): void {
  app.get("/elements/bricks", asyncHandler(async (req: Request<any, any, any, PaginationQuery>, res, next) => {
    const pagination = await computePaginationParams(req, "MATCH (b:Brick) RETURN count(b) AS total", {});
    if (pagination === null) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      next();
      return;
    }
    const { limit, skip } = pagination;
    const bricks = await readDatabaseMany(tx => tx.run<{ b: Brick, colors: string[] }>(`
      MATCH (b:Brick)
      WITH b
      ORDER BY b.name
      SKIP toInteger($skip)
      LIMIT toInteger($limit)
      OPTIONAL MATCH (b)-[:PRODUCED_IN]->(c:Color)
      RETURN b, collect(c.name) AS colors
    `, { limit, skip }));
    res.json(bricks.map(brick => ({ ...brick.get("b").properties, colors: brick.get("colors") })));
    next();
  }));
}
