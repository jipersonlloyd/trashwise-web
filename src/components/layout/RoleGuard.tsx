import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/user';

interface Props {
  roles: UserRole[];
}

export default function RoleGuard({ roles }: Props) {
  const { isAuthenticated, profile, loading, initialized } = useAuth();
  const location = useLocation();

  // Still loading auth state
  if (!initialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → bounce to their home
  if (!roles.includes(profile.role)) {
    const home =
      profile.role === 'admin'
        ? '/admin/dashboard'
        : profile.role === 'staff'
        ? '/staff/queue'
        : '/login'; // users shouldn't be on web
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}