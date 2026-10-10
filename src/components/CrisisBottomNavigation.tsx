import React from 'react';
import { useCrisis } from '../context/CrisisContext';
import { AppScreen } from '../types';
import {
  LayoutDashboard,
  Map,
  Share2,
  AlertCircle,
  Navigation,
  Bot
} from 'lucide-react';

export const CrisisBottomNavigation: React.FC = () => {
  const { currentScreen, setScreen, alerts } = useCrisis();
  const unreadAlertCount = alerts.filter((a) => !a.isRead).length;

  const navItems: Array<{
    screen: AppScreen;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    testId: string;
    isAi?: boolean;
    badge?: number;
  }> = [
    {
      screen: 'HOME',
      label: 'Overview',
      icon: LayoutDashboard,
      testId: 'nav_home'
    },
    {
      screen: 'SITUATIONAL_MAP',
      label: 'GIS Map',
      icon: Map,
      testId: 'nav_map'
    },
    {
      screen: 'RESOURCE_ALLOCATION',
      label: 'Allocate',
      icon: Share2,
      testId: 'nav_allocate'
    },
    {
      screen: 'REPORT_INCIDENT',
      label: 'Report',
      icon: AlertCircle,
      testId: 'nav_report',
      badge: unreadAlertCount > 0 ? unreadAlertCount : undefined
    },
    {
      screen: 'ROUTE_TRACKING',
      label: 'Tracking',
      icon: Navigation,
      testId: 'nav_tracking'
    },
    {
      screen: 'AI_ASSISTANT',
      label: 'AI Ops',
      icon: Bot,
      testId: 'nav_ai',
      isAi: true
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070E18] border-t border-[#223854] px-2 py-1 shadow-2xl">
      <div className="max-w-2xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          const Icon = item.icon;

          return (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              data-testid={item.testId}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition duration-150 min-w-[52px] ${
                isActive
                  ? item.isAi
                    ? 'text-[#00C2E0]'
                    : 'text-[#FF6B00]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition ${
                  isActive
                    ? item.isAi
                      ? 'bg-[#008BA3]/20'
                      : 'bg-[#FF6B00]/20'
                    : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>

              {item.badge !== undefined && (
                <span className="absolute top-1 right-2.5 w-4 h-4 bg-[#E53935] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
