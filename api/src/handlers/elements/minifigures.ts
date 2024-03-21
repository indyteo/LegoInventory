import { Express, Request } from "express";
import asyncHandler from "express-async-handler";
import { Brick, Color, Minifigure, Set, readDatabaseMany, readDatabaseOne } from "shared";
import { computePaginationParams, PaginationQuery } from "../pagination";

interface MinifigureIdParams {
  minifigureId: string;
}

interface ListMinifiguresResult {
  m: Minifigure;
  pieces: number;
}

interface GetMinifigureResult {
  m: Minifigure;
  pieces: {
    brick: Brick;
    color: Color | null;
    quantity: number;
  }[];
  isPartOf: {
    set: Set;
    quantity: number;
  }[];
}

export default function (app: Express): void {
  app.get("/elements/minifigures", asyncHandler(async (req: Request<any, any, any, PaginationQuery>, res, next) => {
    const pagination = await computePaginationParams(req, "MATCH (m:Minifigure) RETURN count(m) AS total");
    if (pagination === null) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      next();
      return;
    }
    const { limit, skip } = pagination;
    const minifigures = await readDatabaseMany(tx => tx.run<ListMinifiguresResult>(`
      MATCH (m:Minifigure)
      WITH m ORDER BY m.name SKIP toInteger($skip) LIMIT toInteger($limit)
      MATCH (m)<-[:OF_ELEMENT]-(p:Part)
      RETURN m, sum(p.quantity) AS pieces
    `, { limit, skip }));
    res.json(minifigures.map(minifigure => ({
      ...minifigure.get("m").properties,
      pieces: minifigure.get("pieces")
    })));
    next();
  }));

  app.get("/elements/minifigures/:minifigureId", asyncHandler(async (req: Request<MinifigureIdParams, any, any, PaginationQuery>, res, next) => {
    const id = req.params.minifigureId;
    const minifigure = await readDatabaseOne(tx => tx.run<GetMinifigureResult>(`
      MATCH (m:Minifigure { id: $id })
      OPTIONAL MATCH (m)<-[:OF_ELEMENT]-(p:Part)<-[:IS_PART]-(b:Brick)
      OPTIONAL MATCH (p)-[:WITH_COLOR]->(c:Color)
      WITH m, p, b, c ORDER BY c.name, b.name
      WITH m, collect({ brick: b, color: c, quantity: p.quantity }) AS pieces
      OPTIONAL MATCH (m)-[:IS_PART]->(p:Part)-[:OF_ELEMENT]-(s:Set)
      WITH m, pieces, p, s ORDER BY s.name
      RETURN m, pieces, collect({ set: s, quantity: p.quantity }) AS isPartOf
    `, { id }));
    if (minifigure === null) {
      res.status(404).json({ error: "Unknown minifigure" });
      next();
      return;
    }
    res.json({
      ...minifigure.get("m").properties,
      pieces: minifigure.get("pieces").map(piece => ({
        ...piece,
        brick: piece.brick.properties,
        color: piece.color?.properties ?? null
      })),
      isPartOf: minifigure.get("isPartOf").map(part => ({
        ...part,
        set: part.set.properties
      }))
    });
    next();
  }));
}
