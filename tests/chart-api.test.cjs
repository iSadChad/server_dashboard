const test = require("node:test");
const assert = require("node:assert/strict");
const { PGlite } = require("@electric-sql/pglite");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { registerHooks } = require("node:module");

// Match Next's extensionless import resolution when executing the route in Node.
const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "../../../lib/db") specifier += ".js";
  return nextResolve(specifier, context);
} });

test("chart requests persist real metric samples before reading historical aggregates", async () => {
  const db = new PGlite();
  const originalPool = globalThis.serverDashboardPool;
  const originalUrl = process.env.DATABASE_URL;
  globalThis.serverDashboardPool = db;
  process.env.DATABASE_URL = "postgres://unused-test-placeholder";
  try {
    const { GET } = await import(pathToFileURL(path.resolve(__dirname, "../app/api/chart/route.js")).href);
    for (let count = 1; count <= 2; count += 1) {
      const response = await GET();
      const data = await response.json();
      assert.equal(response.status, 200, JSON.stringify(data));
      const rows = (await db.query("SELECT * FROM server_metrics ORDER BY id")).rows;
      assert.equal(rows.length, count, "Each chart poll must record a sample");
      const metric = rows.at(-1);
      assert.ok(Number(metric.memory_total) > 0);
      assert.ok(Number(metric.cpu_percent) >= 0 && Number(metric.cpu_percent) <= 100);
      assert.ok(Number(metric.mem_percent) > 0 && Number(metric.mem_percent) <= 100);
      assert.equal(data.week.length, 7);
      assert.equal(data.month.length, 12);
      assert.ok(data.week.at(-1).mem > 0, "The response must include the newly recorded sample");
    }
  } finally {
    hooks.deregister();
    if (originalPool === undefined) delete globalThis.serverDashboardPool;
    else globalThis.serverDashboardPool = originalPool;
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
    await db.close();
  }
});
