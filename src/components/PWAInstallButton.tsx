import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';
import { InstallModal } from './InstallModal';

interface PWAInstallButtonProps {
  compact?: boolean;
  variant?: 'primary' | 'outline' | 'banner';
  className?: string;
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  variant = 'primary',
  className = '',
  label
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running inside an installed standalone PWA, suppress the install button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        // If dismissed or failed, show the modal guide
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const renderLabel = () => {
    if (label) return label;
    if (compact) {
      return (
        <>
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </>
      );
    }
    return 'Install App';
  };

  return (
    <>
      {variant === 'banner' ? (
        <button
          onClick={handleClick}
          data-testid="pwa_install_banner_btn"
          className={`flex items-center justify-between w-full p-3.5 rounded-xl bg-gradient-to-r from-[#FF6B00]/20 via-[#16253B] to-[#0E1A2B] border border-[#FF6B00]/70 hover:border-[#FF6B00] text-white transition shadow-lg group ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center text-white shadow">
              <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Install CrisisCore AI</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30">
                  OFFLINE READY
                </span>
              </h4>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Add to Home Screen or Desktop for instant offline access and alerts
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-[#FF6B00] hover:bg-[#FF8533] text-xs font-bold text-white shadow shrink-0">
            Install Now
          </span>
        </button>
      ) : variant === 'outline' ? (
        <button
          onClick={handleClick}
          data-testid="pwa_install_btn"
          className={`flex items-center gap-1.5 rounded-lg border border-[#FF6B00]/60 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 text-[#FF6B00] hover:text-white font-bold transition shadow-sm ${
            compact ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-2 text-xs'
          } ${className}`}
          title="Install CrisisCore for field offline use"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{renderLabel()}</span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          data-testid="pwa_install_btn"
          className={`flex items-center gap-1.5 rounded-lg bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold transition shadow-md shadow-[#FF6B00]/20 ${
            compact ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-2 text-xs'
          } ${className}`}
          title="Install CrisisCore for field offline use"
        >
          <Download className="w-3.5 h-3.5 animate-pulse" />
          <span>{renderLabel()}</span>
        </button>
      )}

      {/* Guided installation instructions modal */}
      <InstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
