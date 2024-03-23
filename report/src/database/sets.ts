import { Set, Color, readDatabaseMany, Category } from "shared";
import { BiggestSets } from "../types";

interface GetBiggestSetsResult {
  s: Set;
  total: number;
  minifigures: number;
  categories: Category[] | null;
  colors: {
    c: Color;
    quantity: number;
    weight: number;
  }[];
}

export async function getBiggestSets(count: number, details: number): Promise<BiggestSets[]> {
  const results = await readDatabaseMany(tx => tx.run<GetBiggestSetsResult>(`
    MATCH (s:Set)<-[:OF_ELEMENT]-(p:Part)<-[:IS_PART]-(:Brick)
    WITH s, sum(p.quantity) AS directBricks
    OPTIONAL MATCH (s)<-[:OF_ELEMENT]-(p1:Part)<-[:IS_PART]-(:Minifigure)<-[:OF_ELEMENT]-(p2:Part)<-[:IS_PART]-(:Brick)
    WITH s, directBricks, sum(p1.quantity * p2.quantity) AS bricksFromMinifigures
    WITH s, directBricks + bricksFromMinifigures AS total ORDER BY total DESC LIMIT toInteger($count)
    OPTIONAL MATCH (s)<-[:OF_ELEMENT]-(p:Part)<-[:IS_PART]-(:Minifigure)
    WITH s, total, sum(p.quantity) AS minifigures
    OPTIONAL MATCH p = (c:Category)<-[:IN_CATEGORY|IS_SUBCATEGORY_OF*]-(s)
    WHERE NOT EXISTS { (c)-[:IS_SUBCATEGORY_OF]->(:Category) }
    WITH s, total, minifigures, nodes(p)[..-1] AS categories
    OPTIONAL MATCH (s:Set)<-[:OF_ELEMENT]-(p:Part)-[:WITH_COLOR]->(c:Color)
    WITH s, total, minifigures, categories, c, sum(p.quantity) AS quantityPerColor ORDER BY quantityPerColor DESC
    WITH s, total, minifigures, categories, collect({ c: c, quantity: quantityPerColor })[..toInteger($details)] AS colors, sum(quantityPerColor) AS totalColor
    RETURN s, total, minifigures, categories, [c IN colors | c { .*, weight: toFloat(c.quantity) / totalColor }] AS colors
  `, { count, details }));
  return results.map(result => {
    let set = result.get("s").properties;
    const total = result.get("total");
    const minifigures = result.get("minifigures");
    const categories = result.get("categories")?.map(c => c.properties) ?? [];
    const colors = result.get("colors");
    return {
      set,
      total,
      minifigures,
      categories,
      colors: colors.map(color => ({
        color: color.c.properties,
        quantity: color.quantity,
        weight: color.weight
      }))
    };
  });
}
