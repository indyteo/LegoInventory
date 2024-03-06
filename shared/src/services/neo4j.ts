import neo4j from "neo4j-driver";
import exitHook from "async-exit-hook";

const url = process.env.DB_URL;
const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

if (!url || !user || !pass)
  throw new Error("Missing database connection information (DB_URL, DB_PASS and DB_USER environment variables)");

export const driver = neo4j.driver(
  url,
  neo4j.auth.basic(user, pass),
  { disableLosslessIntegers: true }
);

export function openDatabaseSession() {
  return driver.session();
}

exitHook.uncaughtExceptionHandler(err => {
  console.error(err);
});

exitHook.unhandledRejectionHandler(err => {
  console.error(err);
});

exitHook(callback => {
  driver.close().finally(callback);
});
