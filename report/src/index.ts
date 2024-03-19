import { closeDatabaseDriver } from "shared";

async function generateReport() {
  // TODO Generate report
}

async function main() {
  const start = Date.now();
  await generateReport();
  console.log("Closing Neo4j database driver...");
  await closeDatabaseDriver();
  console.log("Neo4j database driver closed!")
  const end = Date.now();
  const time = Math.round((end - start) / 100) / 10;
  console.log(`Done in ${time}s`);
}

main().catch(e => {
  console.error(e);
  closeDatabaseDriver().then(() => process.exit(1));
});
