import React, { useState, useEffect } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap,
  ControlPosition,
  MapControl
} from '@vis.gl/react-google-maps';
import { useCrisis } from '../context/CrisisContext';
import { Incident, Resource } from '../types';
import {
  Anchor,
  Navigation,
  AlertTriangle,
  Droplets,
  Users,
  Shield,
  LifeBuoy,
  X,
  Crosshair,
  Layers,
  Radio
} from 'lucide-react';

// Custom Map Overlay for Flood Inundation & Tactical Corridors
const FloodCorridorOverlays: React.FC<{
  focusedIncident: Incident | null;
  resources: Resource[];
}> = ({ focusedIncident, resources }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    // 1. Yamuna River Basin Inundation Zone (Polygon)
    const yamunaRiverZone = new google.maps.Polygon({
      paths: [
        { lat: 28.670, lng: 77.225 },
        { lat: 28.650, lng: 77.235 },
        { lat: 28.630, lng: 77.240 },
        { lat: 28.610, lng: 77.245 },
        { lat: 28.585, lng: 77.230 },
        { lat: 28.570, lng: 77.220 },
        { lat: 28.585, lng: 77.210 },
        { lat: 28.615, lng: 77.225 },
        { lat: 28.640, lng: 77.220 },
        { lat: 28.660, lng: 77.215 }
      ],
      strokeColor: '#00C2E0',
      strokeOpacity: 0.85,
      strokeWeight: 2,
      fillColor: '#0077B6',
      fillOpacity: 0.22,
      map,
      clickable: false
    });

    // 2. Mayur Vihar Embankment Breach Critical Hazard Zone (Red Polygon)
    const breachHazardZone = new google.maps.Polygon({
      paths: [
        { lat: 28.615, lng: 77.230 },
        { lat: 28.612, lng: 77.242 },
        { lat: 28.602, lng: 77.238 },
        { lat: 28.605, lng: 77.226 }
      ],
      strokeColor: '#E53935',
      strokeOpacity: 0.9,
      strokeWeight: 2.5,
      fillColor: '#E53935',
      fillOpacity: 0.28,
      map,
      clickable: false
    });

    // 3. High-Ground Evacuation Route Corridor (Polyline)
    const evacuationCorridor = new google.maps.Polyline({
      path: [
        { lat: 28.580, lng: 77.190 },
        { lat: 28.600, lng: 77.205 },
        { lat: 28.618, lng: 77.215 },
        { lat: 28.632, lng: 77.205 }
      ],
      geodesic: true,
      strokeColor: '#00C853',
      strokeOpacity: 0.8,
      strokeWeight: 3.5,
      map
    });

    return () => {
      yamunaRiverZone.setMap(null);
      breachHazardZone.setMap(null);
      evacuationCorridor.setMap(null);
    };
  }, [map]);

  // Dynamic tactical dispatch line connecting assigned resource to focused incident
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps || !focusedIncident) return;

    // Find assigned resource or nearest available boat
    const matchedResource =
      resources.find((r) => r.resourceId === focusedIncident.assignedResourceId) ||
      resources.find((r) => r.type === 'RESCUE_BOAT') ||
      resources[0];

    if (!matchedResource) return;

    const dispatchLine = new google.maps.Polyline({
      path: [
        { lat: matchedResource.latitude, lng: matchedResource.longitude },
        {
          lat: (matchedResource.latitude + focusedIncident.latitude) / 2 + 0.004,
          lng: (matchedResource.longitude + focusedIncident.longitude) / 2 - 0.003
        },
        { lat: focusedIncident.latitude, lng: focusedIncident.longitude }
      ],
      geodesic: true,
      strokeColor: '#FF6B00',
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map
    });

    return () => {
      dispatchLine.setMap(null);
    };
  }, [map, focusedIncident, resources]);

  return null;
};

export const SituationalMapScreen: React.FC = () => {
  const {
    incidents,
    resources,
    selectedIncident,
    selectIncident,
    setScreen
  } = useCrisis();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FLOOD' | 'BOATS' | 'RESOURCES'>('ALL');
  const [focusedIncident, setFocusedIncident] = useState<Incident | null>(
    selectedIncident || incidents[0] || null
  );
  const [focusedResource, setFocusedResource] = useState<Resource | null>(null);

  // Sync with global context selection
  useEffect(() => {
    if (selectedIncident) {
      setFocusedIncident(selectedIncident);
    }
  }, [selectedIncident]);

  // Filtered incidents
  const displayedIncidents = incidents.filter((inc) => {
    if (activeFilter === 'FLOOD') return inc.waterDepthMeters >= 1.0;
    if (activeFilter === 'BOATS') return inc.assignedResourceName?.includes('Boat');
    return true;
  });

  // Filtered resources
  const displayedResources = resources.filter((res) => {
    if (activeFilter === 'BOATS') return res.type === 'RESCUE_BOAT';
    if (activeFilter === 'FLOOD') return res.type === 'RESCUE_BOAT' || res.type === 'FIRE_ENGINE';
    return true;
  });

  const handleIncidentClick = (inc: Incident) => {
    setFocusedIncident(inc);
    setFocusedResource(null);
    selectIncident(inc);
  };

  const handleResourceClick = (res: Resource) => {
    setFocusedResource(res);
  };

  const defaultCenter = { lat: 28.6180, lng: 77.2180 };

  return (
    <div
      data-testid="situational_map_container"
      className="relative w-full h-[calc(100vh-120px)] min-h-[500px] bg-[#070E18] overflow-hidden flex flex-col"
    >
      {/* 1. Google Maps Viewport with AdvancedMarkers */}
      <div className="relative flex-1 w-full h-full">
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={defaultCenter}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          {/* GIS Flood Polygon & Route Overlay */}
          <FloodCorridorOverlays
            focusedIncident={focusedIncident}
            resources={resources}
          />

          {/* Incident Advanced Markers */}
          {displayedIncidents.map((inc) => {
            const isSelected = focusedIncident?.incidentId === inc.incidentId;
            const isCritical = inc.severity === 'CRITICAL';

            const badgeBg =
              inc.severity === 'CRITICAL'
                ? '#E53935'
                : inc.severity === 'HIGH'
                ? '#FF6B00'
                : inc.severity === 'MEDIUM'
                ? '#FFB300'
                : '#00C2E0';

            return (
              <AdvancedMarker
                key={inc.incidentId}
                position={{ lat: inc.latitude, lng: inc.longitude }}
                onClick={() => handleIncidentClick(inc)}
                title={`${inc.incidentId}: ${inc.title}`}
                zIndex={isSelected ? 100 : isCritical ? 50 : 20}
              >
                <div
                  data-testid={`map_marker_${inc.incidentId}`}
                  className="cursor-pointer group flex flex-col items-center select-none"
                >
                  {/* Pulsing Tactical Halo */}
                  {(isCritical || isSelected) && (
                    <span
                      className={`absolute -inset-2 rounded-full opacity-75 animate-ping ${
                        isCritical ? 'bg-red-500' : 'bg-cyan-400'
                      }`}
                    />
                  )}

                  {/* Marker Pin Head */}
                  <div
                    className={`relative px-2 py-1 rounded-full text-white font-bold text-[11px] flex items-center gap-1 shadow-2xl border-2 transition-transform duration-200 group-hover:scale-110 ${
                      isSelected
                        ? 'border-white scale-110 ring-4 ring-cyan-400/50'
                        : 'border-white/90'
                    }`}
                    style={{ backgroundColor: badgeBg }}
                  >
                    {isCritical ? (
                      <AlertTriangle className="w-3 h-3 text-white fill-white" />
                    ) : (
                      <Droplets className="w-3 h-3 text-white" />
                    )}
                    <span>{inc.incidentId}</span>
                  </div>

                  {/* Pin Tail Point */}
                  <div
                    className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px]"
                    style={{ borderTopColor: badgeBg }}
                  />

                  {/* Floating Label */}
                  <div className="mt-0.5 px-1.5 py-0.5 rounded bg-[#070E18]/90 text-[10px] text-white border border-[#223854] shadow whitespace-nowrap max-w-[120px] truncate">
                    {inc.waterDepthMeters}m • {inc.affectedPopulation}p
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Resource Advanced Markers */}
          {displayedResources.map((res) => {
            const isDispatched = res.availability === 'DISPATCHED' || res.availability === 'EN_ROUTE';
            const isBoat = res.type === 'RESCUE_BOAT';

            return (
              <AdvancedMarker
                key={res.resourceId}
                position={{ lat: res.latitude, lng: res.longitude }}
                onClick={() => handleResourceClick(res)}
                title={`${res.name} (${res.availability})`}
                zIndex={30}
              >
                <div
                  data-testid={`map_resource_${res.resourceId}`}
                  className="cursor-pointer group flex flex-col items-center select-none"
                >
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 shadow-lg border border-white/80 transition-transform duration-200 group-hover:scale-110 ${
                      isDispatched ? 'bg-[#FF6B00]' : 'bg-[#00C853]'
                    }`}
                  >
                    {isBoat ? (
                      <LifeBuoy className="w-3 h-3 text-white" />
                    ) : (
                      <Shield className="w-3 h-3 text-white" />
                    )}
                    <span>{res.resourceId}</span>
                  </div>

                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-white" />

                  <div className="mt-0.5 px-1 rounded bg-[#0E1A2B]/95 text-[9px] text-[#00C853] font-mono border border-[#00C853]/40 whitespace-nowrap">
                    {res.name.split(' ')[0]}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Tactical Custom Controls */}
          <MapControl position={ControlPosition.TOP_LEFT}>
            <div className="m-3 flex flex-col gap-2 pointer-events-auto">
              {/* Layer Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#070E18]/90 p-1.5 rounded-xl border border-[#223854] shadow-xl backdrop-blur-md">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  data-testid="filter_all"
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                    activeFilter === 'ALL'
                      ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm'
                      : 'bg-[#0E1A2B] text-[#94A3B8] border-[#223854] hover:text-white'
                  }`}
                >
                  All ({incidents.length})
                </button>

                <button
                  onClick={() => setActiveFilter('FLOOD')}
                  data-testid="filter_flood"
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition border flex items-center gap-1 ${
                    activeFilter === 'FLOOD'
                      ? 'bg-[#008BA3] text-white border-[#00C2E0] shadow-sm'
                      : 'bg-[#0E1A2B] text-[#94A3B8] border-[#223854] hover:text-white'
                  }`}
                >
                  <Droplets className="w-3 h-3" />
                  <span>Depth &gt; 1m</span>
                </button>

                <button
                  onClick={() => setActiveFilter('BOATS')}
                  data-testid="filter_boats"
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition border flex items-center gap-1 ${
                    activeFilter === 'BOATS'
                      ? 'bg-[#00C853] text-white border-[#00C853] shadow-sm'
                      : 'bg-[#0E1A2B] text-[#94A3B8] border-[#223854] hover:text-white'
                  }`}
                >
                  <LifeBuoy className="w-3 h-3" />
                  <span>Rescue Boats</span>
                </button>
              </div>

              {/* Real-Time Flood Telemetry Indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070E18]/90 border border-[#223854] backdrop-blur-md shadow-lg self-start">
                <span className="w-2 h-2 rounded-full bg-[#E53935] animate-ping" />
                <span className="text-[10px] font-bold tracking-wide text-white flex items-center gap-1">
                  <Radio className="w-3 h-3 text-[#FF6B00]" />
                  <span>YAMUNA RIVER BASIN • LIVE GOOGLE MAPS GIS ACTIVE</span>
                </span>
              </div>
            </div>
          </MapControl>

          {/* Map Legend */}
          <MapControl position={ControlPosition.TOP_RIGHT}>
            <div className="m-3 bg-[#070E18]/90 border border-[#223854] rounded-xl p-2.5 backdrop-blur-md shadow-xl text-[10px] space-y-1.5 pointer-events-auto hidden sm:block">
              <div className="flex items-center gap-1.5 font-bold text-[#00C2E0]">
                <Layers className="w-3.5 h-3.5" />
                <span>GIS LEGEND</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                <span>Critical Flood ICU (&gt;2m)</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                <span>High Severity Trapped</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C853]" />
                <span>Rescue Units / Depots</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="w-3.5 h-1 bg-[#00C2E0]" />
                <span>River Hazard Corridor</span>
              </div>
            </div>
          </MapControl>
        </Map>
      </div>

      {/* 2. Resource Quick Inspect Pill */}
      {focusedResource && !focusedIncident && (
        <div className="bg-[#0E1A2B] border-t border-[#00C853] p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00C853]" />
            <div>
              <p className="font-bold text-white">{focusedResource.name}</p>
              <p className="text-[11px] text-[#94A3B8]">
                {focusedResource.teamPersonnel} • Contact: {focusedResource.contactPhone}
              </p>
            </div>
          </div>
          <button
            onClick={() => setFocusedResource(null)}
            className="p-1 text-[#94A3B8] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Bottom Tactical Drawer for Selected Incident */}
      {focusedIncident && (
        <div
          data-testid="map_marker_detail_card"
          className="bg-[#0E1A2B] border-t border-[#00C2E0] p-4 shadow-2xl z-20 max-w-2xl mx-auto w-full transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${
                  focusedIncident.severity === 'CRITICAL'
                    ? 'bg-[#E53935]'
                    : focusedIncident.severity === 'HIGH'
                    ? 'bg-[#FF6B00]'
                    : 'bg-[#FFB300]'
                }`}
              >
                {focusedIncident.severity} • {focusedIncident.urgency}
              </span>

              <span className="text-xs font-bold text-[#00C2E0]">
                Priority Score: {focusedIncident.priorityScore}/100
              </span>
            </div>

            <button
              onClick={() => setFocusedIncident(null)}
              className="p-1 text-[#94A3B8] hover:text-white"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white mt-1.5 flex items-center gap-1.5">
            <span>{focusedIncident.title}</span>
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8] mt-1">
            <span className="flex items-center gap-1">
              📍 {focusedIncident.locationName}
            </span>
            <span className="flex items-center gap-1 text-[#00C2E0] font-semibold">
              <Droplets className="w-3.5 h-3.5" />
              {focusedIncident.waterDepthMeters}m depth
            </span>
            <span className="flex items-center gap-1 text-[#FF6B00] font-semibold">
              <Users className="w-3.5 h-3.5" />
              {focusedIncident.affectedPopulation} victims trapped
            </span>
          </div>

          {focusedIncident.assignedResourceName && (
            <p className="text-xs text-[#00C853] font-medium mt-1 flex items-center gap-1">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Assigned: {focusedIncident.assignedResourceName}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#223854]/60">
            <button
              onClick={() => {
                selectIncident(focusedIncident);
                setScreen('RESOURCE_ALLOCATION');
              }}
              data-testid="map_dispatch_button"
              className="py-2 px-3 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
            >
              <Anchor className="w-3.5 h-3.5" />
              <span>Allocate Resource</span>
            </button>

            <button
              onClick={() => {
                selectIncident(focusedIncident);
                setScreen('ROUTE_TRACKING');
              }}
              data-testid="map_navigate_button"
              className="py-2 px-3 bg-[#070E18] hover:bg-[#16253B] text-[#00C2E0] border border-[#00C2E0] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Follow Route</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
