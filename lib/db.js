import pg from "pg";

const { Pool } = pg;

const globalForDb = globalThis;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!globalForDb.serverDashboardPool) {
    globalForDb.serverDashboardPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return globalForDb.serverDashboardPool;
}

export const pool = {
  query(...args) {
    return getPool().query(...args);
  },
};
