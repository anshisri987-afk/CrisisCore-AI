import React, { useState } from 'react';
import { useCrisis } from '../context/CrisisContext';
import { UserRole, USER_ROLES } from '../types';
import { Shield, Lock } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login } = useCrisis();
  const [selectedRole, setSelectedRole] = useState<UserRole>('DISASTER_AUTHORITY');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login('commander.delhi@crisiscore.gov.in', selectedRole);
    }, 600);
  };

  const handleDemoAccess = () => {
    login('ops_command@crisiscore.gov', selectedRole);
  };

  const roles: UserRole[] = [
    'DISASTER_AUTHORITY',
    'RESCUE_FIELD_TEAM',
    'CITIZEN_REPORTER',
    'RELIEF_COORDINATOR'
  ];

  return (
    <div className="min-h-screen bg-[#070E18] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0E1A2B] border border-[#223854] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* App Icon */}
        <div className="w-24 h-24 rounded-full bg-[#0E1A2B] border-2 border-[#FF6B00] flex items-center justify-center p-2 overflow-hidden shadow-lg shadow-[#FF6B00]/10">
          <img
            src="/crisiscore_icon.jpg"
            alt="CrisisCore AI Shield"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Branding */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white">
            CRISISCORE AI
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#00C2E0] mt-1.5">
            AI-Powered Emergency Resource Allocation & Disaster Response System
          </p>
        </div>

        {/* Role Selector Card */}
        <div className="w-full bg-[#16253B] border border-[#223854] rounded-xl p-4 text-left">
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
            Select Operational Credential Role
          </p>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold text-center transition border ${
                    isSelected
                      ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-md'
                      : 'bg-[#0E1A2B] text-[#94A3B8] border-[#223854] hover:text-white hover:border-[#00C2E0]/40'
                  }`}
                >
                  {USER_ROLES[role].label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[#00C2E0] mt-2 italic">
            Active permissions: {USER_ROLES[selectedRole].description}
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3 pt-2">
          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            data-testid="google_sign_in_button"
            className="w-full h-12 bg-white hover:bg-slate-100 text-[#070E18] font-bold rounded-xl transition flex items-center justify-center gap-3 shadow-lg disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#070E18] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Quick Demo Access */}
          <button
            onClick={handleDemoAccess}
            data-testid="emergency_demo_entry_button"
            className="w-full h-12 bg-[#0E1A2B] hover:bg-[#16253B] text-[#00C2E0] border border-[#00C2E0]/50 font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4 text-[#00C2E0]" />
            <span>Immediate Operational Dispatch Access</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
          <Lock className="w-3 h-3 text-[#64748B]" />
          <span>NDRF • SDRF • Disaster Management Authority • Sendai Framework</span>
        </div>
      </div>
    </div>
  );
};
