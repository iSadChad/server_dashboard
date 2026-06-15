import { execSync } from "child_process";

function detectDatabases() {
  const databases = [];

  const checks = [
    {
      name: "PostgreSQL",
      type: "PostgreSQL",
      commands: {
        check: "pg_isready",
        version: "psql --version",
        size: "psql -U postgres -c \"SELECT pg_database_size(datname) FROM pg_database WHERE datname = current_database();\" -t -A 2>nul",
        port: "netstat -ano | findstr :5432 | findstr LISTENING",
      },
      defaultPort: 5432,
    },
    {
      name: "MySQL",
      type: "MySQL",
      commands: {
        check: "mysql --version",
        version: "mysql --version",
        port: "netstat -ano | findstr :3306 | findstr LISTENING",
      },
      defaultPort: 3306,
    },
    {
      name: "MongoDB",
      type: "MongoDB",
      commands: {
        check: "mongod --version",
        version: "mongod --version",
        port: "netstat -ano | findstr :27017 | findstr LISTENING",
      },
      defaultPort: 27017,
    },
    {
      name: "Redis",
      type: "Redis",
      commands: {
        check: "redis-server --version",
        version: "redis-server --version",
        port: "netstat -ano | findstr :6379 | findstr LISTENING",
      },
      defaultPort: 6379,
    },
    {
      name: "SQLite",
      type: "SQLite",
      commands: {
        check: "sqlite3 --version",
        version: "sqlite3 --version",
      },
      defaultPort: null,
    },
    {
      name: "MariaDB",
      type: "MariaDB",
      commands: {
        check: "mariadb --version",
        version: "mariadb --version",
        port: "netstat -ano | findstr :3306 | findstr LISTENING",
      },
      defaultPort: 3306,
    },
  ];

  for (const db of checks) {
    try {
      execSync(db.commands.check, { timeout: 3000, stdio: "pipe" });

      let version = null;
      try {
        const vOut = execSync(db.commands.version, {
          timeout: 3000,
          stdio: "pipe",
        })
          .toString()
          .trim();
        const match = vOut.match(/(\d+\.\d+[\.\d]*)/);
        version = match ? match[1] : null;
      } catch {}

      let status = "installed";
      let port = null;
      if (db.commands.port) {
        try {
          const portOut = execSync(db.commands.port, {
            timeout: 3000,
            stdio: "pipe",
          }).toString();
          if (portOut.trim().length > 0) {
            status = "running";
            port = db.defaultPort;
          }
        } catch {
          status = "stopped";
        }
      }

      databases.push({
        name: db.name,
        type: db.type,
        version,
        status,
        port,
        size: 0,
      });
    } catch {
      // not installed
    }
  }

  return databases;
}

export async function GET() {
  try {
    const databases = detectDatabases();
    return Response.json(databases);
  } catch {
    return Response.json([]);
  }
}