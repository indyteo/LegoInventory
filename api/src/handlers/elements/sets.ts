import { Express, Request } from "express";
import asyncHandler from "express-async-handler";
import { Brick, Color, Minifigure, Set, readDatabaseMany, readDatabaseOne, PRODUCED_IN } from "shared";
import { computePaginationParams, PaginatedRequest } from "../pagination";

interface SetIdParams {
  setId: string;
}

interface ListSetsResult {
  s: Set;
  minifigures: number;
  pieces: number;
}

interface GetSetResult {
  s: Set;
  minifigures: {
    minifigure: Minifigure;
    quantity: number;
  }[];
  pieces: {
    brick: Brick;
    r: PRODUCED_IN | null;
    color: Color | null;
    quantity: number;
  }[];
}

export default function (app: Express): void {
  app.get("/elements/sets", asyncHandler(async (req: PaginatedRequest, res, next) => {
    const pagination = await computePaginationParams(req, "MATCH (s:Set) RETURN count(s) AS total");
    if (pagination === null) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      next();
      return;
    }
    const { limit, skip } = pagination;
    const sets = await readDatabaseMany(tx => tx.run<ListSetsResult>(`
      MATCH (s:Set)
      WITH s ORDER BY s.name SKIP toInteger($skip) LIMIT toInteger($limit)
      OPTIONAL MATCH (s)<-[:OF_ELEMENT]-(p:Part)<-[:IS_PART]-(:Minifigure)
      WITH s, sum(p.quantity) AS minifigures
      OPTIONAL MATCH (s)<-[:OF_ELEMENT]-(p:Part)<-[:IS_PART]-(:Brick)
      RETURN s, minifigures, sum(p.quantity) AS pieces
    `, { limit, skip }));
    res.json(sets.map(set => ({
      ...set.get("s").properties,
      minifigures: set.get("minifigures"),
      pieces: set.get("pieces")
    })));
    next();
  }));

  app.get("/elements/sets/:setId", asyncHandler(async (req: Request<SetIdParams>, res, next) => {
    const id = req.params.setId;
    const set = await readDatabaseOne(tx => tx.run<GetSetResult>(`
      MATCH (s:Set { id: $id })
      WITH s, COLLECT {
        MATCH (s)<-[:OF_ELEMENT]-(p:Part)<-[:IS_PART]-(m:Minifigure)
        RETURN { minifigure: m, quantity: p.quantity } ORDER BY m.name
      } AS minifigures
      OPTIONAL MATCH (s)<-[:OF_ELEMENT]-(p:Part)<-[:IS_PART]-(b:Brick)
      OPTIONAL MATCH (p)-[:WITH_COLOR]->(c:Color)
      OPTIONAL MATCH (b)-[r:PRODUCED_IN]->(c)
      WITH s, minifigures, b, r, c, p ORDER BY c.name, b.name
      RETURN s, minifigures, collect({ brick: b, r: r, color: c, quantity: p.quantity }) AS pieces
    `, { id }));
    if (set === null) {
      res.status(404).json({ error: "Unknown set" });
      next();
      return;
    }
    res.json({
      ...set.get("s").properties,
      minifigures: set.get("minifigures").map(minifigure => ({
        ...minifigure,
        minifigure: minifigure.minifigure.properties
      })),
      pieces: set.get("pieces").map(piece => ({
        brick: { ...piece.brick.properties, ...piece.r?.properties },
        color: piece.color?.properties ?? null,
        quantity: piece.quantity
      }))
    });
    next();
  }));
}
