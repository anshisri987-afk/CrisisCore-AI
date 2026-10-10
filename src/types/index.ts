export type AppScreen =
  | 'HOME'
  | 'SITUATIONAL_MAP'
  | 'RESOURCE_ALLOCATION'
  | 'REPORT_INCIDENT'
  | 'ROUTE_TRACKING'
  | 'OPERATIONS_DASHBOARD'
  | 'AI_ASSISTANT'
  | 'USER_PROFILE';

export type UserRole =
  | 'DISASTER_AUTHORITY'
  | 'RESCUE_FIELD_TEAM'
  | 'CITIZEN_REPORTER'
  | 'RELIEF_COORDINATOR';

export interface UserRoleInfo {
  label: string;
  badge: string;
  description: string;
}

export const USER_ROLES: Record<UserRole, UserRoleInfo> = {
  DISASTER_AUTHORITY: {
    label: 'Emergency Authority',
    badge: 'COMMAND',
    description: 'Full control: triage, dispatch approval, dynamic override'
  },
  RESCUE_FIELD_TEAM: {
    label: 'Rescue / Field Team',
    badge: 'RESPONDER',
    description: 'Waypoint navigation, field telemetry, incident resolution'
  },
  CITIZEN_REPORTER: {
    label: 'Citizen / Reporter',
    badge: 'CITIZEN',
    description: 'Rapid incident submission, SOS beacon, safe shelter access'
  },
  RELIEF_COORDINATOR: {
    label: 'Relief Coordinator',
    badge: 'LOGISTICS',
    description: 'Supply logistics, ration inventory, medical stations'
  }
};

export type IncidentType = 'FLOOD' | 'RESCUE' | 'MEDICAL' | 'COLLAPSE' | 'FIRE';

export interface IncidentTypeInfo {
  displayName: string;
  iconName: string;
}

export const INCIDENT_TYPES: Record<IncidentType, IncidentTypeInfo> = {
  FLOOD: { displayName: 'Urban Flood', iconName: 'Waves' },
  RESCUE: { displayName: 'Stranded / Trapped', iconName: 'LifeBuoy' },
  MEDICAL: { displayName: 'Medical Urgent', iconName: 'Activity' },
  COLLAPSE: { displayName: 'Structural Collapse', iconName: 'Home' },
  FIRE: { displayName: 'Electrical / Fire', iconName: 'Flame' }
};

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export const SEVERITIES: Record<Severity, { label: string; weight: number }> = {
  CRITICAL: { label: 'Critical', weight: 4 },
  HIGH: { label: 'High', weight: 3 },
  MEDIUM: { label: 'Medium', weight: 2 },
  LOW: { label: 'Low', weight: 1 }
};

export type Urgency = 'IMMEDIATE' | 'HIGH' | 'NORMAL';

export const URGENCIES: Record<Urgency, { label: string; weight: number }> = {
  IMMEDIATE: { label: 'Immediate (0-15m)', weight: 4 },
  HIGH: { label: 'High (15-45m)', weight: 3 },
  NORMAL: { label: 'Normal (45m+)', weight: 2 }
};

export type IncidentStatus =
  | 'REPORTED'
  | 'CLASSIFIED'
  | 'PRIORITIZED'
  | 'RESOURCE_MATCHED'
  | 'ASSIGNED'
  | 'RESPONDING'
  | 'RESOLVED';

export const INCIDENT_STATUSES: Record<IncidentStatus, { label: string; stepIndex: number }> = {
  REPORTED: { label: 'Reported', stepIndex: 1 },
  CLASSIFIED: { label: 'Classified', stepIndex: 2 },
  PRIORITIZED: { label: 'Prioritized', stepIndex: 3 },
  RESOURCE_MATCHED: { label: 'Matched', stepIndex: 4 },
  ASSIGNED: { label: 'Assigned', stepIndex: 5 },
  RESPONDING: { label: 'Responding / En Route', stepIndex: 6 },
  RESOLVED: { label: 'Resolved / Closed', stepIndex: 7 }
};

export interface Incident {
  incidentId: string;
  reporterId: string;
  reporterName: string;
  title: string;
  type: IncidentType;
  severity: Severity;
  urgency: Urgency;
  locationName: string;
  latitude: number;
  longitude: number;
  affectedPopulation: number;
  waterDepthMeters: number;
  description: string;
  photoUrl?: string;
  status: IncidentStatus;
  priorityScore: number;
  assignedResourceId?: string | null;
  assignedResourceName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ResourceType =
  | 'RESCUE_BOAT'
  | 'AMBULANCE'
  | 'DISASTER_TEAM'
  | 'DRONE_UNIT'
  | 'FIRE_ENGINE'
  | 'GENERATOR_POWER'
  | 'RATION_SUPPLY'
  | 'MEDICAL_STATION';

export const RESOURCE_TYPES: Record<ResourceType, { label: string; category: string }> = {
  RESCUE_BOAT: { label: 'Inflatable Rescue Boat', category: 'Watercraft' },
  AMBULANCE: { label: 'Advanced Life Support Ambulance', category: 'Medical' },
  DISASTER_TEAM: { label: 'NDRF / SDRF Search & Rescue Team', category: 'Personnel' },
  DRONE_UNIT: { label: 'Recon & Thermal Drone Unit', category: 'Air/GIS' },
  FIRE_ENGINE: { label: 'Flood De-Watering / Fire Unit', category: 'Heavy Equipment' },
  GENERATOR_POWER: { label: 'Emergency Diesel Generator', category: 'Power' },
  RATION_SUPPLY: { label: 'Food, Drinking Water & Rations', category: 'Supplies' },
  MEDICAL_STATION: { label: 'Mobile Triage Medical Kit', category: 'Medical' }
};

export type ResourceAvailability =
  | 'AVAILABLE'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'MAINTENANCE';

export interface Resource {
  resourceId: string;
  name: string;
  type: ResourceType;
  teamPersonnel: string;
  latitude: number;
  longitude: number;
  availability: ResourceAvailability;
  capacity: number;
  contactPhone: string;
  currentIncidentId?: string | null;
  updatedAt: string;
}

export type AssignmentStatus =
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'COMPLETED'
  | 'REALLOCATED';

export interface Assignment {
  assignmentId: string;
  incidentId: string;
  resourceId: string;
  resourceName: string;
  incidentTitle: string;
  priority: string;
  routeSummary: string;
  distanceKm: number;
  etaMinutes: number;
  status: AssignmentStatus;
  assignedAt: string;
  updatedAt: string;
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';

export interface AlertMessage {
  alertId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  incidentId?: string | null;
  targetRole: string;
  timestamp: string;
  isRead: boolean;
}

export type GeminiMode =
  | 'FAST_LOW_LATENCY'
  | 'BALANCED_GENERAL'
  | 'HIGH_THINKING'
  | 'SEARCH_GROUNDED'
  | 'MAPS_GROUNDED';

export const GEMINI_MODES: Record<GeminiMode, { label: string; modelName: string }> = {
  FAST_LOW_LATENCY: { label: 'Low Latency (Fast Lite)', modelName: 'gemini-3.1-flash-lite' },
  BALANCED_GENERAL: { label: 'General Triage (3.8 Flash)', modelName: 'gemini-3.8-flash' },
  HIGH_THINKING: { label: 'Deep Strategic (3.1 Pro High Thinking)', modelName: 'gemini-3.1-pro-preview' },
  SEARCH_GROUNDED: { label: 'Search Grounded (Live Intel)', modelName: 'gemini-3.8-flash' },
  MAPS_GROUNDED: { label: 'Maps Grounded (Safe Routes & Shelters)', modelName: 'gemini-3.8-flash' }
};

export interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  modeUsed: GeminiMode;
  timestamp: number;
  groundingSource?: string | null;
}

export interface TriageResult {
  priorityScore: number;
  severity: string;
  urgency: string;
  recommendedResource: string;
  reasoning: string;
}

export interface IncidentFormState {
  title: string;
  type: IncidentType;
  severity: Severity;
  urgency: Urgency;
  locationName: string;
  latitude: number;
  longitude: number;
  affectedPopulation: number;
  waterDepthMeters: number;
  description: string;
  isAnalyzing: boolean;
  aiTriageSuggestion: TriageResult | null;
}
