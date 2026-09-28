import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import RoleGuard from '@/components/layout/RoleGuard';
import AppShell from '@/components/layout/AppShell';
import Placeholder from '@/pages/PlaceHolder';
import QueuePage from '@/pages/staff/QueuePage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    element: <RoleGuard roles={['staff', 'admin']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/staff/queue', element: <QueuePage /> },
          { path: '/staff/reports/:id', element: <Placeholder title="Report Detail" /> },
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
          { path: '/admin/dashboard', element: <Placeholder title="Dashboard" /> },
          { path: '/admin/users', element: <Placeholder title="Users" /> },
          { path: '/admin/barangays', element: <Placeholder title="Barangays" /> },
          { path: '/admin/trucks', element: <Placeholder title="Trucks" /> },
          { path: '/admin/schedules', element: <Placeholder title="Schedules" /> },
        ],
      },
    ],
  },

  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);