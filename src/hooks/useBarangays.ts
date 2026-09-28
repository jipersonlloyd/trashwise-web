import { useQuery } from '@tanstack/react-query';
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