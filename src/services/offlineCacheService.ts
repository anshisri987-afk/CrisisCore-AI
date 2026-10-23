import { Resource, Assignment, Incident } from '../types';

export interface CriticalRouteCacheItem {
  id: string;
  name: string;
  origin: string;
  destination: string;
  elevationBypassStatus: string;
  waterDepthRisk: string;
  waypoints: Array<{
    distance: string;
    title: string;
    instruction: string;
    lat: number;
    lng: number;
  }>;
}

export const CRITICAL_EMERGENCY_ROUTES: CriticalRouteCacheItem[] = [
  {
    id: 'ROUTE-DELHI-YAMUNA-NORTH',
    name: 'Northern Embankment Bypass Corridor',
    origin: 'NDRF Base Sector 1 Depot',
    destination: 'City Metro Hospital ICU',
    elevationBypassStatus: 'PASSABLE (Elevated Ring Road)',
    waterDepthRisk: 'Avoids NH-24 submerged underpass (2.4m depth)',
    waypoints: [
      {
        distance: '0.0 km',
        title: 'Depot Origin: NDRF Sector 1 Base',
        instruction: 'Depart base via elevated service lane',
        lat: 28.6100,
        lng: 77.2300
      },
      {
        distance: '1.8 km',
        title: 'Elevated Flyover Bypass',
        instruction: 'Clear high ground; maintain green channel speed',
        lat: 28.6180,
        lng: 77.2220
      },
      {
        distance: '3.2 km',
        title: 'Bund Entry Point C',
        instruction: 'Water starts at 0.4m; lower boat engine draft',
        lat: 28.6220,
        lng: 77.2190
      },
      {
        distance: '4.1 km',
        title: 'Hospital ICU Target Site',
        instruction: 'Prepare stretchers and evacuation lifelines',
        lat: 28.6250,
        lng: 77.2180
      }
    ]
  },
  {
    id: 'ROUTE-DELHI-MAYUR-VIHAR',
    name: 'Mayur Vihar Bund Emergency Extraction Route',
    origin: 'SDRF Tactical Boat Station Bravo',
    destination: 'Mayur Vihar Bund Point C Breached Cluster',
    elevationBypassStatus: 'WATERCRAFT MANDATORY',
    waterDepthRisk: 'Fast-moving flood current 2.8m depth',
    waypoints: [
      {
        distance: '0.0 km',
        title: 'Boat Staging Point Bravo',
        instruction: 'Launch inflatable rescue boats with outboards',
        lat: 28.6200,
        lng: 77.2100
      },
      {
        distance: '1.4 km',
        title: 'Substation 12 High Water Barrier',
        instruction: 'Steer east of submerged electrical transformers',
        lat: 28.6150,
        lng: 77.2240
      },
      {
        distance: '2.8 km',
        title: 'Rooftop Evacuation Point 1',
        instruction: 'Establish tether lines to 180 stranded residents',
        lat: 28.6080,
        lng: 77.2350
      }
    ]
  }
];

const STORAGE_KEYS = {
  RESOURCES: 'crisiscore_offline_resources_v1',
  ROUTES: 'crisiscore_offline_routes_v1',
  QUEUE: 'crisiscore_offline_pending_queue_v1',
  META: 'crisiscore_offline_meta_v1'
};

export interface OfflineCacheMeta {
  lastCachedTimestamp: string;
  resourceCount: number;
  routeCount: number;
  cachedSuccessfully: boolean;
}

/**
 * Cache emergency resource data and critical routes into CacheStorage and LocalStorage
 */
export async function cacheEmergencyData(
  resources: Resource[],
  assignments: Assignment[]
): Promise<OfflineCacheMeta> {
  const timestamp = new Date().toISOString();
  const meta: OfflineCacheMeta = {
    lastCachedTimestamp: timestamp,
    resourceCount: resources.length,
    routeCount: CRITICAL_EMERGENCY_ROUTES.length,
    cachedSuccessfully: true
  };

  // 1. Store in LocalStorage for fast synchronous access
  try {
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(CRITICAL_EMERGENCY_ROUTES));
    localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(meta));
  } catch (err) {
    console.warn('[OfflineCache] LocalStorage error:', err);
  }

  // 2. Cache in Service Worker CacheStorage via synthetic response
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open('emergency-resource-data-cache-v1');

      // Synthetic API endpoint for resources
      const resourceResponse = new Response(JSON.stringify(resources), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Cached-At': timestamp
        }
      });
      await cache.put('/api/resources', resourceResponse);

      // Synthetic API endpoint for critical routes
      const routesResponse = new Response(JSON.stringify(CRITICAL_EMERGENCY_ROUTES), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Cached-At': timestamp
        }
      });
      await cache.put('/api/routes', routesResponse);

      // Synthetic API endpoint for active assignments
      const assignmentsResponse = new Response(JSON.stringify(assignments), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Cached-At': timestamp
        }
      });
      await cache.put('/api/assignments', assignmentsResponse);
    } catch (err) {
      console.warn('[OfflineCache] ServiceWorker CacheStorage error:', err);
    }
  }

  return meta;
}

/**
 * Retrieve cached emergency resources
 */
export function getCachedEmergencyResources(): Resource[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Retrieve cached critical emergency routes
 */
export function getCachedCriticalRoutes(): CriticalRouteCacheItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTES);
    return raw ? JSON.parse(raw) : CRITICAL_EMERGENCY_ROUTES;
  } catch {
    return CRITICAL_EMERGENCY_ROUTES;
  }
}

/**
 * Get offline cache metadata
 */
export function getOfflineCacheMeta(): OfflineCacheMeta | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.META);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Queue an incident reported while offline
 */
export function queueOfflineIncident(incident: Incident): void {
  try {
    const queue = getQueuedOfflineIncidents();
    queue.push(incident);
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error('[OfflineCache] Failed to queue offline incident:', err);
  }
}

/**
 * Get list of incidents created in offline mode
 */
export function getQueuedOfflineIncidents(): Incident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear the offline queue after successful server sync
 */
export function clearQueuedOfflineIncidents(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.QUEUE);
  } catch (err) {
    console.error('[OfflineCache] Failed to clear offline queue:', err);
  }
}
