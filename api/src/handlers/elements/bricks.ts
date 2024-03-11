import { Express } from "express";
import asyncHandler from "express-async-handler";
import { Brick, readDatabase } from "shared";

export default function (app: Express): void {
  app.get("/elements/bricks", asyncHandler(async (req, res, next) => {
    const limit = parseInt((req.query.limit || "10") as string);
    const skip = parseInt((req.query.skip || "0") as string);
    const bricks = await readDatabase(tx => tx.run<{ b: Brick, colors: string[] }>(`
      MATCH (b:Brick)
      WITH b
      ORDER BY b.name
      SKIP toInteger($skip)
      LIMIT toInteger($limit)
      MATCH (b)-[:PRODUCED_IN]->(c:Color)
      RETURN b, collect(c.name) AS colors
    `, { limit, skip }));
    res.json(bricks.map(brick => ({ ...brick.get("b").properties, colors: brick.get("colors") })));
    next();
  }));
}
