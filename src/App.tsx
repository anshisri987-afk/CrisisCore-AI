import React from 'react';
import { useCrisis } from './context/CrisisContext';
import { CrisisTopAppBar } from './components/CrisisTopAppBar';
import { CrisisBottomNavigation } from './components/CrisisBottomNavigation';
import { SnackbarNotification } from './components/SnackbarNotification';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SituationalMapScreen } from './screens/SituationalMapScreen';
import { ResourceAllocationScreen } from './screens/ResourceAllocationScreen';
import { IncidentReportScreen } from './screens/IncidentReportScreen';
import { RouteTrackingScreen } from './screens/RouteTrackingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CrisisChatScreen } from './screens/CrisisChatScreen';
import { UserProfileScreen } from './screens/UserProfileScreen';

export const App: React.FC = () => {
  const { isAuthenticated, currentScreen } = useCrisis();

  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen />
        <SnackbarNotification />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#070E18] text-[#F0F4F8] flex flex-col font-sans selection:bg-[#FF6B00]/30 selection:text-white">
      <CrisisTopAppBar />

      <main className="flex-1 w-full overflow-x-hidden">
        {currentScreen === 'HOME' && <HomeScreen />}
        {currentScreen === 'SITUATIONAL_MAP' && <SituationalMapScreen />}
        {currentScreen === 'RESOURCE_ALLOCATION' && <ResourceAllocationScreen />}
        {currentScreen === 'REPORT_INCIDENT' && <IncidentReportScreen />}
        {currentScreen === 'ROUTE_TRACKING' && <RouteTrackingScreen />}
        {currentScreen === 'OPERATIONS_DASHBOARD' && <DashboardScreen />}
        {currentScreen === 'AI_ASSISTANT' && <CrisisChatScreen />}
        {currentScreen === 'USER_PROFILE' && <UserProfileScreen />}
      </main>

      <CrisisBottomNavigation />
      <SnackbarNotification />
    </div>
  );
};
