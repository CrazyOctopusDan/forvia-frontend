import type { ReactNode } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/shared/ui/AppShell';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { LayoutConfigPage } from '@/pages/config-layout/LayoutConfigPage';
import { ThresholdConfigPage } from '@/pages/config-threshold/ThresholdConfigPage';
import { AlarmsPage } from '@/pages/alarms/AlarmsPage';

function withShell(children: ReactNode) {
  return <AppShell>{children}</AppShell>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/dashboard',
    element: withShell(<DashboardPage />)
  },
  {
    path: '/config/layout',
    element: withShell(<LayoutConfigPage />)
  },
  {
    path: '/config/threshold',
    element: withShell(<ThresholdConfigPage />)
  },
  {
    path: '/alarms',
    element: withShell(<AlarmsPage />)
  }
]);
