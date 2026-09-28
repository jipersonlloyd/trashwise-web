import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/user';
import { supabase } from '@/lib/supabase';

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

  // Not logged in
  if (!isAuthenticated || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account deactivated by admin
  if (!profile.is_active) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold mb-2">Account Deactivated</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Your account has been deactivated by an administrator.
            Contact your LGU office if you believe this is a mistake.
          </p>
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
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