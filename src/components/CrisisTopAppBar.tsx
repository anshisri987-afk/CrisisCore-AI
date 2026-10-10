import React from 'react';
import { useCrisis } from '../context/CrisisContext';
import { USER_ROLES } from '../types';
import { User, RefreshCw } from 'lucide-react';

export const CrisisTopAppBar: React.FC = () => {
  const {
    userRole,
    currentLanguage,
    toggleLanguage,
    setScreen,
    resetAllData
  } = useCrisis();

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
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C853] animate-pulse"></span>
          <span className="absolute w-4 h-4 rounded-full bg-[#00C853]/30 animate-ping"></span>
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-wider text-white leading-tight">
            CRISISCORE AI
          </h1>
          <p className="text-[10px] font-semibold text-[#00C2E0] uppercase tracking-wide">
            {currentLanguage === 'HI'
              ? 'आपदा प्रतिक्रिया प्रणाली'
              : 'URBAN FLOOD COMMAND • SENSE → ADAPT'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Reset / Baseline Helper */}
        <button
          onClick={resetAllData}
          title="Reset Baseline Telemetry"
          className="p-1.5 rounded-lg border border-[#223854] text-[#94A3B8] hover:text-[#00C2E0] hover:border-[#00C2E0]/40 transition text-xs flex items-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
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
