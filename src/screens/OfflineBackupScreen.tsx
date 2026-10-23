import React, { useState, useEffect } from 'react';
import { useCrisis } from '../context/CrisisContext';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  FileCode,
  Table,
  Layers,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { SQLiteQueryResult, BackupSnapshotRecord, sqliteBackupService } from '../services/sqliteBackupService';

const PRESET_QUERIES = [
  {
    label: 'Critical Floods & Rescues',
    sql: `SELECT incident_id, title, severity, water_depth_meters, affected_population, status FROM incidents WHERE severity = 'CRITICAL' ORDER BY priority_score DESC;`
  },
  {
    label: 'Available Rescue Assets',
    sql: `SELECT resource_id, name, type, availability, capacity, contact_phone FROM resources WHERE availability = 'AVAILABLE';`
  },
  {
    label: 'Submerged Hazards (> 1.5m)',
    sql: `SELECT incident_id, title, location_name, water_depth_meters, affected_population FROM incidents WHERE water_depth_meters >= 1.5 ORDER BY water_depth_meters DESC;`
  },
  {
    label: 'Active Dispatches & ETAs',
    sql: `SELECT assignment_id, incident_title, resource_name, distance_km, eta_minutes, status FROM assignments;`
  },
  {
    label: 'Critical Route Bypasses',
    sql: `SELECT route_id, name, elevation_bypass_status, water_depth_risk, waypoints_count FROM critical_routes;`
  },
  {
    label: 'Offline Sync Queue',
    sql: `SELECT * FROM offline_sync_queue;`
  },
  {
    label: 'All SQLite Database Tables',
    sql: `SELECT type, name, tbl_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
  }
];

export const OfflineBackupScreen: React.FC = () => {
  const {
    sqliteStats,
    isSqliteReady,
    refreshSqliteStats,
    downloadSqliteBackup,
    restoreSqliteBackupFromFile,
    executeSqliteQuery,
    syncStateToSQLiteManual,
    currentLanguage,
    showNotification
  } = useCrisis();

  const [activeQuery, setActiveQuery] = useState<string>(PRESET_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<SQLiteQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [snapshotHistory, setSnapshotHistory] = useState<BackupSnapshotRecord[]>([]);

  useEffect(() => {
    refreshSqliteStats();
    loadSnapshots();
    // Execute default query on load
    handleRunQuery(PRESET_QUERIES[0].sql);
  }, []);

  const loadSnapshots = () => {
    const list = sqliteBackupService.getSnapshotHistory();
    setSnapshotHistory(list);
  };

  const handleRunQuery = async (sqlToRun?: string) => {
    const sql = sqlToRun || activeQuery;
    if (!sql.trim()) return;

    setIsExecuting(true);
    try {
      const res = await executeSqliteQuery(sql);
      setQueryResult(res);
      await refreshSqliteStats();
    } catch (err: any) {
      setQueryResult({
        columns: ['error'],
        rows: [[err?.message || 'Execution error']],
        rowCount: 0,
        executionTimeMs: 0,
        error: err?.message || 'Execution error'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const filename = await downloadSqliteBackup();
      showNotification(`SQLite database exported: ${filename}`);
      loadSnapshots();
    } catch {
      showNotification('Failed to export SQLite database');
    } finally {
      setIsExporting(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncStateToSQLiteManual();
      await refreshSqliteStats();
      loadSnapshots();
      showNotification('All emergency telemetry flushed into SQLite WASM');
    } catch {
      showNotification('Error syncing data into SQLite');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const res = await restoreSqliteBackupFromFile(uint8, file.name);
      if (res.success) {
        await refreshSqliteStats();
        loadSnapshots();
        handleRunQuery(PRESET_QUERIES[0].sql);
      }
    } catch (err: any) {
      showNotification(`Restore failed: ${err?.message || 'Invalid file format'}`);
    } finally {
      setIsRestoring(false);
      // Reset input
      e.target.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#223854] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#00C2E0]/15 border border-[#00C2E0]/30 text-[#00C2E0]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white flex items-center gap-2">
                {currentLanguage === 'HI' ? 'ऑफ़लाइन SQLite बैकअप एवं डेटाबेस' : 'OFFLINE SQLITE BACKUP & DB'}
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/40">
                  WASM 3.45
                </span>
              </h1>
              <p className="text-xs text-[#94A3B8]">
                {currentLanguage === 'HI'
                  ? 'संपूर्ण डेटाबेस ऑफ़लाइन ब्राउज़र स्टोरेज (WASM + IndexedDB) में सुरक्षित • तत्काल .sqlite बैकअप एक्सपोर्ट'
                  : 'Zero-connectivity embedded relational database • Client-side WebAssembly SQLite • Native .sqlite exports'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16253B] hover:bg-[#1E3352] text-xs font-bold text-[#F0F4F8] border border-[#223854] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00C2E0] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Flush to SQLite'}</span>
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16253B] hover:bg-[#1E3352] text-xs font-bold text-[#F0F4F8] border border-[#223854] cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-[#FFB300]" />
            <span>{isRestoring ? 'Restoring...' : 'Restore .sqlite File'}</span>
            <input
              type="file"
              accept=".sqlite,.db,application/x-sqlite3"
              onChange={handleFileUpload}
              disabled={isRestoring}
              className="hidden"
            />
          </label>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E05300] hover:from-[#FF7A1A] hover:to-[#EB6000] text-xs font-bold text-white shadow-lg shadow-[#FF6B00]/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating...' : 'Export .sqlite Backup'}</span>
          </button>
        </div>
      </div>

      {/* 2. SQLite Health & Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0E1A2B] border border-[#223854] p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
            <span>SQLite Engine</span>
            <ShieldCheck className="w-4 h-4 text-[#00C853]" />
          </div>
          <div className="text-base font-black text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
            {isSqliteReady ? 'Embedded WASM' : 'Loading...'}
          </div>
          <span className="text-[10px] text-[#00C853] font-medium">IndexedDB WAL Mirror Active</span>
        </div>

        <div className="bg-[#0E1A2B] border border-[#223854] p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
            <span>Relational Tables</span>
            <Layers className="w-4 h-4 text-[#00C2E0]" />
          </div>
          <div className="text-base font-black text-[#00C2E0]">
            {sqliteStats?.totalTables ?? 6} Tables
          </div>
          <span className="text-[10px] text-[#94A3B8]">Incidents, Assets, Routes, Queue</span>
        </div>

        <div className="bg-[#0E1A2B] border border-[#223854] p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
            <span>Total Records</span>
            <Table className="w-4 h-4 text-[#FFB300]" />
          </div>
          <div className="text-base font-black text-[#FFB300]">
            {sqliteStats?.totalRows ?? 0} Rows
          </div>
          <span className="text-[10px] text-[#94A3B8]">Guaranteed ACID Persistence</span>
        </div>

        <div className="bg-[#0E1A2B] border border-[#223854] p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
            <span>Database File Size</span>
            <HardDrive className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <div className="text-base font-black text-white">
            {formatBytes(sqliteStats?.dbSizeBytes ?? 0)}
          </div>
          <span className="text-[10px] text-[#94A3B8]">
            {sqliteStats?.lastSavedAt ? `Saved ${sqliteStats.lastSavedAt.slice(11, 19)} UTC` : 'Live InMemory'}
          </span>
        </div>
      </div>

      {/* 3. Interactive SQL Query Console */}
      <div className="bg-[#0E1A2B] border border-[#223854] rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-[#122036] px-4 py-3 border-b border-[#223854] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00C2E0]" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Tactical SQLite Offline Query Console
            </h2>
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            Run raw SQL SELECT, JOIN, or GROUP BY directly on local disaster cache
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Preset Buttons */}
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FFB300]" />
              <span>Emergency Preset Queries:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveQuery(preset.sql);
                    handleRunQuery(preset.sql);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    activeQuery === preset.sql
                      ? 'bg-[#00C2E0]/20 text-[#00C2E0] border-[#00C2E0]/50 font-bold'
                      : 'bg-[#16253B] text-[#94A3B8] border-[#223854] hover:text-white hover:border-[#3B5A80]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* SQL Editor */}
          <div className="relative">
            <textarea
              value={activeQuery}
              onChange={(e) => setActiveQuery(e.target.value)}
              rows={3}
              placeholder="Enter SQLite query (e.g. SELECT * FROM incidents WHERE severity = 'CRITICAL';)"
              className="w-full bg-[#070E18] border border-[#223854] rounded-xl p-3 text-xs font-mono text-[#00C2E0] focus:outline-none focus:border-[#00C2E0] transition resize-y"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-[10px] text-[#64748B] flex items-center gap-1.5">
                <FileCode className="w-3 h-3" />
                <span>Supports standard SQLite 3 dialect (JOIN, WHERE, GROUP BY, ORDER BY, LIMIT)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveQuery('')}
                  className="px-2.5 py-1 rounded-lg text-xs text-[#94A3B8] hover:text-white border border-[#223854] transition"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleRunQuery()}
                  disabled={isExecuting || !activeQuery.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#00C2E0] hover:bg-[#00ADC8] text-xs font-bold text-[#070E18] transition shadow"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
                  <span>{isExecuting ? 'Running...' : 'Execute Query'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Query Results */}
          {queryResult && (
            <div className="mt-4 pt-3 border-t border-[#223854]">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Results</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#16253B] text-[10px] text-[#94A3B8] border border-[#223854]">
                    {queryResult.rowCount} {queryResult.rowCount === 1 ? 'row' : 'rows'}
                  </span>
                </div>
                <div className="text-[10px] text-[#94A3B8] flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-[#00C853]" />
                  <span>Executed in {queryResult.executionTimeMs} ms</span>
                </div>
              </div>

              {queryResult.error ? (
                <div className="p-3 rounded-xl bg-[#D32F2F]/15 border border-[#D32F2F]/30 text-[#FF6B6B] text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{queryResult.error}</span>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-72 border border-[#223854] rounded-xl bg-[#070E18]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#122036] text-[#00C2E0] sticky top-0 border-b border-[#223854]">
                      <tr>
                        {queryResult.columns.map((col, idx) => (
                          <th key={idx} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A2D47] text-[#CBD5E1]">
                      {queryResult.rows.length === 0 ? (
                        <tr>
                          <td colSpan={queryResult.columns.length} className="px-3 py-4 text-center text-[#64748B]">
                            0 rows returned
                          </td>
                        </tr>
                      ) : (
                        queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#122036]/50 transition">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-[11px]">
                                {cell === null ? (
                                  <span className="text-[#64748B] italic">null</span>
                                ) : typeof cell === 'object' ? (
                                  <span className="text-[#FFB300]">[binary blob]</span>
                                ) : (
                                  String(cell)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Table Breakdown & Snapshot History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Table Schema Breakdown */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Table className="w-4 h-4 text-[#00C2E0]" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Offline SQLite Tables
            </h3>
          </div>
          <div className="divide-y divide-[#1A2D47]">
            {sqliteStats?.tables.map((t) => (
              <div key={t.name} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-[#00C2E0] font-bold">{t.name}</span>
                  <p className="text-[10px] text-[#64748B]">
                    {t.name === 'incidents' && 'Triage scores, water levels, casualty counts'}
                    {t.name === 'resources' && 'Boats, ambulances, pumps, contact numbers'}
                    {t.name === 'assignments' && 'Active dispatch telemetry, route summaries & ETAs'}
                    {t.name === 'critical_routes' && 'Northern bypass & Mayur Vihar high-ground waypoints'}
                    {t.name === 'alerts' && 'Broadcast sirens & emergency hazard bulletins'}
                    {t.name === 'offline_sync_queue' && 'Submissions pending cloud synchronization'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#16253B] font-mono font-bold text-white text-[11px] border border-[#223854]">
                    {t.count} rows
                  </span>
                  <button
                    onClick={() => {
                      const q = `SELECT * FROM ${t.name} LIMIT 20;`;
                      setActiveQuery(q);
                      handleRunQuery(q);
                    }}
                    className="p-1 hover:text-[#00C2E0] text-[#94A3B8] transition"
                    title="Query table"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Snapshot History & Portability */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFB300]" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                  Backup Export History & Snapshots
                </h3>
              </div>
              <span className="text-[10px] text-[#94A3B8]">IndexedDB Vault</span>
            </div>

            {snapshotHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#64748B]">
                <Database className="w-8 h-8 mx-auto mb-2 text-[#223854]" />
                No exported snapshots recorded yet. Click "Export .sqlite Backup" above to generate a standalone file.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {snapshotHistory.slice(0, 5).map((snap) => (
                  <div
                    key={snap.backupId}
                    className="p-2.5 rounded-xl bg-[#122036] border border-[#223854] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" />
                        <span>{snap.name}</span>
                      </div>
                      <div className="text-[10px] text-[#94A3B8] mt-0.5">
                        {snap.timestamp.replace('T', ' ').slice(0, 19)} • {snap.recordCount} rows • {formatBytes(snap.sizeBytes)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                      {snap.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#223854] bg-[#070E18]/60 p-3 rounded-xl border border-[#1E3352]">
            <h4 className="text-xs font-bold text-[#00C2E0] mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Offline Interoperability Guarantee</span>
            </h4>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Exported <code className="text-white">.sqlite</code> files are 100% standard SQLite 3 binary files.
              They can be opened in DB Browser for SQLite, DBeaver, or Python script without network access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
