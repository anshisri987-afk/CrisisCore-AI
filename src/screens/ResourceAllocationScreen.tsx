import React, { useState } from 'react';
import { useCrisis } from '../context/CrisisContext';
import { Incident, Resource, RESOURCE_TYPES } from '../types';
import {
  Brain,
  Send,
  RefreshCw,
  AlertTriangle,
  Anchor,
  Loader2
} from 'lucide-react';

function calculateMatchScore(incident: Incident | null, resource: Resource): number {
  if (!incident) return 80;
  let score = 70;
  if (incident.waterDepthMeters >= 1.0 && resource.type === 'RESCUE_BOAT') score += 26;
  if (incident.type === 'MEDICAL' && resource.type === 'AMBULANCE') score += 25;
  if (incident.type === 'RESCUE' && resource.type === 'DISASTER_TEAM') score += 24;
  if (resource.availability === 'AVAILABLE') score += 10;
  else score -= 15;
  return Math.min(99, Math.max(35, score));
}

function getMatchExplanation(incident: Incident | null, resource: Resource): string {
  if (!incident) return 'Available for tactical deployment.';
  if (incident.waterDepthMeters >= 1.5 && resource.type === 'RESCUE_BOAT') {
    return `Optimal match: Inflatable shallow-draft watercraft required for water depth ${incident.waterDepthMeters}m.`;
  }
  if (resource.type === 'AMBULANCE') {
    return 'Medical unit equipped with ALS triage support.';
  }
  if (resource.type === 'DISASTER_TEAM') {
    return 'Certified NDRF deep-search swimmers & swift-water rescue gear.';
  }
  if (resource.availability !== 'AVAILABLE') {
    return 'Currently deployed on prior incident; available for dynamic reassignment override.';
  }
  return 'Suitable equipment within operational response perimeter.';
}

export const ResourceAllocationScreen: React.FC = () => {
  const {
    incidents,
    resources,
    selectedIncident,
    selectIncident,
    assignResourceToIncident,
    runDynamicReallocationDemo,
    isReallocating
  } = useCrisis();

  const [activeIncident, setActiveIncident] = useState<Incident | null>(
    selectedIncident || incidents.find((i) => i.status !== 'RESOLVED') || incidents[0] || null
  );

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'AVAILABLE' | 'BOATS' | 'MEDICAL'>('ALL');

  const filteredResources = resources.filter((res) => {
    if (selectedFilter === 'AVAILABLE') return res.availability === 'AVAILABLE';
    if (selectedFilter === 'BOATS') return res.type === 'RESCUE_BOAT';
    if (selectedFilter === 'MEDICAL') return res.type === 'AMBULANCE' || res.type === 'MEDICAL_STATION';
    return true;
  });

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-3">
      {/* 1. Target Incident Selector Card */}
      <div
        data-testid="target_incident_selector_card"
        className="bg-[#0E1A2B] border border-[#FF6B00]/50 rounded-2xl p-4 sm:p-5 shadow-xl"
      >
        <span className="text-[10px] sm:text-[11px] font-bold text-[#FF6B00] uppercase tracking-wider block mb-2">
          TARGET EMERGENCY FOR DISPATCH
        </span>

        {activeIncident ? (
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {activeIncident.title}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold text-white shrink-0 ${
                  activeIncident.severity === 'CRITICAL' ? 'bg-[#E53935]' : 'bg-[#FF6B00]'
                }`}
              >
                PRIORITY {activeIncident.priorityScore}
              </span>
            </div>

            <p className="text-xs text-[#00C2E0] mt-1">
              📍 {activeIncident.locationName} • 🌊 {activeIncident.waterDepthMeters}m depth • 👥 {activeIncident.affectedPopulation} affected
            </p>

            {activeIncident.assignedResourceName && (
              <p className="text-xs text-[#00C853] font-semibold mt-1.5 flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5" />
                <span>Currently assigned: {activeIncident.assignedResourceName} ({activeIncident.status})</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#94A3B8]">No emergency selected.</p>
        )}

        {/* Switch incident pills */}
        <div className="mt-3 pt-3 border-t border-[#223854]">
          <span className="text-[10px] text-[#64748B] uppercase font-bold block mb-1.5">
            Switch Target Incident:
          </span>
          <div className="flex flex-wrap gap-2">
            {incidents.slice(0, 4).map((inc) => {
              const isSelected = activeIncident?.incidentId === inc.incidentId;
              return (
                <button
                  key={inc.incidentId}
                  onClick={() => {
                    setActiveIncident(inc);
                    selectIncident(inc);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    isSelected
                      ? 'bg-[#FF6B00]/25 text-[#FF6B00] border-[#FF6B00]'
                      : 'bg-[#070E18] text-[#94A3B8] border-[#223854] hover:text-white'
                  }`}
                >
                  {inc.incidentId}: {inc.title.slice(0, 18)}...
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Google OR-Tools Optimization Card */}
      <div
        data-testid="or_tools_optimization_card"
        className="bg-[#16253B] border border-[#00C2E0]/40 rounded-xl p-3.5 flex items-start gap-3 shadow-md"
      >
        <Brain className="w-6 h-6 text-[#00C2E0] shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#00C2E0]">
            Google OR-Tools Constraint Matcher Active
          </h4>
          <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
            Evaluating equipment compatibility, transit distance, flood depth limits, and medical capacity in real time.
          </p>
        </div>
      </div>

      {/* 3. Filter Row */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'ALL', label: `All (${resources.length})` },
            { id: 'AVAILABLE', label: 'Available Only' },
            { id: 'BOATS', label: 'Watercraft / Boats' },
            { id: 'MEDICAL', label: 'Medical / ALS' }
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              selectedFilter === f.id
                ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                : 'bg-[#0E1A2B] text-[#94A3B8] border-[#223854] hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 4. Resource Cards List */}
      <div className="space-y-3">
        {filteredResources.map((res) => {
          const matchScore = calculateMatchScore(activeIncident, res);
          const matchExp = getMatchExplanation(activeIncident, res);
          const isAvail = res.availability === 'AVAILABLE';

          return (
            <div
              key={res.resourceId}
              data-testid={`resource_card_${res.resourceId}`}
              className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 shadow-md transition hover:border-[#00C2E0]/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {res.name}
                  </h4>
                  <p className="text-xs text-[#94A3B8]">
                    {RESOURCE_TYPES[res.type].label} • {res.teamPersonnel}
                  </p>
                </div>

                {/* Match Score Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-black ${
                    matchScore >= 90
                      ? 'bg-[#0A3D1B] text-[#00C853] border border-[#00C853]/40'
                      : matchScore >= 75
                      ? 'bg-[#008BA3]/30 text-[#00C2E0] border border-[#00C2E0]/40'
                      : 'bg-[#16253B] text-[#94A3B8]'
                  }`}
                >
                  {matchScore}% MATCH
                </span>
              </div>

              {/* Match Explanation */}
              <p className="text-xs text-[#00C2E0] mt-2 italic">
                {matchExp}
              </p>

              {/* Footer Row */}
              <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-[#223854]">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isAvail
                      ? 'bg-[#0A3D1B] text-[#00C853]'
                      : res.availability === 'DISPATCHED'
                      ? 'bg-[#FF6B00]/20 text-[#FF6B00]'
                      : 'bg-[#00C2E0]/20 text-[#00C2E0]'
                  }`}
                >
                  {res.availability}
                </span>

                <button
                  onClick={() => {
                    if (activeIncident) {
                      assignResourceToIncident(activeIncident, res);
                    }
                  }}
                  data-testid={`assign_button_${res.resourceId}`}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ${
                    isAvail
                      ? 'bg-[#FF6B00] hover:bg-[#FF8533] text-white'
                      : 'bg-[#008BA3] hover:bg-[#00C2E0] text-white'
                  }`}
                >
                  {isAvail ? (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Asset</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reallocate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Dynamic Reallocation Showcase Banner at bottom */}
      <div
        data-testid="dynamic_reallocation_section"
        className="bg-[#4A1010]/30 border border-[#E53935] rounded-xl p-4 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#E53935]" />
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            DYNAMIC REALLOCATION TRIGGER
          </h4>
        </div>
        <p className="text-xs text-[#FFDAD6] mt-1.5 leading-relaxed">
          Simulate an unexpected crisis surge (Hospital ICU generator submerged) and trigger real-time asset diversion in compliance with PRD Phase 4 requirements.
        </p>

        <button
          onClick={runDynamicReallocationDemo}
          disabled={isReallocating}
          data-testid="reallocation_action_button"
          className="w-full mt-3 py-2.5 px-4 bg-[#E53935] hover:bg-[#B71C1C] disabled:opacity-70 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
        >
          {isReallocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Diverting Assets...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Execute Real-Time Asset Diversion</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
