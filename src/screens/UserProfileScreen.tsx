import React from 'react';
import { useCrisis } from '../context/CrisisContext';
import { UserRole, USER_ROLES } from '../types';
import { User, LogOut, PhoneCall, Database, Download, ChevronRight, Cloud, RefreshCw } from 'lucide-react';

export const UserProfileScreen: React.FC = () => {
  const {
    userEmail,
    userRole,
    setUserRole,
    currentLanguage,
    toggleLanguage,
    logout,
    setScreen,
    sqliteStats,
    downloadSqliteBackup,
    isFirebaseConnected,
    isCloudSyncing,
    syncAllToFirestore,
    signInWithGoogleAuth
  } = useCrisis();

  const roles: UserRole[] = [
    'DISASTER_AUTHORITY',
    'RESCUE_FIELD_TEAM',
    'CITIZEN_REPORTER',
    'RELIEF_COORDINATOR'
  ];

  const helplines = [
    { label: 'NDRF Disaster Helpline', number: '1078' },
    { label: 'State Disaster Control Room', number: '1070' },
    { label: 'Emergency Ambulance (ALS/BLS)', number: '108' },
    { label: 'National Emergency Number', number: '112' }
  ];

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto px-4 pt-3">
      {/* 1. User Identity Card */}
      <div
        data-testid="user_profile_header"
        className="bg-[#0E1A2B] border border-[#223854] rounded-2xl p-4 sm:p-5 shadow-xl flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-[#FF6B00] flex items-center justify-center text-white shrink-0 shadow-lg">
          <User className="w-8 h-8" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-white truncate">
            {userEmail || 'Emergency Responder'}
          </h3>
          <p className="text-xs text-[#00C853] font-semibold mt-0.5">
            Authenticated via Google Sign-In
          </p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#008BA3]/30 text-[#00C2E0] text-[10px] font-black uppercase tracking-wide border border-[#00C2E0]/40">
            ROLE: {USER_ROLES[userRole].label.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. Role Selector (Multi-Role Permissions) */}
      <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-[#FF6B00] uppercase tracking-wider">
          Select Operational Role & Access
        </h3>

        <div className="space-y-2">
          {roles.map((role) => {
            const isSelected = userRole === role;
            const info = USER_ROLES[role];

            return (
              <div
                key={role}
                onClick={() => setUserRole(role)}
                data-testid={`role_option_${role}`}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#16253B] border-[#FF6B00] shadow'
                    : 'bg-transparent border-[#223854] hover:bg-[#122035]'
                }`}
              >
                <div>
                  <h4
                    className={`text-xs sm:text-sm font-bold ${
                      isSelected ? 'text-[#FF6B00]' : 'text-white'
                    }`}
                  >
                    {info.label}
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    {info.description}
                  </p>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-[#FF6B00]' : 'border-[#64748B]'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Language & Preferences */}
      <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white">App Language</h4>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {currentLanguage === 'EN'
              ? 'English (International)'
              : 'हिन्दी (Hindi Disaster Response)'}
          </p>
        </div>

        <button
          onClick={toggleLanguage}
          className="py-1.5 px-3 bg-[#008BA3] hover:bg-[#00C2E0] text-white font-bold text-xs rounded-lg transition"
        >
          {currentLanguage === 'EN' ? 'Switch to हिन्दी' : 'Switch to EN'}
        </button>
      </div>

      {/* 4. National Emergency Helplines */}
      <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-[#E53935]" />
          <h4 className="text-xs sm:text-sm font-bold text-[#E53935] uppercase tracking-wider">
            National Emergency Helplines
          </h4>
        </div>

        <div className="divide-y divide-[#223854]/60">
          {helplines.map((h) => (
            <div key={h.number} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
              <span className="text-white">{h.label}</span>
              <span className="font-black text-sm text-[#FF6B00]">{h.number}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Cloud Firestore & Multi-Device Sync */}
      <div
        data-testid="user_profile_firebase_card"
        className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 sm:p-5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[#FF6B00]" />
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Firebase Cloud Firestore Sync
            </h4>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isFirebaseConnected
                ? 'bg-[#00C853]/20 text-[#00C853] border-[#00C853]/30'
                : 'bg-[#FFB300]/20 text-[#FFB300] border-[#FFB300]/30'
            }`}
          >
            {isFirebaseConnected ? 'CLOUD CONNECTED' : 'OFFLINE-READY'}
          </span>
        </div>

        <p className="text-xs text-[#94A3B8]">
          Connected to Firebase Project <span className="text-white font-mono font-bold">crisiscore-ai-c8e27</span>. Live multi-device syncing for incidents, resource deployments, and emergency alerts.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-xs text-[#CBD5E1]">
            <span className="text-[#00C2E0] font-bold">Collections:</span> /incidents, /resources, /assignments, /alerts, /users
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => syncAllToFirestore()}
              disabled={isCloudSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B00] hover:bg-[#E05E00] text-xs font-bold text-white transition shadow disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>{isCloudSyncing ? 'Syncing...' : 'Sync to Cloud (Firestore)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Offline SQLite Database & Backup Center */}
      <div
        data-testid="user_profile_sqlite_card"
        className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 sm:p-5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00C2E0]" />
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Offline SQLite Engine & Backup
            </h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30">
            WASM ACTIVE
          </span>
        </div>

        <p className="text-xs text-[#94A3B8]">
          Embedded relational database storing all incident telemetry, disaster resources, active dispatches, and emergency routing waypoints directly on device with zero internet dependency.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-xs text-[#CBD5E1]">
            <span className="text-[#00C2E0] font-bold font-mono">{sqliteStats?.totalRows ?? 0}</span> cached records • <span className="text-[#FFB300] font-bold font-mono">{sqliteStats?.totalTables ?? 6}</span> tables
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadSqliteBackup()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16253B] hover:bg-[#1E3352] text-xs font-bold text-[#00C2E0] border border-[#223854] transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .sqlite</span>
            </button>
            <button
              onClick={() => setScreen('OFFLINE_BACKUP')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00C2E0] hover:bg-[#00ADC8] text-xs font-bold text-[#070E18] transition shadow"
            >
              <span>Open SQL Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Official System Badge with Logo */}
      <div className="bg-[#0E1A2B] border border-[#223854] rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
        <img
          src="/assets/aistudio/WhatsApp_Image_2026-10-23_at_6.42.57_PM_4871f69a.jpeg"
          alt="CrisisCore AI Official Logo"
          className="w-12 h-12 rounded-xl object-contain bg-black border border-[#FF6B00]/40 shrink-0 shadow-md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-black tracking-wider text-white">CRISISCORE AI</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 uppercase">
              OFFICIAL SYSTEM
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-snug">
            Autonomous Emergency Resource Allocation & Multi-Hazard Disaster Response Platform.
          </p>
        </div>
      </div>

      {/* 6. Sign Out Button */}
      <button
        onClick={logout}
        data-testid="sign_out_button"
        className="w-full h-11 border border-[#E53935] text-[#E53935] hover:bg-[#E53935]/10 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of CrisisCore AI Session</span>
      </button>
    </div>
  );
};
