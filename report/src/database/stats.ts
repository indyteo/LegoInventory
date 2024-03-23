import { readDatabaseOne } from "shared";
import { GeneralStats } from "../types";

export async function getGeneralStats(): Promise<GeneralStats> {
  const stats = await readDatabaseOne(tx => tx.run<GeneralStats>(`
    MATCH (b:Brick)
    WITH count(b) AS bricks
    MATCH (c:Color)<-[:PRODUCED_IN]-(:Brick)
    WITH bricks, count(DISTINCT c) AS colors
    MATCH (m:Minifigure)
    WITH bricks, colors, count(m) AS minifigures
    MATCH (s:Set)
    WITH bricks, colors, minifigures, count(s) AS sets
    MATCH (c:Category)<-[:IN_CATEGORY|IS_SUBCATEGORY_OF*]-(:Element)
    WITH bricks, colors, minifigures, sets, count(DISTINCT c) AS categories
    MATCH (i:Inventory)
    RETURN bricks, colors, minifigures, sets, categories, count(i) AS inventories
  `));
  return stats!.toObject();
}
