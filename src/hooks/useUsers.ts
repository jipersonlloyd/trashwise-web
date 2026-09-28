import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/user';

export interface UserWithBarangay extends Profile {
  barangay?: { id: string; name: string } | null;
  report_count?: number;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          barangay:barangays(id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as UserWithBarangay[];
    },
  });
}

/**
 * Invites a new user via Supabase Auth admin invite.
 * NOTE: This requires a service-role key on the server. For now we call
 * signUp with the user's email + a placeholder password; the user must
 * reset it. A better path is a Supabase Edge Function later.
 */
export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      full_name: string;
      role: UserRole;
      barangay_id?: string | null;
    }) => {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: payload.email,
          full_name: payload.full_name,
          role: payload.role,
          barangay_id: payload.barangay_id ?? null,
        },
      });

      if (error) throw new Error(error.message ?? 'Invite failed');
      if (data?.error) throw new Error(data.error);

      // Return the temporary password so we can show it to the admin
      return data as {
        user: { id: string; email: string };
        temporary_password: string;
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Pick<Profile, 'full_name' | 'phone' | 'role' | 'barangay_id' | 'is_active'>>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Deleting auth.users cascades to profiles via FK
      const { error } = await supabase.rpc('admin_delete_user', { user_id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}