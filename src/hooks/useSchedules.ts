import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Schedule } from '@/types/barangay';

export interface ScheduleWithRelations extends Schedule {
  barangay?: { id: string; name: string } | null;
  truck?: { id: string; plate_no: string } | null;
}

export function useSchedules() {
  return useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          barangay:barangays(id, name),
          truck:trucks(id, plate_no)
        `)
        .order('day_of_week')
        .order('time_window');
      if (error) throw error;
      return (data ?? []) as unknown as ScheduleWithRelations[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Schedule>) => {
      const { error } = await supabase.from('schedules').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Schedule> & { id: string }) => {
      const { error } = await supabase.from('schedules').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];