import React from 'react';
import { useCrisis } from '../context/CrisisContext';
import { USER_ROLES } from '../types';
import { User, RefreshCw, Wifi, WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';

export const CrisisTopAppBar: React.FC = () => {
  const {
    userRole,
    currentLanguage,
    toggleLanguage,
    currentScreen,
    setScreen,
    resetAllData,
    syncEmergencyCache,
    isSyncingCache
  } = useCrisis();

  const isOnline = useOnlineStatus();
  const roleMeta = USER_ROLES[userRole];

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'DISASTER_AUTHORITY':
        return 'bg-[#4A1010] text-[#E53935] border-[#E53935]/40';
      case 'RESCUE_FIELD_TEAM':
        return 'bg-[#FF6B00]/20 text-[#FF6B00] border-[#FF6B00]/40';
      case 'CITIZEN_REPORTER':
        return 'bg-[#00C2E0]/20 text-[#00C2E0] border-[#00C2E0]/40';
      case 'RELIEF_COORDINATOR':
        return 'bg-[#0A3D1B] text-[#00C853] border-[#00C853]/40';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070E18]/95 backdrop-blur-md border-b border-[#223854] px-4 py-3 flex items-center justify-between">
      {/* Brand & Subtitle */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setScreen('HOME')}
      >
        {/* Main Brand Logo */}
        <div className="relative flex items-center justify-center shrink-0">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-10-23_at_6.42.57_PM_4871f69a.jpeg"
            alt="CrisisCore AI Official Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-black border border-[#FF6B00]/40 shadow-md shadow-[#FF6B00]/10"
          />
          <span
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#070E18] ${
              isOnline ? 'bg-[#00C853] animate-pulse' : 'bg-[#FF6B00]'
            }`}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-wider text-white leading-tight">
              CRISISCORE AI
            </h1>

            {/* Network / Offline Cache Badge */}
            <span
              data-testid="connectivity_status_pill"
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOnline
                  ? 'bg-[#00C853]/15 text-[#00C853] border-[#00C853]/30'
                  : 'bg-[#FF6B00]/20 text-[#FF6B00] border-[#FF6B00]/40 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>OFFLINE CACHED</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* In-App PWA Install Button */}
        <PWAInstallButton compact />

        {/* Sync Emergency Cache Helper */}
        <button
          onClick={syncEmergencyCache}
          disabled={isSyncingCache}
          title="Sync Emergency Resources & Routes Cache"
          data-testid="sync_cache_button"
          className="p-1.5 rounded-lg border border-[#223854] text-[#94A3B8] hover:text-[#00C2E0] hover:border-[#00C2E0]/40 transition text-xs flex items-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCache ? 'animate-spin text-[#00C2E0]' : ''}`} />
        </button>

        {/* SQLite Offline Backup & Query Button */}
        <button
          onClick={() => setScreen('OFFLINE_BACKUP')}
          data-testid="sqlite_backup_topbar_button"
          title="SQLite Offline Backup & Query Console"
          className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1 ${
            currentScreen === 'OFFLINE_BACKUP'
              ? 'border-[#00C2E0] bg-[#00C2E0]/20 text-[#00C2E0]'
              : 'border-[#223854] text-[#94A3B8] hover:text-[#00C2E0] hover:border-[#00C2E0]/40'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-[#00C2E0]" />
          <span className="hidden sm:inline text-[10px] font-bold tracking-wider">SQLITE</span>
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          data-testid="language_toggle_button"
          className="px-2.5 py-1 rounded-lg border border-[#223854] text-xs font-bold text-[#00C2E0] hover:bg-[#16253B] transition"
        >
          {currentLanguage === 'EN' ? 'हिन्दी' : 'EN'}
        </button>

        {/* Role Badge Button */}
        <button
          onClick={() => setScreen('USER_PROFILE')}
          data-testid="role_badge_selector"
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-wider transition hover:opacity-90 ${getRoleBadgeColor()}`}
        >
          {roleMeta.badge}
        </button>

        {/* Profile Icon */}
        <button
          onClick={() => setScreen('USER_PROFILE')}
          data-testid="profile_icon_button"
          className="p-1.5 rounded-lg text-[#F0F4F8] hover:bg-[#16253B] transition"
          title="User Profile"
        >
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
