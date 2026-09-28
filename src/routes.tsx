import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import RoleGuard from '@/components/layout/RoleGuard';
import AppShell from '@/components/layout/AppShell';
import Placeholder from '@/pages/PlaceHolder';
import QueuePage from '@/pages/staff/QueuePage';
import ReportDetailPage from '@/pages/staff/ReportDetailPage';
import BarangaysPage from '@/pages/admin/BarangaysPage';
import TrucksPage from '@/pages/admin/TrucksPage';
import SchedulesPage from '@/pages/admin/SchedulesPage';
import DashboardPage from '@/pages/admin/DashboardPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    element: <RoleGuard roles={['staff', 'admin']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/staff/queue', element: <QueuePage /> },
          { path: '/staff/reports/:id', element: <ReportDetailPage /> },
        ],
      },
    ],
  },

  {
    element: <RoleGuard roles={['admin']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/admin/dashboard', element: <DashboardPage /> },
          { path: '/admin/users', element: <Placeholder title="Users" /> },
          { path: '/admin/barangays', element: <BarangaysPage /> },
          { path: '/admin/trucks', element: <TrucksPage /> },
          { path: '/admin/schedules', element: <SchedulesPage /> },
        ],
      },
    ],
  },

  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);