import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Incident, Resource, Assignment, AlertMessage, UserRole } from '../types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId to getFirestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Provider for Google Login
export const googleAuthProvider = new GoogleAuthProvider();

// Error Handling specification according to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connectivity on initial boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase: The client is offline or configuration unreachable.');
      return false;
    }
    // If permission or other error, network reached server
    return true;
  }
}

// Google Sign-In with popup
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    return cred.user;
  } catch (error) {
    console.error('Firebase Google Sign-In error:', error);
    throw error;
  }
}

// Sign-out
export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out error:', error);
    throw error;
  }
}

// Sync user profile to Firestore
export async function saveUserProfile(
  user: FirebaseUser,
  role: UserRole,
  phone = '',
  language = 'en'
): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        userId: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Responder',
        email: user.email || '',
        role: role.toLowerCase(),
        phone: phone || user.phoneNumber || '',
        language,
        createdAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Incident synchronization
export async function syncIncidentToFirestore(incident: Incident): Promise<void> {
  const path = `incidents/${incident.incidentId}`;
  try {
    await setDoc(doc(db, 'incidents', incident.incidentId), {
      ...incident,
      // Ensure lower-case alignment with blueprint enum if needed
      type: incident.type.toLowerCase(),
      severity: incident.severity.toLowerCase(),
      urgency: incident.urgency.toLowerCase(),
      status: incident.status.toLowerCase()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Resource synchronization
export async function syncResourceToFirestore(resource: Resource): Promise<void> {
  const path = `resources/${resource.resourceId}`;
  try {
    await setDoc(doc(db, 'resources', resource.resourceId), {
      ...resource,
      type: resource.type.toLowerCase(),
      availability: resource.availability.toLowerCase()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Assignment synchronization
export async function syncAssignmentToFirestore(assignment: Assignment): Promise<void> {
  const path = `assignments/${assignment.assignmentId}`;
  try {
    await setDoc(doc(db, 'assignments', assignment.assignmentId), {
      ...assignment,
      status: assignment.status.toLowerCase()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Alert synchronization
export async function syncAlertToFirestore(alert: AlertMessage): Promise<void> {
  const path = `alerts/${alert.alertId}`;
  try {
    await setDoc(doc(db, 'alerts', alert.alertId), {
      ...alert,
      severity: alert.severity.toLowerCase()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to real-time changes
export function subscribeToIncidents(
  onData: (incidents: Incident[]) => void
): Unsubscribe | null {
  if (!auth.currentUser) return null;
  const path = 'incidents';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Incident[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            incidentId: data.incidentId || d.id,
            reporterId: data.reporterId || '',
            reporterName: data.reporterName || 'Field Unit',
            title: data.title || '',
            type: (data.type?.toUpperCase() as any) || 'FLOOD',
            severity: (data.severity?.toUpperCase() as any) || 'HIGH',
            urgency: (data.urgency?.toUpperCase() as any) || 'HIGH',
            locationName: data.locationName || '',
            latitude: Number(data.latitude) || 28.6139,
            longitude: Number(data.longitude) || 77.209,
            affectedPopulation: Number(data.affectedPopulation) || 0,
            waterDepthMeters: Number(data.waterDepthMeters) || 0,
            description: data.description || '',
            photoUrl: data.photoUrl,
            status: (data.status?.toUpperCase() as any) || 'REPORTED',
            priorityScore: Number(data.priorityScore) || 50,
            assignedResourceId: data.assignedResourceId || null,
            assignedResourceName: data.assignedResourceName || null,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        });
        if (list.length > 0) {
          onData(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToResources(
  onData: (resources: Resource[]) => void
): Unsubscribe | null {
  if (!auth.currentUser) return null;
  const path = 'resources';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Resource[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            resourceId: data.resourceId || d.id,
            name: data.name || '',
            type: (data.type?.toUpperCase() as any) || 'RESCUE_BOAT',
            teamPersonnel: data.teamPersonnel || '',
            latitude: Number(data.latitude) || 28.6139,
            longitude: Number(data.longitude) || 77.209,
            availability: (data.availability?.toUpperCase() as any) || 'AVAILABLE',
            capacity: Number(data.capacity) || 0,
            contactPhone: data.contactPhone || '',
            currentIncidentId: data.currentIncidentId || null,
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        });
        if (list.length > 0) {
          onData(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToAssignments(
  onData: (assignments: Assignment[]) => void
): Unsubscribe | null {
  if (!auth.currentUser) return null;
  const path = 'assignments';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Assignment[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            assignmentId: data.assignmentId || d.id,
            incidentId: data.incidentId || '',
            resourceId: data.resourceId || '',
            resourceName: data.resourceName || '',
            incidentTitle: data.incidentTitle || '',
            priority: data.priority || 'Normal',
            routeSummary: data.routeSummary || '',
            distanceKm: Number(data.distanceKm) || 0,
            etaMinutes: Number(data.etaMinutes) || 10,
            status: (data.status?.toUpperCase() as any) || 'ASSIGNED',
            assignedAt: data.assignedAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        });
        if (list.length > 0) {
          onData(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToAlerts(
  onData: (alerts: AlertMessage[]) => void
): Unsubscribe | null {
  if (!auth.currentUser) return null;
  const path = 'alerts';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AlertMessage[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            alertId: data.alertId || d.id,
            title: data.title || '',
            message: data.message || '',
            severity: (data.severity?.toUpperCase() as any) || 'INFO',
            incidentId: data.incidentId || null,
            targetRole: data.targetRole || 'ALL',
            timestamp: data.timestamp || new Date().toISOString(),
            isRead: Boolean(data.isRead)
          });
        });
        if (list.length > 0) {
          onData(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
