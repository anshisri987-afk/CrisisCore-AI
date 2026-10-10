import React from 'react';
import { useCrisis } from '../context/CrisisContext';
import { INCIDENT_STATUSES } from '../types';
import {
  Navigation,
  Compass,
  Check,
  MapPin,
  TrendingUp,
  Droplets,
  Flag,
  Anchor
} from 'lucide-react';

export const RouteTrackingScreen: React.FC = () => {
  const { assignments, incidents, selectedIncident, updateIncidentStatus } = useCrisis();

  const activeAssignment =
    assignments.find((a) => a.status !== 'COMPLETED') || assignments[0];

  const targetIncident =
    selectedIncident ||
    incidents.find((i) => i.incidentId === activeAssignment?.incidentId) ||
    incidents[0];

  const currentStep = targetIncident
    ? INCIDENT_STATUSES[targetIncident.status].stepIndex
    : 5;

  const steps = [
    '1. Reported',
    '2. Classified',
    '3. Prioritized',
    '4. Resource Matched',
    '5. Assigned',
    '6. Responding',
    '7. Resolved'
  ];

  const waypoints = [
    {
      distance: '0.0 km',
      title: 'Depot Origin: NDRF Sector 1',
      instruction: 'Depart base via elevated service lane',
      icon: MapPin
    },
    {
      distance: '1.8 km',
      title: 'Elevated Flyover Bypass',
      instruction: 'Clear high ground; maintain green channel speed',
      icon: TrendingUp
    },
    {
      distance: '3.2 km',
      title: 'Bund Entry Point C',
      instruction: 'Water starts at 0.4m; lower boat engine draft',
      icon: Droplets
    },
    {
      distance: '4.1 km',
      title: 'Hospital ICU Target Site',
      instruction: 'Prepare stretchers and evacuation lifelines',
      icon: Flag
    }
  ];

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto px-4 pt-3">
      {/* 1. Navigation HUD Header */}
      <div
        data-testid="route_navigation_hud"
        className="bg-[#0E1A2B] border border-[#00C2E0] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded bg-[#008BA3] text-white text-[10px] font-bold uppercase tracking-wide">
            LIVE TACTICAL ROUTE GUIDANCE
          </span>
          <span className="text-base sm:text-lg font-black text-[#FF6B00]">
            ETA {activeAssignment?.etaMinutes ?? 11} MINS
          </span>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            {targetIncident?.title ?? 'Active Emergency Dispatch'}
          </h3>
          <p className="text-xs text-[#00C853] font-semibold mt-0.5 flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5" />
            <span>Assigned Unit: {activeAssignment?.resourceName ?? 'NDRF Swift Boat Alpha'}</span>
          </p>
        </div>

        {/* Corridor Alert */}
        <div className="bg-[#070E18] border border-[#223854] rounded-xl p-3 flex items-start gap-3">
          <Navigation className="w-5 h-5 text-[#00C2E0] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-white">
              Flood-Safe Corridor: Northern Embankment Bypass
            </p>
            <p className="text-[#E53935] mt-0.5 font-medium">
              Avoids submerged NH-24 underpass (water depth 2.4m)
            </p>
          </div>
        </div>
      </div>

      {/* 2. Incident Lifecycle Progress Tracker */}
      <div
        data-testid="incident_lifecycle_timeline"
        className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 sm:p-5 shadow-sm space-y-3"
      >
        <span className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-wider block">
          INCIDENT RESPONSE LIFECYCLE
        </span>

        <div className="space-y-2.5">
          {steps.map((label, idx) => {
            const stepNumber = idx + 1;
            const isCompleted = stepNumber <= currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div key={label} className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-[#FF6B00] text-white ring-2 ring-[#FF6B00]/40'
                        : isCompleted
                        ? 'bg-[#00C853] text-white'
                        : 'bg-[#16253B] text-[#64748B]'
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span
                    className={`font-semibold ${
                      isCurrent
                        ? 'text-[#FF6B00]'
                        : isCompleted
                        ? 'text-white'
                        : 'text-[#64748B]'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wide bg-[#FF6B00]/15 px-2 py-0.5 rounded border border-[#FF6B00]/30">
                    CURRENT STAGE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Turn-by-Turn Waypoint Guidance */}
      <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#00C2E0]" />
          <h4 className="text-xs sm:text-sm font-bold text-[#00C2E0] uppercase tracking-wider">
            Tactical Route Waypoints
          </h4>
        </div>

        <div className="divide-y divide-[#223854]/60">
          {waypoints.map((wp, idx) => {
            const Icon = wp.icon;
            return (
              <div key={idx} className="py-2.5 first:pt-1 last:pb-1 flex items-start gap-3">
                <Icon className="w-4 h-4 text-[#00C2E0] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{wp.title}</span>
                    <span className="text-[#00C2E0] font-semibold">{wp.distance}</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    {wp.instruction}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Responder Action Buttons */}
      {targetIncident && (
        <div
          data-testid="responder_action_panel"
          className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 shadow-sm space-y-3"
        >
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            RESPONDER ACTIONS (FIELD TELEMETRY)
          </span>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateIncidentStatus(targetIncident.incidentId, 'RESPONDING')}
              data-testid="btn_en_route"
              className="py-2.5 px-3 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold text-xs rounded-xl transition shadow"
            >
              En Route
            </button>

            <button
              onClick={() => updateIncidentStatus(targetIncident.incidentId, 'RESOLVED')}
              data-testid="btn_resolved"
              className="py-2.5 px-3 bg-[#00C853] hover:bg-[#009624] text-white font-bold text-xs rounded-xl transition shadow"
            >
              Mark Resolved
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
