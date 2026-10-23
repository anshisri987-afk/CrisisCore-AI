import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        data-testid="pwa_install_btn"
        className={`flex items-center gap-1.5 rounded-lg bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold transition shadow-md ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-2 text-xs'
        }`}
        title="Install CrisisCore for field offline use"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          data-testid="pwa_install_ios_btn"
          className={`flex items-center gap-1.5 rounded-lg border border-[#223854] bg-[#0E1A2B] text-[#CBD5E1] hover:text-white hover:border-[#00C2E0] font-semibold transition ${
            compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00C2E0]" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-[#0E1A2B] border border-[#223854] p-5 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#223854]">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#FF6B00]" />
                  <span>Install CrisisCore on iPhone/iPad</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[#94A3B8] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs text-[#94A3B8]">
                <p>
                  1. Tap the <strong className="text-white">Share</strong> icon at the bottom of Safari.
                </p>
                <p>
                  2. Scroll down and choose <strong className="text-white">Add to Home Screen</strong>.
                </p>
                <p>
                  3. Emergency data, routes, and tactical maps will remain operable offline.
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-[#FF6B00] hover:bg-[#FF8533] py-2 text-xs font-bold text-white transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
