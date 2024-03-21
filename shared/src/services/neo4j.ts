import neo4j, { ManagedTransaction, Record, RecordShape, Result, Session } from "neo4j-driver";
import { Neo4jStats } from "../types/neo4j";

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

export function openDatabaseSession(): Session {
  return driver.session();
}

export async function runInDatabaseSession<T = void>(runnable: (session: Session) => Promise<T>): Promise<T> {
  const session = openDatabaseSession();
  try {
    return await runnable(session);
  } finally {
    await session.close();
  }
}

export async function readDatabaseMany<T extends RecordShape>(runnable: (tx: ManagedTransaction) => Result<T>): Promise<Record<T>[]> {
  return runInDatabaseSession(async session => {
    const res = await session.executeRead(runnable);
    return res.records;
  });
}

export async function readDatabaseOne<T extends RecordShape>(runnable: (tx: ManagedTransaction) => Result<T>): Promise<Record<T> | null> {
  const res = await readDatabaseMany(runnable);
  return res.length === 0 ? null : res[0];
}

export async function writeDatabase(runnable: (tx: ManagedTransaction) => Result<RecordShape>): Promise<Neo4jStats> {
  return runInDatabaseSession(async session => {
    const res = await session.executeWrite(runnable);
    return res.summary.counters.updates();
  });
}

export async function writeReadDatabase<T extends RecordShape>(runnable: (tx: ManagedTransaction) => Result<T>): Promise<Result<T>> {
  return runInDatabaseSession(session => session.executeWrite(runnable));
}

export async function closeDatabaseDriver(): Promise<void> {
  await driver.close();
}
