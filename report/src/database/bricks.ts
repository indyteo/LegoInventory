import { Brick, Color, PRODUCED_IN, Element, readDatabaseMany } from "shared";
import { MostUsedBrick } from "../types";

interface GetMostUsedBricksResult {
  b: Brick;
  r: PRODUCED_IN | null;
  c: Color | null;
  total: number;
  numberOfElements: number;
  from: {
    e: Element;
    quantity: number;
  }[];
}

export async function getMostUsedBricks(count: number, details: number): Promise<MostUsedBrick[]> {
  const results = await readDatabaseMany(tx => tx.run<GetMostUsedBricksResult>(`
    MATCH (b:Brick)-[:IS_PART]->(p)-[:OF_ELEMENT]->(e:Element)
    OPTIONAL MATCH (p)-[:WITH_COLOR]->(c:Color)
    WITH b, c, p, e ORDER BY p.quantity DESC
    OPTIONAL MATCH (b)-[r:PRODUCED_IN]->(c)
    RETURN
      b, r, c,
      sum(p.quantity) AS total,
      count(e) AS numberOfElements,
      collect({ e: e, quantity: p.quantity })[..toInteger($details)] AS from
    ORDER BY total DESC LIMIT toInteger($count)
  `, { count, details }));
  return results.map(result => {
    let brick = result.get("b").properties;
    const producedInColor = result.get("r");
    if (producedInColor !== null)
      brick = { ...brick, ...producedInColor.properties };
    const color = result.get("c")?.properties ?? null;
    const total = result.get("total");
    const numberOfElements = result.get("numberOfElements");
    const from = result.get("from");
    return {
      brick,
      color,
      total,
      numberOfElements,
      breakdown: {
        from: from.map(f => ({ element: f.e.properties, quantity: f.quantity })),
        remaining: total - from.reduce((t, f) => t + f.quantity, 0)
      }
    };
  });
}
