import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/user';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.initialized) {
      store.init();
    }
  }, [store.initialized]);

  const role: UserRole | null = store.profile?.role ?? null;

  return {
    ...store,
    role,
    isAuthenticated: !!store.session && !!store.profile,
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
    isStaffOrAdmin: role === 'staff' || role === 'admin',
  };
}