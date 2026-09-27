import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  Truck,
  CalendarDays,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AppShell() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const isAdmin = profile.role === 'admin';

  const navItems = [
    ...(isAdmin
      ? [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
      : []),
    { to: '/staff/queue', label: 'Reports Queue', icon: ClipboardList },
    ...(isAdmin
      ? [
          { to: '/admin/users', label: 'Users', icon: Users },
          { to: '/admin/barangays', label: 'Barangays', icon: Building2 },
          { to: '/admin/trucks', label: 'Trucks', icon: Truck },
          { to: '/admin/schedules', label: 'Schedules', icon: CalendarDays },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <span className="text-lg font-bold tracking-tight">🗑️ TrashWise</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile.role}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}