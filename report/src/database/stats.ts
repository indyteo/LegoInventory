import { readDatabaseOne } from "shared";
import { GeneralStats } from "../types";

export async function getGeneralStats(): Promise<GeneralStats> {
  const stats = await readDatabaseOne(tx => tx.run<GeneralStats>(`
    OPTIONAL MATCH (b:Brick)
    WITH count(b) AS bricks
    OPTIONAL MATCH (c:Color)<-[:PRODUCED_IN]-(:Brick)
    WITH bricks, count(DISTINCT c) AS colors
    OPTIONAL MATCH (m:Minifigure)
    WITH bricks, colors, count(m) AS minifigures
    OPTIONAL MATCH (s:Set)
    WITH bricks, colors, minifigures, count(s) AS sets
    OPTIONAL MATCH (c:Category)<-[:IN_CATEGORY|IS_SUBCATEGORY_OF*]-(:Element)
    WITH bricks, colors, minifigures, sets, count(DISTINCT c) AS categories
    OPTIONAL MATCH (i:Inventory)
    RETURN bricks, colors, minifigures, sets, categories, count(i) AS inventories
  `));
  return stats!.toObject();
}
