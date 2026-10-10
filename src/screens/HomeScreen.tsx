import React from 'react';
import { useCrisis } from '../context/CrisisContext';
import { Incident, INCIDENT_STATUSES } from '../types';
import {
  AlertTriangle,
  Zap,
  PlusCircle,
  Map,
  BarChart3,
  Droplets,
  Users,
  MapPin,
  Anchor,
  Loader2,
  Flame,
  LifeBuoy
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    incidents,
    resources,
    alerts,
    currentLanguage,
    setScreen,
    selectIncident,
    runDynamicReallocationDemo,
    isReallocating
  } = useCrisis();

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const criticalIncidents = activeIncidents.filter((i) => i.severity === 'CRITICAL');
  const deployedResources = resources.filter((r) => r.availability !== 'AVAILABLE');
  const criticalAlert = alerts.find((a) => a.severity === 'CRITICAL');

  const handleSelectIncident = (inc: Incident) => {
    selectIncident(inc);
    setScreen('RESOURCE_ALLOCATION');
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-3">
      {/* 1. Critical Alert Banner */}
      {criticalAlert && (
        <div
          data-testid="critical_alert_card"
          className="bg-gradient-to-r from-[#4A1010] to-[#2B0B0B] border border-[#E53935] rounded-xl p-3.5 flex items-start gap-3 shadow-lg shadow-[#E53935]/10 animate-pulse-slow"
        >
          <div className="w-9 h-9 rounded-full bg-[#E53935] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              {criticalAlert.title}
            </h3>
            <p className="text-xs text-[#FFDAD6] mt-0.5 leading-relaxed">
              {criticalAlert.message}
            </p>
          </div>
        </div>
      )}

      {/* 2. Hero Operations Banner */}
      <div
        data-testid="hero_command_banner"
        className="relative bg-[#0E1A2B] border border-[#223854] rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="relative h-44 sm:h-52 w-full overflow-hidden">
          <img
            src="/crisiscore_hero_banner.jpg"
            alt="Urban Flood Command Center"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          {/* Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070E18] via-[#070E18]/80 to-transparent" />

          {/* Banner Text Overlay */}
          <div className="absolute bottom-3 left-4 right-4">
            <span className="inline-block px-2 py-0.5 bg-[#FF6B00] text-white text-[10px] font-black uppercase rounded tracking-wider shadow">
              {currentLanguage === 'HI'
                ? 'सक्रिय बाढ़ नियंत्रण कक्ष'
                : 'ACTIVE URBAN FLOOD RESPONSE'}
            </span>
            <h2 className="text-base sm:text-xl font-bold text-white mt-1">
              {currentLanguage === 'HI'
                ? 'यमुना बेसिन आपातकालीन संसाधन आवंटन'
                : 'Yamuna River Basin Dispatch Grid'}
            </h2>
            <p className="text-xs text-[#00C2E0] font-medium">
              {currentLanguage === 'HI'
                ? 'सेंसर और नागरिक रिपोर्ट वास्तविक समय में समन्वयित'
                : 'Real-time telemetry • Multi-Agency NDRF / SDRF Coordination'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Operational KPIs Row */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* KPI 1 */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-[#94A3B8] font-medium">Active Events</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#E53935]" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-[#E53935]">
              {activeIncidents.length}
            </span>
          </div>
          <span className="text-[10px] text-[#64748B] font-medium">
            {criticalIncidents.length} Critical
          </span>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-[#94A3B8] font-medium">Assets Deployed</span>
            <Anchor className="w-3.5 h-3.5 text-[#FF6B00]" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-[#FF6B00]">
              {deployedResources.length}/{resources.length}
            </span>
          </div>
          <span className="text-[10px] text-[#64748B] font-medium">
            Watercraft & ALS
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-[#94A3B8] font-medium">Response Delta</span>
            <Zap className="w-3.5 h-3.5 text-[#00C853]" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-[#00C853]">
              -42%
            </span>
          </div>
          <span className="text-[10px] text-[#64748B] font-medium">
            vs Manual Ops
          </span>
        </div>
      </div>

      {/* 4. Dynamic Reallocation Simulation Action Card */}
      <div
        data-testid="dynamic_reallocation_banner"
        className="bg-[#16253B] border border-[#00C2E0]/50 rounded-2xl p-4 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00C2E0]" />
          <h3 className="text-xs sm:text-sm font-bold text-[#00C2E0] uppercase tracking-wide">
            Sense → Decide → Allocate → Respond → Adapt
          </h3>
        </div>
        <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
          Experience the AI-powered dynamic reallocation engine. When a higher-severity emergency (e.g. Hospital ICU inundation) occurs, active field assets are intelligently rerouted.
        </p>

        <div className="mt-3.5">
          <button
            onClick={runDynamicReallocationDemo}
            disabled={isReallocating}
            data-testid="trigger_reallocation_demo_button"
            className="w-full py-2.5 px-4 bg-[#FF6B00] hover:bg-[#FF8533] disabled:opacity-70 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
          >
            {isReallocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recomputing Optimal Deployment Plan...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Simulate Critical Event & Dynamic Reallocation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Quick Action Tiles */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={() => setScreen('REPORT_INCIDENT')}
          data-testid="quick_action_report"
          className="bg-[#0E1A2B] hover:bg-[#16253B] border border-[#223854] rounded-xl p-2.5 sm:p-3 text-center transition flex flex-col sm:flex-row items-center justify-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4 text-[#E53935]" />
          <span className="text-xs font-semibold text-white">Report Incident</span>
        </button>

        <button
          onClick={() => setScreen('SITUATIONAL_MAP')}
          data-testid="quick_action_map"
          className="bg-[#0E1A2B] hover:bg-[#16253B] border border-[#223854] rounded-xl p-2.5 sm:p-3 text-center transition flex flex-col sm:flex-row items-center justify-center gap-1.5"
        >
          <Map className="w-4 h-4 text-[#00C2E0]" />
          <span className="text-xs font-semibold text-white">Tactical Map</span>
        </button>

        <button
          onClick={() => setScreen('OPERATIONS_DASHBOARD')}
          data-testid="quick_action_analytics"
          className="bg-[#0E1A2B] hover:bg-[#16253B] border border-[#223854] rounded-xl p-2.5 sm:p-3 text-center transition flex flex-col sm:flex-row items-center justify-center gap-1.5"
        >
          <BarChart3 className="w-4 h-4 text-[#00C853]" />
          <span className="text-xs font-semibold text-white">Analytics</span>
        </button>
      </div>

      {/* 6. Priority Incident Feed Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F0F4F8]">
          Priority Incident Queue
        </h3>
        <span className="text-[11px] font-semibold text-[#00C2E0]">AI Ranked</span>
      </div>

      {/* 7. Incident Feed Cards */}
      <div className="space-y-3">
        {incidents.map((incident) => {
          const isCritical = incident.severity === 'CRITICAL';
          const statusInfo = INCIDENT_STATUSES[incident.status];

          return (
            <div
              key={incident.incidentId}
              onClick={() => handleSelectIncident(incident)}
              data-testid={`incident_card_${incident.incidentId}`}
              className={`bg-[#0E1A2B] hover:bg-[#122035] border rounded-xl p-4 cursor-pointer transition shadow-md ${
                isCritical
                  ? 'border-[#E53935]/60 hover:border-[#E53935]'
                  : 'border-[#223854] hover:border-[#00C2E0]/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Priority Score Badge */}
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold text-white ${
                    incident.priorityScore >= 90
                      ? 'bg-[#E53935]'
                      : incident.priorityScore >= 75
                      ? 'bg-[#FF6B00]'
                      : 'bg-[#008BA3]'
                  }`}
                >
                  PRIORITY {incident.priorityScore}/100
                </span>

                {/* Status Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    incident.status === 'RESOLVED'
                      ? 'bg-[#0A3D1B] text-[#00C853]'
                      : incident.status === 'RESPONDING' || incident.status === 'ASSIGNED'
                      ? 'bg-[#FF6B00]/20 text-[#FF6B00]'
                      : 'bg-[#16253B] text-[#94A3B8]'
                  }`}
                >
                  {statusInfo.label}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-white mt-2.5">
                {incident.title}
              </h4>

              <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">
                {incident.description}
              </p>

              {/* Metadata chips */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 pt-2 border-t border-[#223854]/50 text-xs">
                <div className="flex items-center gap-1 text-[#00C2E0]">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>{incident.waterDepthMeters}m depth</span>
                </div>
                <div className="flex items-center gap-1 text-[#FF6B00]">
                  <Users className="w-3.5 h-3.5" />
                  <span>{incident.affectedPopulation} affected</span>
                </div>
                <div className="flex items-center gap-1 text-[#94A3B8] max-w-[200px] truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{incident.locationName}</span>
                </div>
              </div>

              {/* Assigned resource banner */}
              {incident.assignedResourceName && (
                <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#070E18] border border-[#00C853]/30 flex items-center gap-2">
                  <Anchor className="w-3.5 h-3.5 text-[#00C853]" />
                  <span className="text-xs font-semibold text-[#00C853]">
                    Assigned Unit: {incident.assignedResourceName}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
