const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const manifest = require("../package.json");

test("whiteboard stylesheet resolves from the installed Excalidraw package", () => {
  // Excalidraw exports its CSS only under bundler environment conditions.
  for (const environment of ["development", "production"]) {
    const resolved = execFileSync(process.execPath, [`--conditions=${environment}`, "-p", "require.resolve('@excalidraw/excalidraw/index.css')"], { cwd: path.resolve(__dirname, ".."), encoding: "utf8" }).trim();
    assert.ok(fs.existsSync(resolved));
  }
});

test("Recharts can resolve the explicitly declared React-compatible react-is peer", () => {
  assert.equal(manifest.dependencies["react-is"], manifest.dependencies.react);
  const fromRecharts = require.resolve("react-is", { paths: [path.dirname(require.resolve("recharts"))] });
  assert.equal(typeof require(fromRecharts).isFragment, "function");
});

test("ESLint flat config and Next.js rules load with the installed toolchain", async () => {
  const { defineConfig } = require("eslint/config");
  assert.equal(typeof defineConfig, "function");
  const config = await import("../eslint.config.mjs");
  assert.ok(Array.isArray(config.default));
});
