import { Neo4jStats, runInDatabaseSession, writeDatabase } from "shared";
import { ManagedTransaction } from "neo4j-driver";
import { CatalogItem, Category, Color } from "../types";

export async function createConstraints(): Promise<void> {
  console.group();
  await runInDatabaseSession(async session => {
    console.log("Creating color_id constraint");
    await session.executeWrite((tx: ManagedTransaction) => tx.run("CREATE CONSTRAINT color_id IF NOT EXISTS FOR (c:Color) REQUIRE c.id IS UNIQUE"));
    console.log("Creating category_id constraint");
    await session.executeWrite((tx: ManagedTransaction) => tx.run("CREATE CONSTRAINT category_id IF NOT EXISTS FOR (c:Category) REQUIRE c.id IS UNIQUE"));
    console.log("Creating element_id constraint");
    await session.executeWrite((tx: ManagedTransaction) => tx.run("CREATE CONSTRAINT element_id IF NOT EXISTS FOR (e:Element) REQUIRE e.id IS UNIQUE"));
    console.log("Creating part_id constraint");
    await session.executeWrite((tx: ManagedTransaction) => tx.run("CREATE CONSTRAINT part_id IF NOT EXISTS FOR (p:Part) REQUIRE p.id IS UNIQUE"));
    console.log("Creating inventory_id constraint");
    await session.executeWrite((tx: ManagedTransaction) => tx.run("CREATE CONSTRAINT inventory_id IF NOT EXISTS FOR (i:Inventory) REQUIRE i.id IS UNIQUE"));
  });
  console.groupEnd();
}

export async function createColors(colors: Color[]): Promise<Neo4jStats> {
  return writeDatabase((tx: ManagedTransaction) => tx.run(
    "UNWIND $colors AS color MERGE (c:Color { id: toInteger(color.id) }) SET c.name = color.name, c.value = toInteger(color.value), c.type = color.type",
    { colors }
  ));
}

export async function createCategories(categories: Category[]): Promise<Neo4jStats> {
  return writeDatabase((tx: ManagedTransaction) => tx.run(
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
  return writeDatabase((tx: ManagedTransaction) => tx.run(
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
    CALL apoc.create.addLabels(e, [CASE item.type WHEN "S" THEN "Set" WHEN "M" THEN "Minifigure" END]) YIELD node
    MATCH (c:Category { id: item.category })
    MERGE (e)-[:IN_CATEGORY]->(c)
    WITH e, item
    CALL {
      WITH e
      MATCH (p:Part)-[:OF_ELEMENT]->(e)
      DETACH DELETE p
    }
    CALL {
      WITH e, item
      UNWIND item.bricks AS brick
      MERGE (b:Element:Brick { id: brick.id })
      ON CREATE SET
        b.link = brick.link,
        b.icon = brick.icon,
        b.image = brick.image
      SET
        b.name = brick.name
      CREATE (p:Part { id: apoc.create.uuid() })
      SET p.quantity = toInteger(brick.quantity)
      MERGE (b)-[:IS_PART]->(p)-[:OF_ELEMENT]->(e)
      WITH p, brick, b
      OPTIONAL MATCH (oc:Color { id: brick.color })
      UNWIND oc AS c
      MERGE (p)-[:WITH_COLOR]->(c)
      MERGE (b)-[r:PRODUCED_IN]->(c)
      SET
        r.link = brick.link,
        r.icon = brick.icon,
        r.image = brick.image
    }
    CALL {
      WITH e, item
      UNWIND item.minifigures AS minifigure
      MERGE (m:Element:Minifigure { id: minifigure.id })
      SET
        m.name = minifigure.name,
        m.link = minifigure.link,
        m.icon = minifigure.icon,
        m.image = minifigure.image
      CREATE (p:Part { id: apoc.create.uuid() })
      SET p.quantity = toInteger(minifigure.quantity)
      MERGE (m)-[:IS_PART]->(p)-[:OF_ELEMENT]->(e)
    }
    RETURN e`,
    { items }
  ));
}
