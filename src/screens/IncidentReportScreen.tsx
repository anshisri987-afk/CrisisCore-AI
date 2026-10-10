import React from 'react';
import { useCrisis } from '../context/CrisisContext';
import { IncidentType, Severity, Urgency, INCIDENT_TYPES, SEVERITIES, URGENCIES } from '../types';
import {
  AlertCircle,
  Brain,
  Send,
  Droplets,
  Users,
  MapPin,
  Crosshair,
  Loader2
} from 'lucide-react';

export const IncidentReportScreen: React.FC = () => {
  const { formState, updateForm, runAiPreTriage, submitIncident, setScreen } = useCrisis();

  const incidentTypes: IncidentType[] = ['FLOOD', 'RESCUE', 'MEDICAL', 'COLLAPSE', 'FIRE'];
  const severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const urgencies: Urgency[] = ['IMMEDIATE', 'HIGH', 'NORMAL'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitIncident(() => {
      setScreen('HOME');
    });
  };

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto px-4 pt-3">
      {/* 1. Header Banner */}
      <div
        data-testid="report_header_card"
        className="bg-[#0E1A2B] border border-[#223854] rounded-2xl p-4 sm:p-5 shadow-xl flex items-start gap-3"
      >
        <div className="p-2.5 rounded-xl bg-[#FF6B00]/15 text-[#FF6B00] shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
            Emergency Incident Intake
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
            Real-time dispatch system. Multi-source citizen & responder telemetry. AI pre-triage verifies severity before queueing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 2. Title */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 shadow-sm">
          <label className="text-xs font-bold text-[#F0F4F8] block mb-1.5">
            Incident Title / Emergency Summary *
          </label>
          <input
            type="text"
            value={formState.title}
            onChange={(e) => updateForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. 15 Stranded on Rooftop, Yamuna Bund Sector 4"
            data-testid="input_incident_title"
            className="w-full bg-[#070E18] border border-[#223854] focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition"
            required
          />
        </div>

        {/* 3. Category */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 shadow-sm">
          <label className="text-xs font-bold text-[#F0F4F8] block mb-2">
            Incident Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {incidentTypes.map((type) => {
              const isSelected = formState.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateForm((prev) => ({ ...prev, type }))}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition border ${
                    isSelected
                      ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow'
                      : 'bg-[#070E18] text-[#94A3B8] border-[#223854] hover:text-white'
                  }`}
                >
                  {INCIDENT_TYPES[type].displayName}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Severity & Urgency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Severity */}
          <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 shadow-sm">
            <label className="text-xs font-bold text-[#F0F4F8] block mb-2">
              Severity Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {severities.map((sev) => {
                const isSelected = formState.severity === sev;
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => updateForm((prev) => ({ ...prev, severity: sev }))}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border ${
                      isSelected
                        ? sev === 'CRITICAL'
                          ? 'bg-[#E53935] text-white border-[#E53935]'
                          : sev === 'HIGH'
                          ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                          : 'bg-[#FFB300] text-black border-[#FFB300]'
                        : 'bg-[#070E18] text-[#94A3B8] border-[#223854]'
                    }`}
                  >
                    {SEVERITIES[sev].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency */}
          <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 shadow-sm">
            <label className="text-xs font-bold text-[#F0F4F8] block mb-2">
              Response Urgency
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {urgencies.map((urg) => {
                const isSelected = formState.urgency === urg;
                return (
                  <button
                    key={urg}
                    type="button"
                    onClick={() => updateForm((prev) => ({ ...prev, urgency: urg }))}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition border ${
                      isSelected
                        ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                        : 'bg-[#070E18] text-[#94A3B8] border-[#223854]'
                    }`}
                  >
                    {urg === 'IMMEDIATE' ? 'NOW (15m)' : urg === 'HIGH' ? '<45m' : 'Normal'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Environmental Flood Parameters (Water depth & victims) */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 space-y-4 shadow-sm">
          {/* Water Depth */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-[#00C2E0]" />
                Estimated Water Depth
              </span>
              <span className="font-black text-[#00C2E0] text-sm">
                {formState.waterDepthMeters.toFixed(1)} meters
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.1"
              value={formState.waterDepthMeters}
              onChange={(e) =>
                updateForm((prev) => ({
                  ...prev,
                  waterDepthMeters: parseFloat(e.target.value)
                }))
              }
              className="w-full accent-[#00C2E0] bg-[#16253B] rounded-lg h-2 cursor-pointer"
            />
          </div>

          {/* Affected Population */}
          <div className="flex items-center justify-between pt-2 border-t border-[#223854]">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#FF6B00]" />
              Estimated Victims / Trapped
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateForm((prev) => ({
                    ...prev,
                    affectedPopulation: Math.max(1, prev.affectedPopulation - 1)
                  }))
                }
                className="w-8 h-8 rounded-lg bg-[#16253B] hover:bg-[#223854] text-white font-bold text-sm flex items-center justify-center border border-[#223854]"
              >
                -
              </button>
              <span className="w-10 text-center font-black text-white text-base">
                {formState.affectedPopulation}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateForm((prev) => ({
                    ...prev,
                    affectedPopulation: prev.affectedPopulation + 5
                  }))
                }
                className="w-8 h-8 rounded-lg bg-[#16253B] hover:bg-[#223854] text-white font-bold text-sm flex items-center justify-center border border-[#223854]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 6. Location Tagging */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 shadow-sm">
          <label className="text-xs font-bold text-[#F0F4F8] block mb-1.5">
            Incident Location / Landmark
          </label>
          <div className="relative">
            <input
              type="text"
              value={formState.locationName}
              onChange={(e) =>
                updateForm((prev) => ({ ...prev, locationName: e.target.value }))
              }
              placeholder="e.g. Near Geeta Colony Flyover, Pillar 48"
              data-testid="input_location_name"
              className="w-full bg-[#070E18] border border-[#223854] focus:border-[#FF6B00] rounded-xl pl-9 pr-12 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition"
            />
            <MapPin className="w-4 h-4 text-[#FF6B00] absolute left-3 top-3.5" />
            <button
              type="button"
              onClick={() =>
                updateForm((prev) => ({
                  ...prev,
                  locationName: 'Sector 14 Bund Road (GPS Tagged)',
                  latitude: 28.6185,
                  longitude: 77.2210
                }))
              }
              title="Tag GPS Location"
              className="absolute right-2 top-2 p-1.5 rounded-lg bg-[#16253B] text-[#00C2E0] hover:bg-[#223854] transition"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7. Detailed Description */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 shadow-sm">
          <label className="text-xs font-bold text-[#F0F4F8] block mb-1.5">
            Incident Description & Urgent Needs
          </label>
          <textarea
            rows={3}
            value={formState.description}
            onChange={(e) =>
              updateForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Water current is strong, electric cables submerged, need immediate boat and food..."
            data-testid="input_description"
            className="w-full bg-[#070E18] border border-[#223854] focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition"
          />
        </div>

        {/* 8. AI Pre-Triage Assessment Trigger & Results */}
        <div
          data-testid="ai_pre_triage_section"
          className="bg-[#16253B] border border-[#00C2E0]/60 rounded-xl p-4 shadow-md space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#00C2E0]" />
              <h3 className="text-xs sm:text-sm font-bold text-[#00C2E0]">
                Gemini AI Incident Pre-Triage
              </h3>
            </div>
            <button
              type="button"
              onClick={runAiPreTriage}
              disabled={formState.isAnalyzing}
              data-testid="run_ai_triage_button"
              className="py-1.5 px-3 bg-[#008BA3] hover:bg-[#00C2E0] disabled:opacity-70 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
            >
              {formState.isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Analyze Risk</span>
              )}
            </button>
          </div>

          {formState.aiTriageSuggestion ? (
            <div className="pt-2 border-t border-[#223854] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#FF6B00]">
                  AI Assessment: Priority Score {formState.aiTriageSuggestion.priorityScore}/100
                </span>
                <span className="font-semibold text-[#00C853]">
                  {formState.aiTriageSuggestion.recommendedResource}
                </span>
              </div>
              <p className="text-white leading-relaxed">
                {formState.aiTriageSuggestion.reasoning}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8]">
              Tap 'Analyze Risk' to allow Gemini to calculate urgency, priority score, and optimal resource recommendation.
            </p>
          )}
        </div>

        {/* 9. Submit Button */}
        <button
          type="submit"
          data-testid="submit_incident_button"
          className="w-full h-12 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-black text-sm uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xl"
        >
          <Send className="w-4 h-4" />
          <span>TRANSMIT DISASTER REPORT</span>
        </button>
      </form>
    </div>
  );
};
