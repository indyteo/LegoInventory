import { Express, Request } from "express";
import asyncHandler from "express-async-handler";
import {
  Element,
  readDatabaseMany,
  readDatabaseOne,
  Inventory,
  Category,
  writeReadDatabase,
  IN_INVENTORY,
  writeDatabase,
  Minifigure,
  Brick,
  Color,
  Set, PRODUCED_IN
} from "shared";
import { computePaginationParams, PaginatedRequest } from "./pagination";

interface CreateInventory {
  name: string;
}

interface InventoryIdParams {
  inventoryId: string;
}

interface AddInventoryContent {
  elementId: string;
}

interface InventoryIdAndElementIdParams extends InventoryIdParams {
  elementId: string;
}

interface DeleteInventoryContent {
  all: boolean;
}

interface ListInventoriesResult {
  i: Inventory;
  sets: number;
  minifigures: number;
}

interface CreateInventoryResult {
  i: Inventory;
}

interface GetInventoryResult {
  i: Inventory;
  content: {
    element: Element;
    quantity: number;
    since: Date;
  }[];
  categories: {
    category: Category;
    parent: Category["properties"]["id"];
    weight: number;
  }[];
}

interface GetInventoryMinifiguresResult {
  m: Minifigure;
  quantity: number;
  from: {
    set: Set["properties"]["id"] | null;
    quantity: number;
  }[];
}

interface GetInventoryBricksResult {
  b: Brick;
  r?: PRODUCED_IN;
  c?: Color;
  quantity: number;
  from: {
    element: Element["properties"]["id"];
    type: "S" | "M";
    quantity: number;
  }[];
}

interface AddInventoryContentResult {
  i: Inventory;
  e: Element;
  r: IN_INVENTORY;
}

export default function (app: Express): void {
  app.get("/inventories", asyncHandler(async (req: PaginatedRequest, res, next) => {
    const pagination = await computePaginationParams(req, "MATCH (i:Inventory) RETURN count(i) AS total");
    if (pagination === null) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      next();
      return;
    }
    const { limit, skip } = pagination;
    const inventories = await readDatabaseMany(tx => tx.run<ListInventoriesResult>(`
      MATCH (i:Inventory)
      WITH i ORDER BY i.name SKIP toInteger($skip) LIMIT toInteger($limit)
      OPTIONAL MATCH (i)<-[r:IN_INVENTORY]-(:Set)
      WITH i, sum(r.quantity) AS sets
      OPTIONAL MATCH (i)<-[r:IN_INVENTORY]-(:Minifigure)
      RETURN i, sets, sum(r.quantity) AS minifigures
    `, { limit, skip }));
    res.json(inventories.map(inventory => ({
      ...inventory.get("i").properties,
      sets: inventory.get("sets"),
      minifigures: inventory.get("minifigures")
    })));
    next();
  }));

  app.post("/inventories", asyncHandler(async (req: Request<never, any, CreateInventory>, res, next) => {
    const name = req.body.name;
    const result = await writeReadDatabase(tx => tx.run<CreateInventoryResult>(`
      CREATE (i:Inventory { id: randomUUID() })
      SET i.name = $name
      RETURN i
    `, { name }));
    if (result.records.length === 0) {
      res.status(500).json({ error: "Failed to create inventory" });
      next();
      return;
    }
    res.status(201).send({ ...result.records[0].get("i").properties });
    next();
  }));

  app.get("/inventories/:inventoryId", asyncHandler(async (req: Request<InventoryIdParams>, res, next) => {
    const id = req.params.inventoryId;
    const inventory = await readDatabaseOne(tx => tx.run<GetInventoryResult>(`
      MATCH (i:Inventory { id: $id })
      WITH i, COLLECT {
        MATCH (i)<-[r:IN_INVENTORY]-(e:Element)
        RETURN r { element: e, .quantity, .since } ORDER BY e.name
      } AS content
      WITH i, content, reduce(acc = 0, element IN content | acc + element.quantity) AS numberOfElements
      RETURN i, content, COLLECT {
        MATCH (c:Category)<-[:IN_CATEGORY|IS_SUBCATEGORY_OF*]-(:Element)-[r:IN_INVENTORY]->(i)
        WITH c, sum(r.quantity) AS total ORDER BY total DESC
        OPTIONAL MATCH (c)-[:IS_SUBCATEGORY_OF]->(p:Category)
        RETURN { category: c, parent: p.id, weight: toFloat(total) / numberOfElements }
      } AS categories
    `, { id }));
    if (inventory === null) {
      res.status(404).json({ error: "Unknown inventory" });
      next();
      return;
    }
    res.json({
      ...inventory.get("i").properties,
      content: inventory.get("content").map(content => ({
        ...content,
        element: {
          ...content.element.properties,
          type: content.element.labels.includes("Set") ? "S" : "M"
        }
      })),
      categories: inventory.get("categories").map(category => ({
        ...category,
        category: category.category.properties
      }))
    });
    next();
  }));

  app.get("/inventories/:inventoryId/minifigures", asyncHandler(async (req: PaginatedRequest<InventoryIdParams>, res, next) => {
    const id = req.params.inventoryId;
    const pagination = await computePaginationParams(req, `
      MATCH (i:Inventory { id: $id })
      MATCH (i)<-[:IN_INVENTORY]-(m:Minifigure)
      WITH i, collect(m) AS direct
      MATCH (i)<-[:IN_INVENTORY]-(:Set)<-[:OF_ELEMENT]-(:Part)<-[:IS_PART]-(m:Minifigure)
      WITH direct, collect(m) AS fromSets
      UNWIND direct + fromSets AS m
      RETURN count(DISTINCT m) AS total
    `, { id });
    if (pagination === null) {
      res.status(400).json({ error: "Unknown inventory or invalid pagination parameters" });
      next();
      return;
    }
    const { limit, skip } = pagination;
    const minifigures = await readDatabaseMany(tx => tx.run<GetInventoryMinifiguresResult>(`
      MATCH (i:Inventory { id: $id })
      CALL {
        WITH i
        MATCH (i)<-[r:IN_INVENTORY]-(m:Minifigure)
        RETURN m, r.quantity AS quantity, [{ element: null, quantity: r.quantity }] AS from
        UNION ALL
        WITH i
        MATCH (i)<-[r:IN_INVENTORY]-(s:Set)<-[:OF_ELEMENT]-(p:Part)<-[:IS_PART]-(m:Minifigure)
        RETURN m, sum(r.quantity * p.quantity) AS quantity, collect({ element: s.id, quantity: r.quantity * p.quantity }) AS from
      }
      RETURN m, sum(quantity) AS quantity, apoc.coll.flatten(collect(from)) AS from ORDER BY m.name SKIP toInteger($skip) LIMIT toInteger($limit)
    `, { id, limit, skip }));
    res.json(minifigures.map(minifigure => ({
      ...minifigure.get("m").properties,
      quantity: minifigure.get("quantity"),
      from: minifigure.get("from")
    })));
    next();
  }));

  app.get("/inventories/:inventoryId/bricks", asyncHandler(async (req: PaginatedRequest<InventoryIdParams>, res, next) => {
    const id = req.params.inventoryId;
    const pagination = await computePaginationParams(req, `
      MATCH (i:Inventory { id: $id })
      MATCH (i)<-[:IN_INVENTORY]-(:Element)<-[:OF_ELEMENT|IS_PART*]-(p:Part)<-[:IS_PART]-(b:Brick)
      OPTIONAL MATCH (p)-[:WITH_COLOR]->(c:Color)
      WITH DISTINCT b, c
      RETURN count(*) AS total
    `, { id });
    if (pagination === null) {
      res.status(400).json({ error: "Unknown inventory or invalid pagination parameters" });
      next();
      return;
    }
    const { limit, skip } = pagination;
    const bricks = await readDatabaseMany(tx => tx.run<GetInventoryBricksResult>(`
      MATCH (i:Inventory { id: $id })
      CALL {
        WITH i
        MATCH (i)<-[r:IN_INVENTORY]-(e:Element)<-[:OF_ELEMENT]-(p:Part)<-[:IS_PART]-(b:Brick)
        OPTIONAL MATCH (p)-[:WITH_COLOR]->(c:Color)
        WITH b, c, e, r.quantity * p.quantity AS quantity
        RETURN b, c, sum(quantity) AS quantity, collect({ element: e.id, type: CASE WHEN e:Set THEN "S" ELSE "M" END, quantity: quantity }) AS from
        UNION ALL
        WITH i
        MATCH (i)<-[r:IN_INVENTORY]-(:Set)<-[:OF_ELEMENT]-(p1:Part)<-[:IS_PART]-(m:Minifigure)<-[:OF_ELEMENT]-(p2:Part)<-[:IS_PART]-(b:Brick)
        OPTIONAL MATCH (p2)-[:WITH_COLOR]->(c:Color)
        WITH b, c, m, r.quantity * p1.quantity * p2.quantity AS quantity
        RETURN b, c, sum(quantity) AS quantity, collect({ element: m.id, type: "M", quantity: quantity }) AS from
      }
      WITH b, c, sum(quantity) AS quantity, apoc.coll.flatten(collect(from)) AS from ORDER BY c.name, b.name SKIP toInteger($skip) LIMIT toInteger($limit)
      OPTIONAL MATCH (b)-[r:PRODUCED_IN]->(c)
      RETURN b, r, c, quantity, from
    `, { id, limit, skip }));
    res.json(bricks.map(brick => ({
      ...brick.get("b").properties,
      ...brick.get("r")?.properties,
      color: brick.get("c")?.properties || null,
      quantity: brick.get("quantity"),
      from: brick.get("from")
    })));
    next();
  }));

  app.delete("/inventories/:inventoryId", asyncHandler(async (req: Request<InventoryIdParams>, res, next) => {
    const id = req.params.inventoryId;
    const stats = await writeDatabase(tx => tx.run("MATCH (i:Inventory { id: $id }) DETACH DELETE i", { id }));
    if (stats.nodesDeleted === 0) {
      res.status(404).json({ error: "Unknown inventory" });
      next();
      return;
    }
    res.status(204).send();
    next();
  }));

  app.post("/inventories/:inventoryId/content", asyncHandler(async (req: Request<InventoryIdParams, any, AddInventoryContent>, res, next) => {
    const inventoryId = req.params.inventoryId;
    const elementId = req.body.elementId;
    const result = await writeReadDatabase(tx => tx.run<AddInventoryContentResult>(`
      MATCH (i:Inventory { id: $inventoryId })
      MATCH (e:Element { id: $elementId })
      MERGE (e)-[r:IN_INVENTORY]->(i)
      ON CREATE SET r.since = date(), r.quantity = 1
      ON MATCH SET r.quantity = r.quantity + 1
      RETURN i, e, r
    `, { inventoryId, elementId }));
    if (result.records.length === 0) {
      res.status(404).json({ error: "Unknown inventory or element" });
      next();
      return;
    }
    const data = result.records[0];
    res.status(result.summary.counters.updates().relationshipsCreated ? 201 : 200).send({
      ...data.get("r").properties,
      inventory: data.get("i"),
      element: data.get("e")
    });
    next();
  }));

  app.delete("/inventories/:inventoryId/content/:elementId", asyncHandler(async (req: Request<InventoryIdAndElementIdParams, any, DeleteInventoryContent>, res, next) => {
    const inventoryId = req.params.inventoryId;
    const elementId = req.params.elementId;
    const all = req.body.all ?? false;
    const stats = await writeDatabase(tx => tx.run(`
      MATCH (:Inventory { id: $inventoryId })<-[r:IN_INVENTORY]-(:Element { id: $elementId })
      SET r.quantity = CASE $all WHEN true THEN 0 ELSE r.quantity - 1 END
      WITH r
      CALL apoc.do.when(r.quantity = 0, "DELETE r", "", { r: r }) YIELD value
      RETURN 1
    `, { inventoryId, elementId, all }));
    if (stats.propertiesSet === 0) {
      res.status(404).json({ error: "Unknown inventory or element, or element is not in inventory" });
      next();
      return;
    }
    res.status(204).send();
    next();
  }));
}
