import { Neo4jStats, runInDatabaseSession, writeDatabase } from "shared";
import { Session } from "neo4j-driver";
import { CatalogItem, Category, Color } from "../types";

async function createConstraint(session: Session, label: string, id: string): Promise<number> {
  const name = `${label.toLowerCase()}_${id}`;
  console.log(`Creating ${name} constraint`);
  const cypher = `CREATE CONSTRAINT ${name} IF NOT EXISTS FOR (n:${label}) REQUIRE n.${id} IS UNIQUE`;
  const res = await session.executeWrite(tx => tx.run(cypher));
  return res.summary.counters.updates().constraintsAdded;
}

export async function createConstraints(): Promise<number> {
  console.group();
  const constraintsAdded = await runInDatabaseSession(async session => {
    let count = 0;
    for (const label of [ "Color", "Category", "Element", "Part", "Inventory" ])
      count += await createConstraint(session, label, "id");
    return count;
  });
  console.groupEnd();
  return constraintsAdded;
}

export async function createColors(colors: Color[]): Promise<Neo4jStats> {
  return writeDatabase(tx => tx.run(
    "UNWIND $colors AS color MERGE (c:Color { id: toInteger(color.id) }) SET c.name = color.name, c.value = toInteger(color.value), c.type = color.type",
    { colors }
  ));
}

export async function createCategories(categories: Category[]): Promise<Neo4jStats> {
  return writeDatabase(tx => tx.run(
    `UNWIND $categories AS category
    MERGE (cat:Category { id: category.id })
    SET
      cat.name = category.name,
      cat.link = category.link
    // Create relationship with parent category if applicable
    WITH cat, category
    CALL apoc.do.when(
      category.parent IS NOT NULL,
      "MERGE (parent:Category { id: parentId })
      MERGE (cat)-[:IS_SUBCATEGORY_OF]->(parent)",
      "",
      { cat: cat, parentId: category.parent }
    ) YIELD value
    RETURN cat`,
    { categories }
  ));
}

export async function createCatalogItem(item: CatalogItem): Promise<Neo4jStats> {
  return createCatalogItems([ item ]);
}

export async function createCatalogItems(items: CatalogItem[]): Promise<Neo4jStats> {
  return writeDatabase(tx => tx.run(
    `UNWIND $items AS item
    MERGE (e:Element { id: item.id })
    SET
      e.name = item.name,
      e.link = item.link,
      e.icon = item.icon,
      e.image = item.image,
      e.instructions = item.instructions,
      e.source = item.source
    WITH e, item
    // Add label depending on item type
    CALL apoc.create.addLabels(e, [CASE item.type WHEN "S" THEN "Set" WHEN "M" THEN "Minifigure" END]) YIELD node
    CALL {
      WITH e, item
      MATCH (c:Category { id: item.category })
      MERGE (e)-[:IN_CATEGORY]->(c)
    }
    // Delete parts previously associated with element
    CALL {
      WITH e
      MATCH (p:Part)-[:OF_ELEMENT]->(e)
      DETACH DELETE p
    }
    // Create bricks parts
    CALL {
      WITH e, item
      UNWIND item.bricks AS brick
      MERGE (b:Element:Brick { id: brick.id })
      ON CREATE SET // Only set those properties on brick creation
        b.link = brick.link,
        b.icon = brick.icon,
        b.image = brick.image
      SET
        b.name = brick.name
      CREATE (p:Part { id: apoc.create.uuid() }) // Part will receive a random ID
      SET p.quantity = toInteger(brick.quantity)
      MERGE (b)-[:IS_PART]->(p)-[:OF_ELEMENT]->(e)
      WITH p, brick, b
      // Optionally link part with color
      OPTIONAL MATCH (oc:Color { id: brick.color }) // oc is null if color not found
      UNWIND oc AS c // UNWIND null is equivalent to UNWIND []
      MERGE (p)-[:WITH_COLOR]->(c)
      // Save link, icon and image in relationship between brick and color directly
      MERGE (b)-[r:PRODUCED_IN]->(c)
      SET
        r.link = brick.link,
        r.icon = brick.icon,
        r.image = brick.image
    }
    // Create minifigures parts
    CALL {
      WITH e, item
      UNWIND item.minifigures AS minifigure
      MERGE (m:Element:Minifigure { id: minifigure.id })
      SET
        m.name = minifigure.name,
        m.link = minifigure.link,
        m.icon = minifigure.icon,
        m.image = minifigure.image
      CREATE (p:Part { id: apoc.create.uuid() }) // Part will receive a random ID
      SET p.quantity = toInteger(minifigure.quantity)
      MERGE (m)-[:IS_PART]->(p)-[:OF_ELEMENT]->(e)
    }
    RETURN e`,
    { items }
  ));
}
