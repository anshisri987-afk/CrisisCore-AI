import React from 'react';
import { useCrisis } from '../context/CrisisContext';
import { UserRole, USER_ROLES } from '../types';
import { User, LogOut, PhoneCall } from 'lucide-react';

export const UserProfileScreen: React.FC = () => {
  const {
    userEmail,
    userRole,
    setUserRole,
    currentLanguage,
    toggleLanguage,
    logout
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

      {/* 5. Sign Out Button */}
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
