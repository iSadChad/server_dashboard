"use client";

import { useState, useEffect } from "react";
import PageLayout from "../../components/PageLayout";
import { formatBytes } from "../../utils/formatBytes";

function StatusDot({ status }) {
  if (status === "running") {
    return (
      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
    );
  }

  if (status === "stopped") {
    return (
      <span className="inline-block w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.6)]" />
    );
  }

  return (
    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
  );
}

function isLongTextColumn(column) {
  return [
    "description",
    "notes",
    "raw_log",
    "result",
    "example",
    "command",
    "file_path",
    "url",
  ].includes(column);
}

function DatabasesContent() {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedDb, setExpandedDb] = useState(null);
  const [tablesByDb, setTablesByDb] = useState({});
  const [tablesLoading, setTablesLoading] = useState({});
  const [expandedTable, setExpandedTable] = useState(null);
  const [rowsByTable, setRowsByTable] = useState({});
  const [rowsLoading, setRowsLoading] = useState({});

  useEffect(() => {
    async function fetchDatabases() {
      try {
        const res = await fetch("/api/databases");

        if (!res.ok) {
          throw new Error("Failed to fetch databases");
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setDatabases(data);
        } else {
          setDatabases([]);
        }
      } catch (e) {
        console.error("Failed to fetch databases:", e);
        setDatabases([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDatabases();
  }, []);

  async function toggleTables(dbName) {
    if (expandedDb === dbName) {
      setExpandedDb(null);
      return;
    }

    setExpandedDb(dbName);

    if (tablesByDb[dbName]) {
      return;
    }

    setTablesLoading((prev) => ({
      ...prev,
      [dbName]: true,
    }));

    try {
      const res = await fetch(
        `/api/databases_tables?db=${encodeURIComponent(dbName)}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch tables");
      }

      const data = await res.json();

      setTablesByDb((prev) => ({
        ...prev,
        [dbName]: Array.isArray(data.tables) ? data.tables : [],
      }));
    } catch (error) {
      console.error("Failed to fetch tables:", error);

      setTablesByDb((prev) => ({
        ...prev,
        [dbName]: [],
      }));
    } finally {
      setTablesLoading((prev) => ({
        ...prev,
        [dbName]: false,
      }));
    }
  }

  async function toggleRows(dbName, schemaName, tableName) {
    const key = `${dbName}.${schemaName}.${tableName}`;

    if (expandedTable === key) {
      setExpandedTable(null);
      return;
    }

    setExpandedTable(key);

    if (rowsByTable[key]) {
      return;
    }

    setRowsLoading((prev) => ({
      ...prev,
      [key]: true,
    }));

    try {
      const res = await fetch(
        `/api/database_rows?db=${encodeURIComponent(
          dbName
        )}&schema=${encodeURIComponent(schemaName)}&table=${encodeURIComponent(
          tableName
        )}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch rows");
      }

      const data = await res.json();

      setRowsByTable((prev) => ({
        ...prev,
        [key]: {
          columns: Array.isArray(data.columns) ? data.columns : [],
          rows: Array.isArray(data.rows) ? data.rows : [],
        },
      }));
    } catch (error) {
      console.error("Failed to fetch rows:", error);

      setRowsByTable((prev) => ({
        ...prev,
        [key]: {
          columns: [],
          rows: [],
        },
      }));
    } finally {
      setRowsLoading((prev) => ({
        ...prev,
        [key]: false,
      }));
    }
  }

  return (
    <div className="vapor-page databases-workbench min-w-0 max-w-full overflow-x-clip px-3 py-3 sm:p-4 md:p-8">
      <div className="vapor-header page-command-header relative mb-4 flex min-h-0! min-w-0 flex-col items-start gap-3 overflow-hidden rounded-2xl! border border-fuchsia-300/20 bg-linear-to-br from-fuchsia-500/15 via-violet-500/10 to-cyan-400/10 p-4! shadow-[0_0_55px_rgba(217,70,239,0.14)] sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:rounded-3xl! sm:p-5! md:mb-8 md:p-7!">
        <div className="min-w-0">
          <p className="vapor-kicker mb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/75 sm:mb-2 sm:text-[10px] sm:tracking-[0.3em]">
            Data vault // PostgreSQL matrix
          </p>
          <h2 className="vapor-title text-2xl font-black tracking-tight text-white sm:text-3xl md:text-5xl">Databases</h2>
          <p className="vapor-muted mt-1 text-xs text-violet-100/55 sm:mt-2 sm:text-sm">
            Connected PostgreSQL databases
          </p>
        </div>

        {databases.length > 0 && (
          <span className="vapor-chip w-fit shrink-0 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-cyan-100 sm:px-4 sm:py-2.5 sm:text-xs">
            {databases.length} db{databases.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="database-stack space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="vapor-list-row h-24 animate-pulse rounded-3xl border border-fuchsia-300/15 bg-violet-950/50"
            />
          ))}
        </div>
      ) : databases.length === 0 ? (
        <div className="vapor-empty py-20 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-fuchsia-300/20 bg-linear-to-br from-fuchsia-400/15 to-cyan-300/10 shadow-[0_0_35px_rgba(217,70,239,0.16)]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-cyan-200/45"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>

          <p className="text-sm font-bold text-fuchsia-100/60">
            No databases detected
          </p>

          <p className="vapor-muted mt-1 text-xs text-violet-100/35">
            Check your PostgreSQL connection in .env.local
          </p>
        </div>
      ) : (
        <div className="database-stack min-w-0 max-w-full space-y-3 sm:space-y-4">
          {databases.map((db) => {
            const tables = tablesByDb[db.name] || [];
            const isExpanded = expandedDb === db.name;
            const isLoadingTables = tablesLoading[db.name];

            return (
              <div
                key={db.name}
                className="vapor-list-row group overflow-hidden rounded-3xl border border-fuchsia-300/18 bg-linear-to-r from-violet-950/65 to-fuchsia-950/35 shadow-[0_18px_55px_rgba(30,0,65,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35 hover:shadow-[0_22px_65px_rgba(34,211,238,0.1)]"
              >
                <div className="database-card-header flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 md:p-5">
                  <div className="flex min-w-0 items-center gap-3 pr-8 sm:gap-4 sm:pr-0">
                    <div className="vapor-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/25 bg-linear-to-br from-fuchsia-500/20 to-cyan-400/10 text-fuchsia-100 shadow-[0_0_22px_rgba(217,70,239,0.16)] sm:h-12 sm:w-12 sm:rounded-2xl">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f87171"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold tracking-wide text-fuchsia-50 transition-colors group-hover:text-cyan-100">
                        {db.name}
                      </h3>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-xs text-cyan-100/50">
                          {db.type}
                        </span>

                        {db.version && (
                          <span className="font-mono text-xs text-violet-100/35">
                            v{db.version}
                          </span>
                        )}

                        {db.size !== undefined && Number(db.size) > 0 && (
                          <span className="font-mono text-xs text-violet-100/35">
                            {formatBytes(Number(db.size))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="database-card-controls flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
                    {db.port && (
                      <span className="vapor-chip rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-2.5 py-1 font-mono text-xs text-fuchsia-100/65">
                        :{db.port}
                      </span>
                    )}

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <StatusDot status={db.status} />

                      <span
                        className={
                          db.status === "running"
                            ? "text-emerald-400"
                            : db.status === "stopped"
                            ? "text-rose-400"
                            : "text-amber-400"
                        }
                      >
                        {db.status.toUpperCase()}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleTables(db.name)}
                      className="vapor-button min-h-11 w-full rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200/45 hover:bg-fuchsia-400/15 sm:min-h-0 sm:w-auto"
                    >
                      {isExpanded ? "Hide Tables" : "Show Tables"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="vapor-drawer min-w-0 max-w-full border-t border-cyan-200/10 bg-violet-950/45 px-2 py-3 sm:px-4 sm:py-5 md:px-5">
                    {isLoadingTables ? (
                      <p className="font-mono text-xs text-cyan-100/45">
                        Loading tables...
                      </p>
                    ) : tables.length === 0 ? (
                      <p className="font-mono text-xs text-violet-100/45">
                        No tables found.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="vapor-kicker mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-200/50">
                          Tables
                        </p>

                        {tables.map((table) => {
                          const rowKey = `${db.name}.${table.table_schema}.${table.table_name}`;
                          const isRowsExpanded = expandedTable === rowKey;
                          const isRowsLoading = rowsLoading[rowKey];
                          const rowData = rowsByTable[rowKey] || {
                            columns: [],
                            rows: [],
                          };

                          return (
                            <div
                              key={`${table.table_schema}.${table.table_name}`}
                              className="vapor-subpanel min-w-0 max-w-full overflow-hidden rounded-2xl border border-fuchsia-300/15 bg-violet-950/55"
                            >
                              <div className="flex min-w-0 flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <span className="wrap-break-word text-sm font-bold text-fuchsia-50">
                                    {table.table_name}
                                  </span>

                                  <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-violet-100/35">
                                    <span>{table.table_schema}</span>
                                    <span>·</span>
                                    <span>{table.table_type}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    toggleRows(
                                      db.name,
                                      table.table_schema,
                                      table.table_name
                                    )
                                  }
                                  className="vapor-button min-h-11 w-full rounded-lg border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-2 text-xs font-bold text-fuchsia-100 transition-all hover:border-cyan-200/40 hover:bg-cyan-300/10 sm:min-h-0 sm:w-auto sm:py-1.5"
                                >
                                  {isRowsExpanded ? "Hide Rows" : "Show Rows"}
                                </button>
                              </div>

                              {isRowsExpanded && (
                                <div className="min-w-0 max-w-full touch-pan-x overflow-x-auto overscroll-x-contain border-t border-cyan-200/10 bg-violet-950/35 p-2 sm:p-3">
                                  {isRowsLoading ? (
                                    <p className="font-mono text-xs text-cyan-100/45">
                                      Loading rows...
                                    </p>
                                  ) : rowData.rows.length === 0 ? (
                                    <p className="font-mono text-xs text-violet-100/45">
                                      No rows found.
                                    </p>
                                  ) : (
                                    <table className="vapor-table w-full min-w-160 table-auto text-left font-mono text-xs md:min-w-300">
                                      <thead>
                                        <tr className="border-b border-cyan-200/15 text-cyan-100/55">
                                          {rowData.columns.map((column) => {
                                            const longText =
                                              isLongTextColumn(column);

                                            return (
                                              <th
                                                key={column}
                                                className={`py-2 pr-4 font-medium align-top ${
                                                  longText
                                                    ? "min-w-56 md:min-w-95"
                                                    : "whitespace-nowrap"
                                                }`}
                                              >
                                                {column}
                                              </th>
                                            );
                                          })}
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {rowData.rows.map(
                                          (row, rowIndex) => (
                                            <tr
                                              key={rowIndex}
                                              className="border-b border-fuchsia-200/8 text-violet-50/65 transition-colors hover:bg-fuchsia-400/5"
                                            >
                                              {rowData.columns.map(
                                                (column) => {
                                                  const longText =
                                                    isLongTextColumn(
                                                      column
                                                    );

                                                  return (
                                                    <td
                                                      key={column}
                                                      className={`py-2 pr-4 align-top whitespace-normal wrap-break-word ${
                                                        longText
                                                          ? "min-w-56 max-w-80 md:min-w-95 md:max-w-155"
                                                          : "max-w-40 md:max-w-65"
                                                      }`}
                                                    >
                                                      {row[column] ===
                                                        null ||
                                                      row[column] ===
                                                        undefined
                                                        ? "NULL"
                                                        : String(
                                                            row[column]
                                                          )}
                                                    </td>
                                                  );
                                                }
                                              )}
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DatabasesPage() {
  return (
    <PageLayout>
      <DatabasesContent />
    </PageLayout>
  );
}
