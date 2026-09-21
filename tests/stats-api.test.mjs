import test from "node:test";
import assert from "node:assert/strict";

const statsApiUrl = process.env.STATS_API_URL ?? "http://127.0.0.1:3000/api/stats";

test("TC-03A: Statistik API liefert gueltige Werte", async () => {
  const response = await fetch(statsApiUrl);

  assert.equal(response.status, 200, "Die Statistik API muss HTTP 200 liefern");
  assert.match(
    response.headers.get("content-type") ?? "",
    /^application\/json\b/i,
    "Die Antwort muss JSON sein"
  );

  const stats = await response.json();

  assert.equal(typeof stats.cpu, "number", "CPU muss eine Zahl sein");
  assert.ok(Number.isFinite(stats.cpu), "CPU muss eine gueltige Zahl sein");
  assert.ok(stats.cpu >= 0 && stats.cpu <= 100, "CPU muss zwischen 0 und 100 liegen");

  for (const [name, values] of [
    ["Arbeitsspeicher", stats.memory],
    ["Speicherplatz", stats.disk],
  ]) {
    assert.equal(typeof values, "object", `${name} muss vorhanden sein`);
    assert.notEqual(values, null, `${name} muss vorhanden sein`);
    assert.equal(typeof values.used, "number", `${name}.used muss eine Zahl sein`);
    assert.equal(typeof values.total, "number", `${name}.total muss eine Zahl sein`);
    assert.ok(Number.isFinite(values.used), `${name}.used muss eine gueltige Zahl sein`);
    assert.ok(Number.isFinite(values.total), `${name}.total muss eine gueltige Zahl sein`);
    assert.ok(values.used >= 0, `${name}.used darf nicht negativ sein`);
    assert.ok(values.total > 0, `${name}.total muss groesser als 0 sein`);
    assert.ok(values.used <= values.total, `${name}.used darf nicht groesser als total sein`);
  }

  assert.equal(typeof stats.uptime, "number", "Uptime muss eine Zahl sein");
  assert.ok(Number.isFinite(stats.uptime), "Uptime muss eine gueltige Zahl sein");
  assert.ok(stats.uptime > 0, "Uptime muss groesser als 0 sein");
});
