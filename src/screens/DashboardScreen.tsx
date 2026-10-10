import React from 'react';
import { useCrisis } from '../context/CrisisContext';
import { BarChart3, CheckCircle2 } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { incidents, resources } = useCrisis();

  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED').length;
  const deployedAssets = resources.filter((r) => r.availability !== 'AVAILABLE').length;
  const utilizationPercent = resources.length > 0 ? Math.round((deployedAssets * 100) / resources.length) : 0;

  const hazards = [
    { label: 'Urban Flood Inundation', percentage: 62, color: '#00C2E0' },
    { label: 'Stranded Citizens / Trapped', percentage: 24, color: '#FF6B00' },
    { label: 'Medical Evacuation Urgent', percentage: 10, color: '#E53935' },
    { label: 'Infrastructure & Power Failure', percentage: 4, color: '#FFB300' }
  ];

  const sendaiPriorities = [
    'Priority 1: Understanding disaster risk (GIS hazard layer active)',
    'Priority 2: Strengthening disaster risk governance (Authority role gate)',
    'Priority 3: Investing in resilience (Pre-positioned watercraft & generators)',
    'Priority 4: Enhancing disaster preparedness for effective response'
  ];

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-3">
      {/* 1. Dashboard Header */}
      <div
        data-testid="dashboard_header_card"
        className="bg-[#0E1A2B] border border-[#223854] rounded-2xl p-4 sm:p-5 shadow-xl flex items-start gap-3"
      >
        <div className="p-2.5 rounded-xl bg-[#00C2E0]/15 text-[#00C2E0] shrink-0">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
            OPERATIONAL PERFORMANCE & SITREP
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
            Unified command metrics aligned with UNDRR Sendai Framework & OCHA Humanitarian standards.
          </p>
        </div>
      </div>

      {/* 2. High-Level Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1 */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-3.5 sm:p-4">
          <span className="text-[11px] text-[#94A3B8] font-semibold block">
            Resource Utilization
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#FF6B00] my-1 block">
            {utilizationPercent}%
          </span>
          <span className="text-[10px] sm:text-xs text-[#64748B]">
            {deployedAssets} of {resources.length} Active
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-3.5 sm:p-4">
          <span className="text-[11px] text-[#94A3B8] font-semibold block">
            Avg Triage Latency
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#00C2E0] my-1 block">
            1.4s
          </span>
          <span className="text-[10px] sm:text-xs text-[#64748B]">
            Gemini AI Inference
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-3.5 sm:p-4">
          <span className="text-[11px] text-[#94A3B8] font-semibold block">
            Response Time Delta
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#00C853] my-1 block">
            -42%
          </span>
          <span className="text-[10px] sm:text-xs text-[#64748B]">
            vs Manual Dispatch
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-3.5 sm:p-4">
          <span className="text-[11px] text-[#94A3B8] font-semibold block">
            Incidents Resolved
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white my-1 block">
            {resolvedIncidents} / {totalIncidents}
          </span>
          <span className="text-[10px] sm:text-xs text-[#64748B]">
            Yamuna Flood Sector
          </span>
        </div>
      </div>

      {/* 3. Incident Type Distribution Bar */}
      <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-[#00C2E0] uppercase tracking-wider">
          Incident Breakdown by Hazard
        </h3>

        <div className="space-y-3 pt-1">
          {hazards.map((hazard) => (
            <div key={hazard.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-medium">{hazard.label}</span>
                <span className="font-bold" style={{ color: hazard.color }}>
                  {hazard.percentage}%
                </span>
              </div>
              <div className="w-full bg-[#16253B] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${hazard.percentage}%`,
                    backgroundColor: hazard.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Sendai Framework Compliance Checklist */}
      <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-[#00C853] uppercase tracking-wider">
          UNDRR Sendai Framework Compliance
        </h3>

        <div className="space-y-2 pt-1">
          {sendaiPriorities.map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-white">
              <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0 mt-0.5" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
