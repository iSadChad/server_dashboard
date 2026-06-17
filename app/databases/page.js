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
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Databases</h2>
          <p className="text-purple-200/40 text-sm mt-1">
            Connected PostgreSQL databases
          </p>
        </div>

        {databases.length > 0 && (
          <span className="text-xs text-purple-200/30 font-mono bg-[#110e28] rounded-lg px-3 py-2 border border-purple-500/10">
            {databases.length} db{databases.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-[#110e28] border border-purple-500/10 h-20 animate-pulse"
            />
          ))}
        </div>
      ) : databases.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#110e28] border border-purple-500/10 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-purple-400/30"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>

          <p className="text-purple-200/40 text-sm">
            No databases detected
          </p>

          <p className="text-purple-300/20 text-xs mt-1">
            Check your PostgreSQL connection in .env.local
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {databases.map((db) => {
            const tables = tablesByDb[db.name] || [];
            const isExpanded = expandedDb === db.name;
            const isLoadingTables = tablesLoading[db.name];

            return (
              <div
                key={db.name}
                className="group rounded-xl bg-[#110e28] border border-purple-500/10 hover:border-purple-500/25 hover:bg-[#13102a] transition-all overflow-hidden"
              >
                <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#a78bfa"
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
                      <h3 className="font-medium text-purple-100 truncate">
                        {db.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 mt-0.5">
                        <span className="text-xs text-purple-200/40 font-mono">
                          {db.type}
                        </span>

                        {db.version && (
                          <span className="text-xs text-purple-200/25 font-mono">
                            v{db.version}
                          </span>
                        )}

                        {db.size !== undefined && Number(db.size) > 0 && (
                          <span className="text-xs text-purple-200/25 font-mono">
                            {formatBytes(Number(db.size))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap sm:justify-end">
                    {db.port && (
                      <span className="text-xs font-mono text-purple-300/50 bg-purple-500/10 border border-purple-500/15 px-2 py-1 rounded">
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
                      className="rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 px-4 py-2 text-xs font-medium transition-all"
                    >
                      {isExpanded ? "Hide Tables" : "Show Tables"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-purple-500/10 px-4 md:px-5 py-4 bg-[#0c0a1d]/40">
                    {isLoadingTables ? (
                      <p className="text-xs text-purple-200/40 font-mono">
                        Loading tables...
                      </p>
                    ) : tables.length === 0 ? (
                      <p className="text-xs text-purple-200/40 font-mono">
                        No tables found.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/40 mb-2">
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
                              className="rounded-lg bg-[#110e28] border border-purple-500/10 overflow-hidden"
                            >
                              <div className="px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <span className="text-sm text-purple-100 font-medium">
                                    {table.table_name}
                                  </span>

                                  <div className="flex items-center gap-2 text-xs font-mono text-purple-200/30 mt-0.5">
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
                                  className="rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 px-3 py-1.5 text-xs font-medium transition-all"
                                >
                                  {isRowsExpanded ? "Hide Rows" : "Show Rows"}
                                </button>
                              </div>

                              {isRowsExpanded && (
                                <div className="border-t border-purple-500/10 p-3 overflow-x-auto">
                                  {isRowsLoading ? (
                                    <p className="text-xs text-purple-200/40 font-mono">
                                      Loading rows...
                                    </p>
                                  ) : rowData.rows.length === 0 ? (
                                    <p className="text-xs text-purple-200/40 font-mono">
                                      No rows found.
                                    </p>
                                  ) : (
                                    <table className="min-w-[1200px] w-full table-auto text-left text-xs font-mono">
                                      <thead>
                                        <tr className="text-purple-300/50 border-b border-purple-500/10">
                                          {rowData.columns.map((column) => {
                                            const longText =
                                              isLongTextColumn(column);

                                            return (
                                              <th
                                                key={column}
                                                className={`py-2 pr-4 font-medium align-top whitespace-nowrap ${
                                                  longText
                                                    ? "min-w-[380px]"
                                                    : "min-w-[130px]"
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
                                              className="border-b border-purple-500/5 text-purple-100/70"
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
                                                      className={`py-2 pr-4 align-top whitespace-normal break-words ${
                                                        longText
                                                          ? "min-w-[380px] max-w-[620px]"
                                                          : "min-w-[130px] max-w-[260px]"
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