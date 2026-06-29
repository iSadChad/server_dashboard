export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import os from "os";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { pool } from "../../../lib/db";

function getCpuPercent() {
  try {
    const cpuLoad = os.loadavg()[0];
    const cpuCount = os.cpus().length || 1;

    return Math.min((cpuLoad / cpuCount) * 100, 100);
  } catch {
    return 0;
  }
}

function getMemoryStats() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const percent = total > 0 ? (used / total) * 100 : 0;

  return {
    used,
    total,
    percent,
  };
}

function getDiskStats() {
  try {
    if (process.platform === "win32") {
      return {
        used: 0,
        total: 0,
        percent: 0,
      };
    }

    const output = execSync("df -B1 / | tail -1", { timeout: 5000 })
      .toString()
      .trim();

    const parts = output.split(/\s+/);

    const total = Number(parts[1]) || 0;
    const used = Number(parts[2]) || 0;
    const percent = total > 0 ? (used / total) * 100 : 0;

    return {
      used,
      total,
      percent,
    };
  } catch {
    return {
      used: 0,
      total: 0,
      percent: 0,
    };
  }
}

function getNetworkBytes() {
  try {
    if (process.platform !== "linux") {
      return {
        rx: 0,
        tx: 0,
      };
    }

    const content = readFileSync("/proc/net/dev", "utf8");
    const lines = content.split("\n").slice(2);

    let rx = 0;
    let tx = 0;

    for (const line of lines) {
      if (!line.includes(":")) continue;

      const [ifacePart, dataPart] = line.split(":");
      const iface = ifacePart.trim();

      if (iface === "lo") continue;

      const fields = dataPart.trim().split(/\s+/).map(Number);

      rx += fields[0] || 0;
      tx += fields[8] || 0;
    }

    return {
      rx,
      tx,
    };
  } catch {
    return {
      rx: 0,
      tx: 0,
    };
  }
}

async function ensureMetricsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS server_metrics (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      cpu_percent NUMERIC NOT NULL DEFAULT 0,

      mem_percent NUMERIC NOT NULL DEFAULT 0,
      memory_used BIGINT NOT NULL DEFAULT 0,
      memory_total BIGINT NOT NULL DEFAULT 0,

      disk_percent NUMERIC NOT NULL DEFAULT 0,
      disk_used BIGINT NOT NULL DEFAULT 0,
      disk_total BIGINT NOT NULL DEFAULT 0,

      net_rx_bytes BIGINT NOT NULL DEFAULT 0,
      net_tx_bytes BIGINT NOT NULL DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_server_metrics_created_at
    ON server_metrics(created_at);
  `);
}

async function insertCurrentMetric() {
  const cpu = getCpuPercent();
  const memory = getMemoryStats();
  const disk = getDiskStats();
  const network = getNetworkBytes();

  await pool.query(
    `
    INSERT INTO server_metrics (
      cpu_percent,
      mem_percent,
      memory_used,
      memory_total,
      disk_percent,
      disk_used,
      disk_total,
      net_rx_bytes,
      net_tx_bytes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `,
    [
      cpu,
      memory.percent,
      memory.used,
      memory.total,
      disk.percent,
      disk.used,
      disk.total,
      network.rx,
      network.tx,
    ]
  );
}

async function getWeeklyData() {
  const result = await pool.query(`
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', NOW()) - INTERVAL '6 days',
        date_trunc('day', NOW()),
        INTERVAL '1 day'
      )::date AS day
    )
    SELECT
      TRIM(TO_CHAR(days.day, 'Dy')) AS day,
      COALESCE(ROUND(AVG(m.cpu_percent), 1), 0) AS cpu,
      COALESCE(ROUND(AVG(m.mem_percent), 1), 0) AS mem
    FROM days
    LEFT JOIN server_metrics m
      ON m.created_at >= days.day
      AND m.created_at < days.day + INTERVAL '1 day'
    GROUP BY days.day
    ORDER BY days.day;
  `);

  return result.rows.map((row) => ({
    day: row.day,
    cpu: Number(row.cpu) || 0,
    mem: Number(row.mem) || 0,
  }));
}

async function getMonthlyNetworkData() {
  const result = await pool.query(`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', NOW()) - INTERVAL '11 months',
        date_trunc('month', NOW()),
        INTERVAL '1 month'
      ) AS month
    ),
    monthly AS (
      SELECT
        date_trunc('month', created_at) AS month,
        GREATEST(MAX(net_rx_bytes) - MIN(net_rx_bytes), 0) AS inbound_bytes,
        GREATEST(MAX(net_tx_bytes) - MIN(net_tx_bytes), 0) AS outbound_bytes
      FROM server_metrics
      WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY date_trunc('month', created_at)
    )
    SELECT
      TO_CHAR(months.month, 'Mon YY') AS month,
      COALESCE(ROUND(monthly.inbound_bytes / 1024.0 / 1024.0)::int, 0) AS inbound,
      COALESCE(ROUND(monthly.outbound_bytes / 1024.0 / 1024.0)::int, 0) AS outbound
    FROM months
    LEFT JOIN monthly
      ON monthly.month = months.month
    ORDER BY months.month;
  `);

  return result.rows.map((row) => ({
    month: row.month,
    inbound: Number(row.inbound) || 0,
    outbound: Number(row.outbound) || 0,
  }));
}

export async function GET() {
  try {
    await ensureMetricsTable();

    const week = await getWeeklyData();
    const month = await getMonthlyNetworkData();

    return Response.json({
      week,
      month,
    });
  } catch (error) {
    console.error("Failed to load chart data:", error);

    return Response.json(
      {
        error: "Failed to load chart data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}