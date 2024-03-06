import { ManagedTransaction } from "neo4j-driver";
import { getCatalogItem, getCategories, getColors } from "./services/bricklink";
import express from "express";
import { openDatabaseSession } from "shared";

// getCatalogItem("S", "75283-1").then(console.log).catch(console.error);
// getColors().then(console.log).catch(console.error);
// getCategories().then(console.log).catch(console.error);

async function main() {
  const colors = await getColors();
  const categories = await getCategories();

  const session = openDatabaseSession();

  try {
    await session.executeWrite((tx: ManagedTransaction) => tx.run("CREATE CONSTRAINT color_id IF NOT EXISTS FOR (c:Color) REQUIRE c.id IS UNIQUE"));
    await session.executeWrite((tx: ManagedTransaction) => tx.run("CREATE CONSTRAINT category_id IF NOT EXISTS FOR (c:Category) REQUIRE c.id IS UNIQUE"));
    await session.executeWrite(
      (tx: ManagedTransaction) => tx.run(
        "UNWIND $colors AS color MERGE (:Color { id: toInteger(color.id), name: color.name, value: toInteger(color.value), type: color.type })",
        { colors }
      )
    );
    await session.executeWrite(
      (tx: ManagedTransaction) => tx.run(
        `UNWIND $categories AS category
        MERGE (cat:Category { id: category.id }) SET
          cat.name = category.name,
          cat.link = category.link
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
      )
    );
  } catch (e) {
    console.error(e);
  } finally {
    await session.close();
  }

  const portStr = process.env.WEB_SERVER_PORT;
  if (portStr) {
    const port = parseInt(portStr);
    if (isNaN(port) || port <= 0 || port > 65535)
      throw new Error(`Invalid web server port (expected: 0 <= port < 65535, given: ${port})`);
    const app = express();
    app.get("/", (req, res) => {
      res.send("Welcome to the server");
    });
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  }
}

main().catch(console.error);
