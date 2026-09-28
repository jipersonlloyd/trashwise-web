import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Barangay } from '@/types/barangay';

export function useBarangays() {
  return useQuery({
    queryKey: ['barangays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barangays')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Barangay[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBarangay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Barangay>) => {
      const { error } = await supabase.from('barangays').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['barangays'] }),
  });
}

export function useUpdateBarangay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Barangay> & { id: string }) => {
      const { error } = await supabase.from('barangays').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['barangays'] }),
  });
}

export function useDeleteBarangay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('barangays').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['barangays'] }),
  });
}