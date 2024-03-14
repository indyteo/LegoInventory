import { getCategories, getColors, recursivelyFetchCatalogItems } from "./scraping/bricklink";
import { createCatalogItems, createCategories, createColors, createConstraints } from "./database/neo4j";
import { startWebServer } from "./webserver/express";
import { CatalogItemIdentifier, elementTypeDisplay, isElementType } from "./types";
import { closeDatabaseDriver } from "shared";

function parseCatalogItemIdentifiers(str: string): CatalogItemIdentifier[] {
  const identifiers = [];
  for (const s of str.split(",")) {
    const i = s.indexOf(":");
    const type = s.substring(0, i).trim();
    const id = s.substring(i + 1).trim();
    if (isElementType(type))
      identifiers.push({ type, id });
    else
      console.warn(`Ignoring unknown element type "${type}" (id = "${id}")`);
  }
  return identifiers;
}

async function database() {
  const skipDatabaseInitialization = process.env.SKIP_DATABASE_INITIALIZATION;
  if (skipDatabaseInitialization != undefined && skipDatabaseInitialization === "true") {
    console.log("Skipping database initialization!");
    return;
  }
  console.log("Initializing Neo4j database...");
  console.group();
  console.log("Creating constraints");
  const constraintsAdded = await createConstraints();
  console.log(`Created ${constraintsAdded} constraints`);
  console.log("Importing colors");
  console.group();
  console.log("Scraping colors");
  const colors = await getColors();
  console.log(`Scraped ${colors.length} colors`);
  console.log("Creating colors");
  const colorsStats = await createColors(colors);
  console.log(`Created ${colorsStats.nodesCreated} colors`);
  console.groupEnd();
  console.log("Importing categories");
  console.group();
  console.log("Scraping categories");
  const categories = await getCategories();
  console.log(`Scraped ${categories.length} categories`);
  console.log("Creating categories");
  const categoriesStats = await createCategories(categories);
  // apoc.do.when doesn't return any query statistics, thus we are unable to get the number of relationships created
  // console.log(`Created ${categoriesStats.nodesCreated} categories and linked ${categoriesStats.relationshipsCreated} to their parent`);
  console.log(`Created ${categoriesStats.nodesCreated} categories`);
  console.groupEnd();
  const initialCatalogTtems = process.env.INITIAL_CATALOG_ITEMS;
  if (initialCatalogTtems) {
    console.log("Importing initial catalog items");
    console.group();
    console.log("Parsing identifiers of initial catalog items");
    const catalogItemIdentifiers = parseCatalogItemIdentifiers(initialCatalogTtems);
    console.log("Initial catalog items requested:");
    console.group();
    for (const { type, id } of catalogItemIdentifiers)
      console.log(`${elementTypeDisplay[type]} ${id}`);
    console.groupEnd();
    console.log("Scraping initial catalog items");
    const catalogItems = await recursivelyFetchCatalogItems(...catalogItemIdentifiers);
    console.log(`Scraped ${catalogItems.length} catalog items`);
    console.log("Creating initial catalog items");
    const catalogItemsStats = await createCatalogItems(catalogItems);
    console.log(`Created ${catalogItemsStats.nodesCreated} nodes and ${catalogItemsStats.relationshipsCreated} relationships`);
    console.groupEnd();
  }
  console.groupEnd();
  console.log("Neo4j database initialized!");
}

async function webserver(): Promise<boolean> {
  const portStr = process.env.WEB_SERVER_PORT;
  if (portStr === undefined) {
    console.log("Skipping web server creation!");
    return true;
  }
  console.log("Starting web server...");
  const port = parseInt(portStr);
  if (isNaN(port) || port <= 0 || port > 65535)
    throw new Error(`Invalid web server port (expected: 0 <= port < 65535, given: ${port})`);
  startWebServer(port);
  console.log("Web server started!");
  return false;
}

async function main() {
  const start = Date.now();
  await database();
  const canCloseDatabaseDriver = await webserver();
  if (canCloseDatabaseDriver) {
    console.log("Closing Neo4j database driver...");
    await closeDatabaseDriver();
    console.log("Neo4j database driver closed!")
  }
  const end = Date.now();
  const time = Math.round((end - start) / 100) / 10;
  console.log(`Done in ${time}s`);
}

main().catch(e => {
  console.error(e);
  closeDatabaseDriver().then(() => process.exit(1));
});
