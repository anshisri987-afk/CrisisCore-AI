import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useCrisis } from '../context/CrisisContext';
import { WifiOff, ShieldCheck, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { offlineMeta, queuedIncidentsCount, syncEmergencyCache, isSyncingCache } = useCrisis();

  if (isOnline && queuedIncidentsCount === 0) {
    return null;
  }

  return (
    <div
      data-testid="offline_emergency_banner"
      className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-50 max-w-md bg-[#0E1A2B]/95 border border-[#FF6B00] rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all"
    >
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] shrink-0 mt-0.5">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 animate-pulse" />
          ) : (
            <RefreshCw className="w-4 h-4 animate-spin" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FF6B00] flex items-center gap-1.5">
              <span>{!isOnline ? 'OFFLINE EMERGENCY CACHE ACTIVE' : 'NETWORK RESTORED'}</span>
            </span>

            {queuedIncidentsCount > 0 && (
              <span className="text-[10px] font-bold bg-[#FF6B00] text-white px-1.5 py-0.2 rounded-full">
                {queuedIncidentsCount} queued
              </span>
            )}
          </div>

          <p className="text-[11px] text-[#CBD5E1] mt-0.5 leading-tight">
            {!isOnline
              ? `Operational with ${offlineMeta?.resourceCount ?? 6} cached resources & critical escape corridors.`
              : 'Synchronizing field incident queue with command telemetry...'}
          </p>

          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#223854] text-[10px] text-[#94A3B8]">
            <span className="flex items-center gap-1 text-[#00C853]">
              <ShieldCheck className="w-3 h-3" />
              <span>Offline Routes Armed</span>
            </span>

            {isOnline && (
              <button
                onClick={syncEmergencyCache}
                disabled={isSyncingCache}
                className="text-[#00C2E0] hover:underline font-bold disabled:opacity-50"
              >
                {isSyncingCache ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
