import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import initSqlJsInline from 'sql.js/dist/sql-wasm-inline.js';
import { Incident, Resource, Assignment, AlertMessage } from '../types';
import { CriticalRouteCacheItem, CRITICAL_EMERGENCY_ROUTES } from './offlineCacheService';

const IDB_NAME = 'crisiscore_sqlite_idb_v1';
const IDB_STORE = 'sqlite_binary_store';
const IDB_KEY = 'crisiscore_db_blob';
const SNAPSHOTS_KEY = 'crisiscore_sqlite_snapshots_v1';

export interface SQLiteTableStat {
  name: string;
  count: number;
}

export interface SQLiteStats {
  isInitialized: boolean;
  totalTables: number;
  totalRows: number;
  dbSizeBytes: number;
  lastSavedAt: string | null;
  tables: SQLiteTableStat[];
}

export interface SQLiteQueryResult {
  columns: string[];
  rows: (string | number | Uint8Array | null)[][];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface BackupSnapshotRecord {
  backupId: string;
  name: string;
  type: 'MANUAL' | 'AUTO' | 'RESTORED';
  timestamp: string;
  recordCount: number;
  sizeBytes: number;
}

class SQLiteBackupService {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private isInitializing: boolean = false;
  private lastSavedAt: string | null = null;
  private initPromise: Promise<Database> | null = null;

  /**
   * Internal helper to load SqlJsStatic with inline WASM primary and network fallback.
   * Inline WASM avoids MIME type mismatch and Service Worker SPA fallback issues.
   */
  private async getSqlStatic(): Promise<SqlJsStatic> {
    if (this.SQL) {
      return this.SQL;
    }

    try {
      // Primary: Use inline WASM binary — zero network fetch, immune to MIME type & Service Worker SPA fallback issues
      this.SQL = await initSqlJsInline();
      return this.SQL;
    } catch (inlineErr) {
      console.warn('Inline SQLite WASM initialization failed, trying network loader:', inlineErr);
      this.SQL = await initSqlJs({
        locateFile: (file) => `/${file}`
      });
      return this.SQL;
    }
  }

  /**
   * Initialize SQLite WASM runtime and load persisted database from IndexedDB
   */
  public async getDatabase(): Promise<Database> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        if (!this.SQL) {
          this.SQL = await this.getSqlStatic();
        }

        const savedBytes = await this.loadFromIndexedDB();
        if (savedBytes && savedBytes.length > 0) {
          try {
            this.db = new this.SQL.Database(savedBytes);
          } catch (e) {
            console.warn('Failed to parse saved SQLite binary, initializing clean schema:', e);
            this.db = new this.SQL.Database();
          }
        } else {
          this.db = new this.SQL.Database();
        }

        this.initSchema(this.db);
        this.lastSavedAt = new Date().toISOString();
        return this.db;
      } catch (err) {
        console.error('Fatal error initializing SQLite WASM:', err);
        this.initPromise = null;
        throw err;
      }
    })();

    return this.initPromise;
  }

  /**
   * Create schema with tables for incidents, resources, assignments, routes, alerts, and sync queue
   */
  private initSchema(database: Database): void {
    const ddl = `
      CREATE TABLE IF NOT EXISTS incidents (
        incident_id TEXT PRIMARY KEY,
        reporter_id TEXT,
        reporter_name TEXT,
        title TEXT,
        type TEXT,
        severity TEXT,
        urgency TEXT,
        location_name TEXT,
        latitude REAL,
        longitude REAL,
        affected_population INTEGER,
        water_depth_meters REAL,
        description TEXT,
        photo_url TEXT,
        status TEXT,
        priority_score REAL,
        assigned_resource_id TEXT,
        assigned_resource_name TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS resources (
        resource_id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        team_personnel TEXT,
        latitude REAL,
        longitude REAL,
        availability TEXT,
        capacity INTEGER,
        contact_phone TEXT,
        current_incident_id TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS assignments (
        assignment_id TEXT PRIMARY KEY,
        incident_id TEXT,
        resource_id TEXT,
        resource_name TEXT,
        incident_title TEXT,
        priority TEXT,
        route_summary TEXT,
        distance_km REAL,
        eta_minutes REAL,
        status TEXT,
        assigned_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS critical_routes (
        route_id TEXT PRIMARY KEY,
        name TEXT,
        origin TEXT,
        destination TEXT,
        elevation_bypass_status TEXT,
        water_depth_risk TEXT,
        waypoints_count INTEGER,
        waypoints_json TEXT
      );

      CREATE TABLE IF NOT EXISTS alerts (
        alert_id TEXT PRIMARY KEY,
        title TEXT,
        message TEXT,
        severity TEXT,
        incident_id TEXT,
        target_role TEXT,
        timestamp TEXT,
        is_read INTEGER
      );

      CREATE TABLE IF NOT EXISTS offline_sync_queue (
        queue_id TEXT PRIMARY KEY,
        incident_id TEXT,
        title TEXT,
        payload_json TEXT,
        status TEXT,
        queued_at TEXT
      );

      CREATE TABLE IF NOT EXISTS backup_snapshots (
        backup_id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        record_count INTEGER,
        size_bytes INTEGER,
        created_at TEXT
      );
    `;

    database.run(ddl);
  }

  /**
   * Persist SQLite binary database to IndexedDB
   */
  public async persistToStorage(): Promise<void> {
    if (!this.db) return;
    try {
      const data = this.db.export();
      await this.saveToIndexedDB(data);
      this.lastSavedAt = new Date().toISOString();
    } catch (e) {
      console.error('Failed to persist SQLite database to IndexedDB:', e);
    }
  }

  private async openIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveToIndexedDB(binary: Uint8Array): Promise<void> {
    const idb = await this.openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(binary, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise(async (resolve) => {
      try {
        const idb = await this.openIDB();
        const tx = idb.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const request = store.get(IDB_KEY);
        request.onsuccess = () => {
          if (request.result instanceof Uint8Array) {
            resolve(request.result);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Synchronize current state to SQLite
   */
  public async syncStateToSQLite(params: {
    incidents?: Incident[];
    resources?: Resource[];
    assignments?: Assignment[];
    routes?: CriticalRouteCacheItem[];
    alerts?: AlertMessage[];
    autoPersist?: boolean;
  }): Promise<void> {
    const database = await this.getDatabase();

    database.run('BEGIN TRANSACTION;');
    try {
      // 1. Incidents
      if (params.incidents) {
        database.run('DELETE FROM incidents;');
        const stmt = database.prepare(`
          INSERT INTO incidents (
            incident_id, reporter_id, reporter_name, title, type, severity,
            urgency, location_name, latitude, longitude, affected_population,
            water_depth_meters, description, photo_url, status, priority_score,
            assigned_resource_id, assigned_resource_name, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);

        for (const inc of params.incidents) {
          stmt.run([
            inc.incidentId,
            inc.reporterId || 'system',
            inc.reporterName || 'Unknown',
            inc.title,
            inc.type,
            inc.severity,
            inc.urgency,
            inc.locationName,
            inc.latitude,
            inc.longitude,
            inc.affectedPopulation || 0,
            inc.waterDepthMeters || 0,
            inc.description || '',
            inc.photoUrl || null,
            inc.status,
            inc.priorityScore || 0,
            inc.assignedResourceId || null,
            inc.assignedResourceName || null,
            inc.createdAt,
            inc.updatedAt
          ]);
        }
        stmt.free();
      }

      // 2. Resources
      if (params.resources) {
        database.run('DELETE FROM resources;');
        const stmt = database.prepare(`
          INSERT INTO resources (
            resource_id, name, type, team_personnel, latitude, longitude,
            availability, capacity, contact_phone, current_incident_id, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);

        for (const res of params.resources) {
          stmt.run([
            res.resourceId,
            res.name,
            res.type,
            res.teamPersonnel || '',
            res.latitude,
            res.longitude,
            res.availability,
            res.capacity || 0,
            res.contactPhone || '',
            res.currentIncidentId || null,
            res.updatedAt
          ]);
        }
        stmt.free();
      }

      // 3. Assignments
      if (params.assignments) {
        database.run('DELETE FROM assignments;');
        const stmt = database.prepare(`
          INSERT INTO assignments (
            assignment_id, incident_id, resource_id, resource_name, incident_title,
            priority, route_summary, distance_km, eta_minutes, status, assigned_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);

        for (const asg of params.assignments) {
          stmt.run([
            asg.assignmentId,
            asg.incidentId,
            asg.resourceId,
            asg.resourceName,
            asg.incidentTitle,
            asg.priority,
            asg.routeSummary || '',
            asg.distanceKm || 0,
            asg.etaMinutes || 0,
            asg.status,
            asg.assignedAt,
            asg.updatedAt
          ]);
        }
        stmt.free();
      }

      // 4. Critical Routes
      const routes = params.routes || CRITICAL_EMERGENCY_ROUTES;
      if (routes && routes.length > 0) {
        database.run('DELETE FROM critical_routes;');
        const stmt = database.prepare(`
          INSERT INTO critical_routes (
            route_id, name, origin, destination, elevation_bypass_status,
            water_depth_risk, waypoints_count, waypoints_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `);

        for (const r of routes) {
          stmt.run([
            r.id,
            r.name,
            r.origin,
            r.destination,
            r.elevationBypassStatus,
            r.waterDepthRisk,
            r.waypoints?.length || 0,
            JSON.stringify(r.waypoints || [])
          ]);
        }
        stmt.free();
      }

      // 5. Alerts
      if (params.alerts) {
        database.run('DELETE FROM alerts;');
        const stmt = database.prepare(`
          INSERT INTO alerts (
            alert_id, title, message, severity, incident_id, target_role, timestamp, is_read
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `);

        for (const alt of params.alerts) {
          stmt.run([
            alt.alertId,
            alt.title,
            alt.message,
            alt.severity,
            alt.incidentId || null,
            alt.targetRole,
            alt.timestamp,
            alt.isRead ? 1 : 0
          ]);
        }
        stmt.free();
      }

      database.run('COMMIT;');
    } catch (err) {
      database.run('ROLLBACK;');
      throw err;
    }

    if (params.autoPersist !== false) {
      await this.persistToStorage();
    }
  }

  /**
   * Queue an offline incident submission directly into SQLite offline queue table
   */
  public async queueIncidentInSQLite(incident: Incident): Promise<void> {
    const database = await this.getDatabase();
    const queueId = `QUEUE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const stmt = database.prepare(`
      INSERT OR REPLACE INTO offline_sync_queue (
        queue_id, incident_id, title, payload_json, status, queued_at
      ) VALUES (?, ?, ?, ?, ?, ?);
    `);

    stmt.run([
      queueId,
      incident.incidentId,
      incident.title,
      JSON.stringify(incident),
      'PENDING_NETWORK',
      new Date().toISOString()
    ]);
    stmt.free();

    // Also insert into offline incidents table for immediate querying
    const incStmt = database.prepare(`
      INSERT OR REPLACE INTO incidents (
        incident_id, reporter_id, reporter_name, title, type, severity,
        urgency, location_name, latitude, longitude, affected_population,
        water_depth_meters, description, photo_url, status, priority_score,
        assigned_resource_id, assigned_resource_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    incStmt.run([
      incident.incidentId,
      incident.reporterId,
      incident.reporterName,
      incident.title,
      incident.type,
      incident.severity,
      incident.urgency,
      incident.locationName,
      incident.latitude,
      incident.longitude,
      incident.affectedPopulation,
      incident.waterDepthMeters,
      incident.description,
      incident.photoUrl || null,
      incident.status,
      incident.priorityScore,
      incident.assignedResourceId || null,
      incident.assignedResourceName || null,
      incident.createdAt,
      incident.updatedAt
    ]);
    incStmt.free();

    await this.persistToStorage();
  }

  /**
   * Execute an arbitrary SQL query with timing and structured columns/rows
   */
  public async executeQuery(sql: string): Promise<SQLiteQueryResult> {
    const database = await this.getDatabase();
    const start = performance.now();

    try {
      const results = database.exec(sql);
      const executionTimeMs = Number((performance.now() - start).toFixed(2));

      if (results.length === 0) {
        return {
          columns: ['status'],
          rows: [['Query executed successfully with 0 result sets.']],
          rowCount: 0,
          executionTimeMs
        };
      }

      const first = results[0];
      return {
        columns: first.columns,
        rows: first.values,
        rowCount: first.values.length,
        executionTimeMs
      };
    } catch (err: any) {
      return {
        columns: ['error'],
        rows: [[err?.message || String(err)]],
        rowCount: 0,
        executionTimeMs: Number((performance.now() - start).toFixed(2)),
        error: err?.message || String(err)
      };
    }
  }

  /**
   * Retrieve live stats for SQLite tables and size
   */
  public async getStats(): Promise<SQLiteStats> {
    try {
      const database = await this.getDatabase();
      const tables = ['incidents', 'resources', 'assignments', 'critical_routes', 'alerts', 'offline_sync_queue'];
      const tableStats: SQLiteTableStat[] = [];
      let totalRows = 0;

      for (const t of tables) {
        try {
          const res = database.exec(`SELECT count(*) as count FROM ${t};`);
          const count = Number(res[0]?.values[0]?.[0] || 0);
          tableStats.push({ name: t, count });
          totalRows += count;
        } catch {
          tableStats.push({ name: t, count: 0 });
        }
      }

      const binary = database.export();
      return {
        isInitialized: true,
        totalTables: tableStats.length,
        totalRows,
        dbSizeBytes: binary.length,
        lastSavedAt: this.lastSavedAt,
        tables: tableStats
      };
    } catch {
      return {
        isInitialized: false,
        totalTables: 0,
        totalRows: 0,
        dbSizeBytes: 0,
        lastSavedAt: null,
        tables: []
      };
    }
  }

  /**
   * Export the SQLite database binary (.sqlite / .db)
   */
  public async exportDatabase(): Promise<Uint8Array> {
    const database = await this.getDatabase();
    return database.export();
  }

  /**
   * Download the SQLite database directly as a .sqlite file
   */
  public async downloadSQLiteFile(customFilename?: string): Promise<string> {
    const data = await this.exportDatabase();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = customFilename || `crisiscore_backup_${dateStr}.sqlite`;

    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Save snapshot record
    await this.createSnapshotRecord(`Export: ${filename}`, 'MANUAL', data.length);
    return filename;
  }

  /**
   * Restore/Import SQLite database from an uploaded .sqlite / .db binary file
   */
  public async restoreFromBinaryFile(fileData: Uint8Array, fileName: string): Promise<{
    success: boolean;
    incidents: Incident[];
    resources: Resource[];
    assignments: Assignment[];
    alerts: AlertMessage[];
    error?: string;
  }> {
    try {
      if (!this.SQL) {
        this.SQL = await this.getSqlStatic();
      }

      // Close existing db if open
      if (this.db) {
        try {
          this.db.close();
        } catch {}
      }

      const newDb = new this.SQL.Database(fileData);
      this.initSchema(newDb);
      this.db = newDb;

      // Extract restored records
      const incidents = this.queryIncidentsFromCurrentDb();
      const resources = this.queryResourcesFromCurrentDb();
      const assignments = this.queryAssignmentsFromCurrentDb();
      const alerts = this.queryAlertsFromCurrentDb();

      await this.persistToStorage();
      await this.createSnapshotRecord(`Restored: ${fileName}`, 'RESTORED', fileData.length);

      return {
        success: true,
        incidents,
        resources,
        assignments,
        alerts
      };
    } catch (err: any) {
      console.error('Failed to restore SQLite database from file:', err);
      return {
        success: false,
        incidents: [],
        resources: [],
        assignments: [],
        alerts: [],
        error: err?.message || 'Invalid SQLite file or corrupted schema'
      };
    }
  }

  /**
   * Parse incidents table back to Incident objects
   */
  public queryIncidentsFromCurrentDb(): Incident[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec(`
        SELECT incident_id, reporter_id, reporter_name, title, type, severity,
               urgency, location_name, latitude, longitude, affected_population,
               water_depth_meters, description, photo_url, status, priority_score,
               assigned_resource_id, assigned_resource_name, created_at, updated_at
        FROM incidents ORDER BY priority_score DESC;
      `);
      if (res.length === 0) return [];

      const rows = res[0].values;
      return rows.map((r) => ({
        incidentId: String(r[0]),
        reporterId: String(r[1] || 'system'),
        reporterName: String(r[2] || 'Emergency Dispatch'),
        title: String(r[3]),
        type: (r[4] as any) || 'FLOOD',
        severity: (r[5] as any) || 'CRITICAL',
        urgency: (r[6] as any) || 'IMMEDIATE',
        locationName: String(r[7]),
        latitude: Number(r[8]),
        longitude: Number(r[9]),
        affectedPopulation: Number(r[10] || 0),
        waterDepthMeters: Number(r[11] || 0),
        description: String(r[12] || ''),
        photoUrl: r[13] ? String(r[13]) : undefined,
        status: (r[14] as any) || 'REPORTED',
        priorityScore: Number(r[15] || 0),
        assignedResourceId: r[16] ? String(r[16]) : null,
        assignedResourceName: r[17] ? String(r[17]) : null,
        createdAt: String(r[18]),
        updatedAt: String(r[19])
      }));
    } catch {
      return [];
    }
  }

  /**
   * Parse resources table back to Resource objects
   */
  public queryResourcesFromCurrentDb(): Resource[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec(`
        SELECT resource_id, name, type, team_personnel, latitude, longitude,
               availability, capacity, contact_phone, current_incident_id, updated_at
        FROM resources;
      `);
      if (res.length === 0) return [];

      const rows = res[0].values;
      return rows.map((r) => ({
        resourceId: String(r[0]),
        name: String(r[1]),
        type: (r[2] as any) || 'RESCUE_BOAT',
        teamPersonnel: String(r[3] || ''),
        latitude: Number(r[4]),
        longitude: Number(r[5]),
        availability: (r[6] as any) || 'AVAILABLE',
        capacity: Number(r[7] || 0),
        contactPhone: String(r[8] || ''),
        currentIncidentId: r[9] ? String(r[9]) : null,
        updatedAt: String(r[10])
      }));
    } catch {
      return [];
    }
  }

  /**
   * Parse assignments table back to Assignment objects
   */
  public queryAssignmentsFromCurrentDb(): Assignment[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec(`
        SELECT assignment_id, incident_id, resource_id, resource_name,
               incident_title, priority, route_summary, distance_km,
               eta_minutes, status, assigned_at, updated_at
        FROM assignments;
      `);
      if (res.length === 0) return [];

      const rows = res[0].values;
      return rows.map((r) => ({
        assignmentId: String(r[0]),
        incidentId: String(r[1]),
        resourceId: String(r[2]),
        resourceName: String(r[3]),
        incidentTitle: String(r[4]),
        priority: String(r[5]),
        routeSummary: String(r[6] || ''),
        distanceKm: Number(r[7] || 0),
        etaMinutes: Number(r[8] || 0),
        status: (r[9] as any) || 'ASSIGNED',
        assignedAt: String(r[10]),
        updatedAt: String(r[11])
      }));
    } catch {
      return [];
    }
  }

  /**
   * Parse alerts table back to AlertMessage objects
   */
  public queryAlertsFromCurrentDb(): AlertMessage[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec(`
        SELECT alert_id, title, message, severity, incident_id,
               target_role, timestamp, is_read
        FROM alerts;
      `);
      if (res.length === 0) return [];

      const rows = res[0].values;
      return rows.map((r) => ({
        alertId: String(r[0]),
        title: String(r[1]),
        message: String(r[2]),
        severity: (r[3] as any) || 'INFO',
        incidentId: r[4] ? String(r[4]) : null,
        targetRole: String(r[5] || 'ALL'),
        timestamp: String(r[6]),
        isRead: Boolean(r[7])
      }));
    } catch {
      return [];
    }
  }

  /**
   * Snapshot Management
   */
  public async createSnapshotRecord(name: string, type: 'MANUAL' | 'AUTO' | 'RESTORED', sizeBytes: number): Promise<BackupSnapshotRecord> {
    const stats = await this.getStats();
    const snapshot: BackupSnapshotRecord = {
      backupId: `SNAP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      type,
      timestamp: new Date().toISOString(),
      recordCount: stats.totalRows,
      sizeBytes
    };

    const snapshots = this.getSnapshotHistory();
    snapshots.unshift(snapshot);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots.slice(0, 20)));
    return snapshot;
  }

  public getSnapshotHistory(): BackupSnapshotRecord[] {
    try {
      const raw = localStorage.getItem(SNAPSHOTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const sqliteBackupService = new SQLiteBackupService();
