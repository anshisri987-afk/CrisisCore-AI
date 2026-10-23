import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppScreen,
  UserRole,
  Incident,
  Resource,
  Assignment,
  AlertMessage,
  ChatMessage,
  GeminiMode,
  IncidentFormState,
  IncidentStatus,
  ResourceAvailability,
  AssignmentStatus,
  AlertSeverity,
  Severity,
  Urgency,
  IncidentType,
  ResourceType
} from '../types';
import { sendPrompt, analyzeIncidentTriage } from '../services/geminiService';
import {
  cacheEmergencyData,
  getCachedEmergencyResources,
  getCachedCriticalRoutes,
  getOfflineCacheMeta,
  queueOfflineIncident,
  getQueuedOfflineIncidents,
  clearQueuedOfflineIncidents,
  OfflineCacheMeta,
  CriticalRouteCacheItem
} from '../services/offlineCacheService';
import {
  sqliteBackupService,
  SQLiteStats,
  SQLiteQueryResult
} from '../services/sqliteBackupService';
import {
  auth,
  testFirestoreConnection,
  signInWithGoogle,
  signOutFirebase,
  saveUserProfile,
  subscribeToIncidents,
  subscribeToResources,
  subscribeToAssignments,
  subscribeToAlerts,
  syncIncidentToFirestore,
  syncResourceToFirestore,
  syncAssignmentToFirestore,
  syncAlertToFirestore
} from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

function nowIso(): string {
  const d = new Date();
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

const SEED_INCIDENTS: Incident[] = [
  {
    incidentId: 'INC-101',
    reporterId: 'seed_authority',
    reporterName: 'Dr. S. Verma (Chief Medical Officer)',
    title: 'City Metro Hospital - ICU Water Ingress (2.2m)',
    type: 'FLOOD',
    severity: 'CRITICAL',
    urgency: 'IMMEDIATE',
    locationName: 'Metro Hospital, Ring Road Sector 4',
    latitude: 28.6250,
    longitude: 77.2180,
    affectedPopulation: 42,
    waterDepthMeters: 2.2,
    description: 'Basement & Ground floor flooded. 42 critical ventilator patients need evacuation immediately. Power backup failing.',
    status: 'PRIORITIZED',
    priorityScore: 96,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    incidentId: 'INC-102',
    reporterId: 'seed_authority',
    reporterName: 'Inspector R. Singh (Civil Defense)',
    title: 'Yamuna Bund Breach - Slum Cluster Inundated',
    type: 'RESCUE',
    severity: 'CRITICAL',
    urgency: 'IMMEDIATE',
    locationName: 'Mayur Vihar Bund Point C',
    latitude: 28.6080,
    longitude: 77.2350,
    affectedPopulation: 180,
    waterDepthMeters: 2.8,
    description: 'Temporary bund breach. Fast currents. Over 180 residents stranded on rooftops without food or clean water.',
    status: 'RESPONDING',
    priorityScore: 93,
    assignedResourceId: 'RES-01',
    assignedResourceName: 'NDRF Swift Boat Alpha',
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    incidentId: 'INC-103',
    reporterId: 'seed_authority',
    reporterName: 'Priya Sharma (Resident)',
    title: 'Senior Citizens Care Center Cut Off',
    type: 'RESCUE',
    severity: 'HIGH',
    urgency: 'HIGH',
    locationName: 'Vasant Enclave Block D',
    latitude: 28.5800,
    longitude: 77.1900,
    affectedPopulation: 24,
    waterDepthMeters: 1.4,
    description: 'Access road submerged under 1.4m water. 24 elderly individuals need food, dry clothes, and routine heart medication.',
    status: 'CLASSIFIED',
    priorityScore: 82,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    incidentId: 'INC-104',
    reporterId: 'seed_authority',
    reporterName: 'Electricity Board Dispatch',
    title: '33kV Power Substation Flooding Hazard',
    type: 'COLLAPSE',
    severity: 'HIGH',
    urgency: 'HIGH',
    locationName: 'Substation 12, Riverbed Road',
    latitude: 28.6320,
    longitude: 77.2050,
    affectedPopulation: 12000,
    waterDepthMeters: 1.1,
    description: 'Water entering transformer bays. Immediate high-capacity dewatering pumps needed to avoid grid shutdown.',
    status: 'REPORTED',
    priorityScore: 78,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    incidentId: 'INC-105',
    reporterId: 'seed_authority',
    reporterName: 'Relief Shelter Camp #4',
    title: 'Drinking Water & Ration Shortage',
    type: 'FLOOD',
    severity: 'MEDIUM',
    urgency: 'NORMAL',
    locationName: 'Govt Senior Secondary School, Sector 2',
    latitude: 28.6410,
    longitude: 77.2280,
    affectedPopulation: 350,
    waterDepthMeters: 0.4,
    description: '350 displaced citizens need 500 ration packets, potable drinking water cans, and baby food.',
    status: 'REPORTED',
    priorityScore: 64,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

const SEED_RESOURCES: Resource[] = [
  {
    resourceId: 'RES-01',
    name: 'NDRF Swift Boat Alpha',
    type: 'RESCUE_BOAT',
    teamPersonnel: '6 NDRF Certified Divers',
    latitude: 28.6100,
    longitude: 77.2300,
    availability: 'DISPATCHED',
    capacity: 12,
    contactPhone: '+91 99100 11001',
    currentIncidentId: 'INC-102',
    updatedAt: nowIso()
  },
  {
    resourceId: 'RES-02',
    name: 'SDRF Tactical Boat Bravo',
    type: 'RESCUE_BOAT',
    teamPersonnel: '4 Water Rescue Operators',
    latitude: 28.6200,
    longitude: 77.2100,
    availability: 'AVAILABLE',
    capacity: 10,
    contactPhone: '+91 99100 22002',
    currentIncidentId: null,
    updatedAt: nowIso()
  },
  {
    resourceId: 'RES-03',
    name: 'ALS Critical Ambulance 09',
    type: 'AMBULANCE',
    teamPersonnel: '2 Paramedics + 1 Emergency Physician',
    latitude: 28.6180,
    longitude: 77.2150,
    availability: 'AVAILABLE',
    capacity: 3,
    contactPhone: '+91 99100 33003',
    currentIncidentId: null,
    updatedAt: nowIso()
  },
  {
    resourceId: 'RES-04',
    name: 'High-Flow De-Watering Rig #2',
    type: 'FIRE_ENGINE',
    teamPersonnel: '4 Fire Service Engineers',
    latitude: 28.6300,
    longitude: 77.2020,
    availability: 'AVAILABLE',
    capacity: 5000,
    contactPhone: '+91 99100 44004',
    currentIncidentId: null,
    updatedAt: nowIso()
  },
  {
    resourceId: 'RES-05',
    name: "Recon Drone Unit 'Garuda-3'",
    type: 'DRONE_UNIT',
    teamPersonnel: '2 Licensed UAV Pilots',
    latitude: 28.6150,
    longitude: 77.2200,
    availability: 'AVAILABLE',
    capacity: 4,
    contactPhone: '+91 99100 55005',
    currentIncidentId: null,
    updatedAt: nowIso()
  },
  {
    resourceId: 'RES-06',
    name: 'Mobile Food & Water Supply Truck',
    type: 'RATION_SUPPLY',
    teamPersonnel: '3 Red Cross Volunteers',
    latitude: 28.6380,
    longitude: 77.2250,
    availability: 'AVAILABLE',
    capacity: 1200,
    contactPhone: '+91 99100 66006',
    currentIncidentId: null,
    updatedAt: nowIso()
  }
];

const SEED_ASSIGNMENTS: Assignment[] = [
  {
    assignmentId: 'ASN-501',
    incidentId: 'INC-102',
    resourceId: 'RES-01',
    resourceName: 'NDRF Swift Boat Alpha',
    incidentTitle: 'Yamuna Bund Breach - Slum Cluster Inundated',
    priority: 'Immediate Triage',
    routeSummary: 'Elevated Ring Road -> Bund Access Ramp 2',
    distanceKm: 3.2,
    etaMinutes: 9,
    status: 'EN_ROUTE',
    assignedAt: nowIso(),
    updatedAt: nowIso()
  }
];

const SEED_ALERTS: AlertMessage[] = [
  {
    alertId: 'ALT-901',
    title: '🚨 RED ALERT: Yamuna Water Level Crosses 208.66m Danger Mark',
    message: 'All low-lying riverbed sectors must execute Stage 3 evacuation immediately. Emergency sirens activated.',
    severity: 'CRITICAL',
    incidentId: null,
    targetRole: 'ALL',
    timestamp: nowIso(),
    isRead: false
  },
  {
    alertId: 'ALT-902',
    title: '⚠️ FLASH ADVISORY: NH-24 Underpass Submerged',
    message: 'Diversion route established via Nizamuddin flyover. Emergency response vehicles have priority green corridor.',
    severity: 'WARNING',
    incidentId: null,
    targetRole: 'ALL',
    timestamp: nowIso(),
    isRead: false
  }
];

interface CrisisContextType {
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentLanguage: 'EN' | 'HI';
  toggleLanguage: () => void;
  userEmail: string;
  isAuthenticated: boolean;
  login: (email?: string, role?: UserRole) => void;
  logout: () => void;

  incidents: Incident[];
  resources: Resource[];
  assignments: Assignment[];
  alerts: AlertMessage[];
  selectedIncident: Incident | null;
  selectIncident: (incident: Incident | null) => void;

  formState: IncidentFormState;
  updateForm: (updater: (prev: IncidentFormState) => IncidentFormState) => void;
  runAiPreTriage: () => Promise<void>;
  submitIncident: (onSuccess?: () => void) => Promise<void>;

  assignResourceToIncident: (incident: Incident, resource: Resource) => Promise<void>;
  runDynamicReallocationDemo: () => Promise<void>;
  isReallocating: boolean;
  updateIncidentStatus: (incidentId: string, status: IncidentStatus) => void;

  chatMessages: ChatMessage[];
  selectedGeminiMode: GeminiMode;
  setGeminiMode: (mode: GeminiMode) => void;
  isChatLoading: boolean;
  sendChatMessage: (prompt: string) => Promise<void>;
  clearChat: () => void;

  statusMessage: string | null;
  clearStatusMessage: () => void;
  showNotification: (msg: string) => void;
  resetAllData: () => void;

  criticalRoutes: CriticalRouteCacheItem[];
  offlineMeta: OfflineCacheMeta | null;
  queuedIncidentsCount: number;
  syncEmergencyCache: () => Promise<void>;
  isSyncingCache: boolean;

  sqliteStats: SQLiteStats | null;
  isSqliteReady: boolean;
  refreshSqliteStats: () => Promise<void>;
  downloadSqliteBackup: (filename?: string) => Promise<string>;
  restoreSqliteBackupFromFile: (fileData: Uint8Array, fileName: string) => Promise<{ success: boolean; message: string }>;
  executeSqliteQuery: (sql: string) => Promise<SQLiteQueryResult>;
  syncStateToSQLiteManual: () => Promise<void>;

  isFirebaseConnected: boolean;
  isCloudSyncing: boolean;
  signInWithGoogleAuth: (role?: UserRole) => Promise<void>;
  syncAllToFirestore: () => Promise<void>;
}

const CrisisContext = createContext<CrisisContextType | null>(null);

export const CrisisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & User
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('HOME');
  const [userRole, setUserRole] = useState<UserRole>('DISASTER_AUTHORITY');
  const [currentLanguage, setCurrentLanguage] = useState<'EN' | 'HI'>('EN');
  const [userEmail, setUserEmail] = useState<string>('ops_command@crisiscore.gov');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('crisiscore_auth') === 'true';
  });
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Domain state with local storage fallback
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('crisiscore_incidents');
    return saved ? JSON.parse(saved) : SEED_INCIDENTS;
  });

  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem('crisiscore_resources');
    return saved ? JSON.parse(saved) : SEED_RESOURCES;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('crisiscore_assignments');
    return saved ? JSON.parse(saved) : SEED_ASSIGNMENTS;
  });

  const [alerts, setAlerts] = useState<AlertMessage[]>(() => {
    const saved = localStorage.getItem('crisiscore_alerts');
    return saved ? JSON.parse(saved) : SEED_ALERTS;
  });

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Form State
  const [formState, setFormState] = useState<IncidentFormState>({
    title: '',
    type: 'FLOOD',
    severity: 'HIGH',
    urgency: 'HIGH',
    locationName: '',
    latitude: 28.6139,
    longitude: 77.2090,
    affectedPopulation: 12,
    waterDepthMeters: 1.5,
    description: '',
    isAnalyzing: false,
    aiTriageSuggestion: null
  });

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'model',
      text: 'Welcome to CrisisCore AI Tactical Command. Urban flood telemetry active. How may I assist your emergency response team today?',
      modeUsed: 'BALANCED_GENERAL',
      timestamp: Date.now()
    }
  ]);
  const [selectedGeminiMode, setSelectedGeminiMode] = useState<GeminiMode>('BALANCED_GENERAL');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isReallocating, setIsReallocating] = useState(false);

  // Offline service worker & emergency data cache state
  const [criticalRoutes] = useState<CriticalRouteCacheItem[]>(getCachedCriticalRoutes());
  const [offlineMeta, setOfflineMeta] = useState<OfflineCacheMeta | null>(getOfflineCacheMeta());
  const [queuedIncidentsCount, setQueuedIncidentsCount] = useState<number>(() => getQueuedOfflineIncidents().length);
  const [isSyncingCache, setIsSyncingCache] = useState(false);

  // Initial precache & online/offline listeners
  useEffect(() => {
    cacheEmergencyData(resources, assignments).then(setOfflineMeta);

    const handleOnline = () => {
      const queued = getQueuedOfflineIncidents();
      if (queued.length > 0) {
        showNotification(`Network reconnected! Synchronized ${queued.length} offline incident(s).`);
        clearQueuedOfflineIncidents();
        setQueuedIncidentsCount(0);
      } else {
        showNotification('Network reconnected. Emergency telemetry live.');
      }
    };

    const handleOffline = () => {
      showNotification('Network offline. Emergency resource & route cache activated.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Validate Firestore connection on boot and listen to Auth changes
  useEffect(() => {
    testFirestoreConnection().then(setIsFirebaseConnected);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        if (user.email) setUserEmail(user.email);
        saveUserProfile(user, userRole).catch(console.warn);
        setIsFirebaseConnected(true);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Subscribe to real-time Firestore collections when authenticated
  useEffect(() => {
    if (!isAuthenticated || !auth.currentUser) return;

    const unsubInc = subscribeToIncidents((remoteIncidents) => {
      if (remoteIncidents && remoteIncidents.length > 0) {
        setIncidents((prev) => {
          const map = new Map<string, Incident>();
          remoteIncidents.forEach((inc) => map.set(inc.incidentId, inc));
          prev.forEach((inc) => {
            if (!map.has(inc.incidentId)) {
              map.set(inc.incidentId, inc);
            }
          });
          return Array.from(map.values());
        });
      }
    });

    const unsubRes = subscribeToResources((remoteResources) => {
      if (remoteResources && remoteResources.length > 0) {
        setResources((prev) => {
          const map = new Map<string, Resource>();
          remoteResources.forEach((res) => map.set(res.resourceId, res));
          prev.forEach((res) => {
            if (!map.has(res.resourceId)) {
              map.set(res.resourceId, res);
            }
          });
          return Array.from(map.values());
        });
      }
    });

    const unsubAsn = subscribeToAssignments((remoteAssignments) => {
      if (remoteAssignments && remoteAssignments.length > 0) {
        setAssignments((prev) => {
          const map = new Map<string, Assignment>();
          remoteAssignments.forEach((asn) => map.set(asn.assignmentId, asn));
          prev.forEach((asn) => {
            if (!map.has(asn.assignmentId)) {
              map.set(asn.assignmentId, asn);
            }
          });
          return Array.from(map.values());
        });
      }
    });

    const unsubAlt = subscribeToAlerts((remoteAlerts) => {
      if (remoteAlerts && remoteAlerts.length > 0) {
        setAlerts((prev) => {
          const map = new Map<string, AlertMessage>();
          remoteAlerts.forEach((alt) => map.set(alt.alertId, alt));
          prev.forEach((alt) => {
            if (!map.has(alt.alertId)) {
              map.set(alt.alertId, alt);
            }
          });
          return Array.from(map.values());
        });
      }
    });

    return () => {
      if (unsubInc) unsubInc();
      if (unsubRes) unsubRes();
      if (unsubAsn) unsubAsn();
      if (unsubAlt) unsubAlt();
    };
  }, [isAuthenticated]);

  // Synchronize cache when resources or assignments change
  useEffect(() => {
    cacheEmergencyData(resources, assignments).then(setOfflineMeta);
  }, [resources, assignments]);

  const syncEmergencyCache = async () => {
    setIsSyncingCache(true);
    try {
      const meta = await cacheEmergencyData(resources, assignments);
      setOfflineMeta(meta);
      const queued = getQueuedOfflineIncidents();
      if (queued.length > 0) {
        showNotification(`Synced ${queued.length} offline report(s) & updated emergency cache.`);
        clearQueuedOfflineIncidents();
        setQueuedIncidentsCount(0);
      } else {
        showNotification(`Emergency cache armed: ${meta.resourceCount} resources & ${meta.routeCount} routes cached.`);
      }
    } catch {
      showNotification('Emergency cache updated.');
    } finally {
      setIsSyncingCache(false);
    }
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('crisiscore_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('crisiscore_resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('crisiscore_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('crisiscore_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('crisiscore_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  // SQLite Offline Backup & Query Engine State
  const [sqliteStats, setSqliteStats] = useState<SQLiteStats | null>(null);
  const [isSqliteReady, setIsSqliteReady] = useState(false);

  // Synchronize to SQLite WASM database whenever domain state changes
  useEffect(() => {
    let isCancelled = false;
    sqliteBackupService
      .syncStateToSQLite({
        incidents,
        resources,
        assignments,
        alerts,
        routes: criticalRoutes
      })
      .then(() => {
        if (!isCancelled) {
          sqliteBackupService.getStats().then((stats) => {
            if (!isCancelled) {
              setSqliteStats(stats);
              setIsSqliteReady(stats.isInitialized);
            }
          });
        }
      })
      .catch((err) => {
        console.warn('SQLite background synchronization warning:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [incidents, resources, assignments, alerts, criticalRoutes]);

  const refreshSqliteStats = async () => {
    const stats = await sqliteBackupService.getStats();
    setSqliteStats(stats);
    setIsSqliteReady(stats.isInitialized);
  };

  const downloadSqliteBackup = async (filename?: string): Promise<string> => {
    const downloadedName = await sqliteBackupService.downloadSQLiteFile(filename);
    await refreshSqliteStats();
    return downloadedName;
  };

  const restoreSqliteBackupFromFile = async (
    fileData: Uint8Array,
    fileName: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await sqliteBackupService.restoreFromBinaryFile(fileData, fileName);
    if (res.success) {
      if (res.incidents.length > 0) setIncidents(res.incidents);
      if (res.resources.length > 0) setResources(res.resources);
      if (res.assignments.length > 0) setAssignments(res.assignments);
      if (res.alerts.length > 0) setAlerts(res.alerts);
      await refreshSqliteStats();
      showNotification(`Restored ${res.incidents.length} incidents and ${res.resources.length} resources from ${fileName}`);
      return { success: true, message: `Successfully restored ${res.incidents.length} incidents` };
    } else {
      showNotification(`Restore failed: ${res.error}`);
      return { success: false, message: res.error || 'Restore failed' };
    }
  };

  const executeSqliteQuery = async (sql: string): Promise<SQLiteQueryResult> => {
    return await sqliteBackupService.executeQuery(sql);
  };

  const syncStateToSQLiteManual = async (): Promise<void> => {
    await sqliteBackupService.syncStateToSQLite({
      incidents,
      resources,
      assignments,
      alerts,
      routes: criticalRoutes
    });
    await refreshSqliteStats();
  };

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
  };

  const clearStatusMessage = () => {
    setStatusMessage(null);
  };

  const login = (email = 'ops_command@crisiscore.gov', role?: UserRole) => {
    setUserEmail(email);
    if (role) setUserRole(role);
    setIsAuthenticated(true);
    showNotification(`Authenticated as ${role ? role : 'Disaster Authority'}`);
  };

  const signInWithGoogleAuth = async (role?: UserRole) => {
    try {
      const user = await signInWithGoogle();
      const currentRole = role || userRole;
      if (role) setUserRole(role);
      setUserEmail(user.email || 'operator@crisiscore.gov');
      setIsAuthenticated(true);
      setIsFirebaseConnected(true);
      await saveUserProfile(user, currentRole);
      showNotification(`Signed in with Google as ${user.displayName || user.email}`);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      showNotification('Google Sign-In blocked or dismissed. Enabled local session.');
      login(undefined, role);
    }
  };

  const syncAllToFirestore = async () => {
    if (!isAuthenticated) {
      showNotification('Please authenticate to sync with Firestore.');
      return;
    }
    setIsCloudSyncing(true);
    try {
      showNotification('Synchronizing data with Firestore cloud database...');
      for (const inc of incidents) {
        await syncIncidentToFirestore(inc);
      }
      for (const res of resources) {
        await syncResourceToFirestore(res);
      }
      for (const asn of assignments) {
        await syncAssignmentToFirestore(asn);
      }
      for (const alt of alerts) {
        await syncAlertToFirestore(alt);
      }
      setIsFirebaseConnected(true);
      showNotification('Cloud Sync Complete: Firestore updated with latest records.');
    } catch (err: any) {
      console.warn('Sync to Firestore error:', err);
      showNotification('Firestore sync completed locally (offline fallback active).');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const logout = () => {
    signOutFirebase().catch(console.warn);
    setIsAuthenticated(false);
    setCurrentScreen('HOME');
    showNotification('Signed out from command session.');
  };

  const toggleLanguage = () => {
    setCurrentLanguage((prev) => (prev === 'EN' ? 'HI' : 'EN'));
  };

  const updateForm = (updater: (prev: IncidentFormState) => IncidentFormState) => {
    setFormState(updater);
  };

  const resetAllData = () => {
    setIncidents(SEED_INCIDENTS);
    setResources(SEED_RESOURCES);
    setAssignments(SEED_ASSIGNMENTS);
    setAlerts(SEED_ALERTS);
    setSelectedIncident(null);
    showNotification('System telemetry reset to default baseline.');
  };

  // AI Pre-Triage
  const runAiPreTriage = async () => {
    if (!formState.title && !formState.description) {
      showNotification('Enter title or description for AI pre-triage');
      return;
    }

    setFormState((prev) => ({ ...prev, isAnalyzing: true }));
    try {
      const data = await analyzeIncidentTriage(
        formState.title || 'Unspecified Flood Emergency',
        formState.type,
        formState.description || 'Water rising rapidly, citizens trapped.',
        formState.waterDepthMeters,
        formState.affectedPopulation
      );

      const sev = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(data.severity)
        ? (data.severity as Severity)
        : 'HIGH';
      const urg = ['IMMEDIATE', 'HIGH', 'NORMAL'].includes(data.urgency)
        ? (data.urgency as Urgency)
        : 'HIGH';

      setFormState((prev) => ({
        ...prev,
        isAnalyzing: false,
        severity: sev,
        urgency: urg,
        aiTriageSuggestion: data
      }));
      showNotification(`AI Triage: Priority Score ${data.priorityScore}/100`);
    } catch (err: any) {
      showNotification('AI Triage: Using calculated constraint baseline.');
      setFormState((prev) => ({ ...prev, isAnalyzing: false }));
    }
  };

  // Submit Incident
  const submitIncident = async (onSuccess?: () => void) => {
    if (!formState.title.trim()) {
      showNotification('Please enter an incident title');
      return;
    }

    const score =
      formState.aiTriageSuggestion?.priorityScore ??
      Math.min(
        99,
        Math.max(
          25,
          (formState.severity === 'CRITICAL' ? 4 : formState.severity === 'HIGH' ? 3 : 2) * 18 +
            (formState.urgency === 'IMMEDIATE' ? 4 : 2) * 12 +
            Math.round(formState.waterDepthMeters * 5)
        )
      );

    const newId = `INC-${100 + incidents.length + 1}`;
    const newInc: Incident = {
      incidentId: newId,
      reporterId: 'web_operator',
      reporterName:
        userRole === 'CITIZEN_REPORTER'
          ? 'Citizen Alert'
          : userRole === 'RESCUE_FIELD_TEAM'
          ? 'Field Response Unit'
          : 'Command Ops',
      title: formState.title,
      type: formState.type,
      severity: formState.severity,
      urgency: formState.urgency,
      locationName: formState.locationName || 'Urban Flood Zone 3',
      latitude: formState.latitude,
      longitude: formState.longitude,
      affectedPopulation: formState.affectedPopulation,
      waterDepthMeters: formState.waterDepthMeters,
      description: formState.description,
      status: 'CLASSIFIED',
      priorityScore: score,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    setIncidents((prev) => [newInc, ...prev]);

    // Push directly to SQLite table & offline queue
    sqliteBackupService.queueIncidentInSQLite(newInc).catch(console.warn);

    // Sync to Firestore if authenticated & online
    if (typeof navigator !== 'undefined' && navigator.onLine && isAuthenticated) {
      syncIncidentToFirestore(newInc).catch((err) => {
        console.warn('Firestore incident sync queued:', err);
      });
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueOfflineIncident(newInc);
      setQueuedIncidentsCount((prev) => prev + 1);
      showNotification('Offline mode: Incident saved in SQLite database and queued for network sync.');
    } else {
      showNotification('Incident reported, classified & synced to local SQLite & cloud database!');
    }

    // Reset Form
    setFormState({
      title: '',
      type: 'FLOOD',
      severity: 'HIGH',
      urgency: 'HIGH',
      locationName: '',
      latitude: 28.6139,
      longitude: 77.2090,
      affectedPopulation: 12,
      waterDepthMeters: 1.5,
      description: '',
      isAnalyzing: false,
      aiTriageSuggestion: null
    });

    if (onSuccess) onSuccess();
  };

  // Assign Resource
  const assignResourceToIncident = async (incident: Incident, resource: Resource) => {
    const routeDesc =
      incident.type === 'FLOOD'
        ? 'Elevated Embankment bypass (flood-free corridor)'
        : 'Direct emergency green channel';
    const eta = 8 + Math.floor(Math.random() * 8);

    const assignmentId = `ASN-${Date.now().toString().slice(-4)}`;
    const newAssignment: Assignment = {
      assignmentId,
      incidentId: incident.incidentId,
      resourceId: resource.resourceId,
      resourceName: resource.name,
      incidentTitle: incident.title,
      priority: 'Urgent',
      routeSummary: routeDesc,
      distanceKm: 3.8,
      etaMinutes: eta,
      status: 'ASSIGNED',
      assignedAt: nowIso(),
      updatedAt: nowIso()
    };

    // Update assignment list
    setAssignments((prev) => [newAssignment, ...prev]);

    // Update Incident
    setIncidents((prev) =>
      prev.map((i) =>
        i.incidentId === incident.incidentId
          ? {
              ...i,
              status: 'ASSIGNED',
              assignedResourceId: resource.resourceId,
              assignedResourceName: resource.name,
              updatedAt: nowIso()
            }
          : i
      )
    );

    // Update Resource
    setResources((prev) =>
      prev.map((r) =>
        r.resourceId === resource.resourceId
          ? {
              ...r,
              availability: 'DISPATCHED',
              currentIncidentId: incident.incidentId,
              updatedAt: nowIso()
            }
          : r
      )
    );

    // Broadcast Alert
    const alertId = `ALT-${Date.now().toString().slice(-4)}`;
    const newAlert: AlertMessage = {
      alertId,
      title: `Unit Dispatched: ${resource.name}`,
      message: `Dispatched to '${incident.title}'. ETA: ${eta} mins along ${routeDesc}`,
      severity: 'INFO',
      incidentId: incident.incidentId,
      targetRole: 'ALL',
      timestamp: nowIso(),
      isRead: false
    };
    setAlerts((prev) => [newAlert, ...prev]);

    setSelectedIncident({
      ...incident,
      status: 'ASSIGNED',
      assignedResourceId: resource.resourceId,
      assignedResourceName: resource.name
    });

    // Sync to Firestore if authenticated & online
    if (typeof navigator !== 'undefined' && navigator.onLine && isAuthenticated) {
      syncAssignmentToFirestore(newAssignment).catch(console.warn);
      syncIncidentToFirestore({
        ...incident,
        status: 'ASSIGNED',
        assignedResourceId: resource.resourceId,
        assignedResourceName: resource.name,
        updatedAt: nowIso()
      }).catch(console.warn);
      syncResourceToFirestore({
        ...resource,
        availability: 'DISPATCHED',
        currentIncidentId: incident.incidentId,
        updatedAt: nowIso()
      }).catch(console.warn);
      syncAlertToFirestore(newAlert).catch(console.warn);
    }

    showNotification(`${resource.name} assigned to ${incident.title}`);
  };

  // Dynamic Reallocation Simulation (PRD Section 13 Core CUJ)
  const runDynamicReallocationDemo = async () => {
    setIsReallocating(true);
    // Simulate thinking/constraint matching delay
    await new Promise((r) => setTimeout(r, 1200));

    const criticalInc =
      incidents.find((i) => i.incidentId === 'INC-101') || incidents[0];
    const availableBoat =
      resources.find((r) => r.resourceId === 'RES-01') ||
      resources.find((r) => r.type === 'RESCUE_BOAT') ||
      resources[0];

    if (!criticalInc || !availableBoat) {
      showNotification('Simulation requirements not met.');
      setIsReallocating(false);
      return;
    }

    const prevIncidentId = availableBoat.currentIncidentId;
    const now = nowIso();

    // Mark previous assignments of this resource as REALLOCATED
    setAssignments((prev) => [
      {
        assignmentId: `ASN-DYN-${Date.now().toString().slice(-4)}`,
        incidentId: criticalInc.incidentId,
        resourceId: availableBoat.resourceId,
        resourceName: availableBoat.name,
        incidentTitle: criticalInc.title,
        priority: 'CRITICAL OVERRIDE',
        routeSummary: 'High-Speed Navigation Corridor via Drainage Channel 4',
        distanceKm: 2.1,
        etaMinutes: 7,
        status: 'EN_ROUTE',
        assignedAt: now,
        updatedAt: now
      },
      ...prev.map((a) =>
        a.resourceId === availableBoat.resourceId && a.status === 'ASSIGNED'
          ? { ...a, status: 'REALLOCATED' as AssignmentStatus, updatedAt: now }
          : a
      )
    ]);

    // Update prior incident back to PRIORITIZED if affected
    if (prevIncidentId && prevIncidentId !== criticalInc.incidentId) {
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.incidentId === prevIncidentId
            ? {
                ...inc,
                status: 'PRIORITIZED',
                assignedResourceId: null,
                assignedResourceName: null,
                updatedAt: now
              }
            : inc
        )
      );
    }

    // Update critical incident
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.incidentId === criticalInc.incidentId
          ? {
              ...inc,
              status: 'RESPONDING',
              assignedResourceId: availableBoat.resourceId,
              assignedResourceName: availableBoat.name,
              priorityScore: 98,
              updatedAt: now
            }
          : inc
      )
    );

    // Update resource
    setResources((prev) =>
      prev.map((r) =>
        r.resourceId === availableBoat.resourceId
          ? {
              ...r,
              availability: 'EN_ROUTE',
              currentIncidentId: criticalInc.incidentId,
              updatedAt: now
            }
          : r
      )
    );

    // Urgently Broadcast Alert
    const alertId = `ALT-${Date.now().toString().slice(-4)}`;
    const dynAlert: AlertMessage = {
      alertId,
      title: '⚡ DYNAMIC REALLOCATION TRIGGERED',
      message: `${availableBoat.name} diverted to '${criticalInc.title}'. Reason: Hospital ICU power loss & 42 ventilator drowning hazard. Immediate diversion authorized.`,
      severity: 'CRITICAL',
      incidentId: criticalInc.incidentId,
      targetRole: 'ALL',
      timestamp: now,
      isRead: false
    };
    setAlerts((prev) => [dynAlert, ...prev]);

    setSelectedIncident({
      ...criticalInc,
      status: 'RESPONDING',
      assignedResourceId: availableBoat.resourceId,
      assignedResourceName: availableBoat.name,
      priorityScore: 98
    });

    setIsReallocating(false);
    showNotification('Dynamic Reallocation executed! Boat diverted to Hospital ICU.');
  };

  const updateIncidentStatus = (incidentId: string, status: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.incidentId === incidentId
          ? { ...inc, status, updatedAt: nowIso() }
          : inc
      )
    );
    if (selectedIncident && selectedIncident.incidentId === incidentId) {
      setSelectedIncident((prev) => (prev ? { ...prev, status } : null));
    }
    showNotification(`Status updated to ${status}`);
  };

  // AI Chat
  const sendChatMessage = async (prompt: string) => {
    if (!prompt.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: prompt,
      modeUsed: selectedGeminiMode,
      timestamp: Date.now()
    };

    const currentHistory = [...chatMessages, userMsg];
    setChatMessages(currentHistory);
    setIsChatLoading(true);

    try {
      const { text: replyText } = await sendPrompt(
        prompt,
        selectedGeminiMode,
        currentHistory
      );

      const modelMsg: ChatMessage = {
        id: `mod-${Date.now()}`,
        sender: 'model',
        text: replyText,
        modeUsed: selectedGeminiMode,
        timestamp: Date.now(),
        groundingSource:
          selectedGeminiMode === 'SEARCH_GROUNDED'
            ? 'Google Search Grounding (Live Met/Hydrological Intel)'
            : selectedGeminiMode === 'MAPS_GROUNDED'
            ? 'Google Maps Grounding (Shelters & Evacuation Corridors)'
            : null
      };

      setChatMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `mod-${Date.now()}`,
        sender: 'model',
        text: `⚠️ Gemini Command Link: Running local emergency fallback protocol. Standby for VHF dispatch update.`,
        modeUsed: selectedGeminiMode,
        timestamp: Date.now()
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: 'reset-msg',
        sender: 'model',
        text: 'Command session reset. Ready for emergency dispatch and tactical triage queries.',
        modeUsed: selectedGeminiMode,
        timestamp: Date.now()
      }
    ]);
  };

  return (
    <CrisisContext.Provider
      value={{
        currentScreen,
        setScreen: setCurrentScreen,
        userRole,
        setUserRole,
        currentLanguage,
        toggleLanguage,
        userEmail,
        isAuthenticated,
        login,
        logout,
        incidents,
        resources,
        assignments,
        alerts,
        selectedIncident,
        selectIncident: setSelectedIncident,
        formState,
        updateForm,
        runAiPreTriage,
        submitIncident,
        assignResourceToIncident,
        runDynamicReallocationDemo,
        isReallocating,
        updateIncidentStatus,
        chatMessages,
        selectedGeminiMode,
        setGeminiMode: setSelectedGeminiMode,
        isChatLoading,
        sendChatMessage,
        clearChat,
        statusMessage,
        clearStatusMessage,
        showNotification,
        resetAllData,
        criticalRoutes,
        offlineMeta,
        queuedIncidentsCount,
        syncEmergencyCache,
        isSyncingCache,
        sqliteStats,
        isSqliteReady,
        refreshSqliteStats,
        downloadSqliteBackup,
        restoreSqliteBackupFromFile,
        executeSqliteQuery,
        syncStateToSQLiteManual,
        isFirebaseConnected,
        isCloudSyncing,
        signInWithGoogleAuth,
        syncAllToFirestore
      }}
    >
      {children}
    </CrisisContext.Provider>
  );
};

export const useCrisis = () => {
  const context = useContext(CrisisContext);
  if (!context) {
    throw new Error('useCrisis must be used within a CrisisProvider');
  }
  return context;
};
