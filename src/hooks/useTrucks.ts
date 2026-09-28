import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Truck } from '@/types/barangay';

export function useTrucks() {
  return useQuery({
    queryKey: ['trucks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .order('plate_no');
      if (error) throw error;
      return (data ?? []) as Truck[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTruck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Truck>) => {
      const { error } = await supabase.from('trucks').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trucks'] }),
  });
}

export function useUpdateTruck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Truck> & { id: string }) => {
      const { error } = await supabase.from('trucks').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trucks'] }),
  });
}

export function useDeleteTruck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trucks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trucks'] }),
  });
}