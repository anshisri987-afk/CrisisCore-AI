import React, { useEffect } from 'react';
import { useCrisis } from '../context/CrisisContext';
import { AlertCircle, X } from 'lucide-react';

export const SnackbarNotification: React.FC = () => {
  const { statusMessage, clearStatusMessage } = useCrisis();

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        clearStatusMessage();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage, clearStatusMessage]);

  if (!statusMessage) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] animate-fade-in">
      <div className="bg-[#16253B] border border-[#00C2E0]/60 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#00C2E0] shrink-0" />
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#F0F4F8]">
            {statusMessage}
          </p>
        </div>
        <button
          onClick={clearStatusMessage}
          className="text-[#94A3B8] hover:text-white p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
