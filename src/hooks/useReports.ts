import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ReportWithRelations, ReportStatus } from '@/types/report';
import { useAuth } from '@/hooks/useAuth';

interface ReportFilters {
  status?: ReportStatus | 'all';
  barangayId?: string | 'all';
  reason?: string | 'all';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function useReports(filters: ReportFilters = {}) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['reports', filters, profile?.barangay_id, profile?.role],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select(`
          *,
          barangay:barangays(id, name),
          submitter:profiles!reports_submitted_by_fkey(id, full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.barangayId && filters.barangayId !== 'all') {
        query = query.eq('barangay_id', filters.barangayId);
      }
      if (filters.reason && filters.reason !== 'all') {
        query = query.eq('reason', filters.reason);
      }
      if (filters.dateFrom) query = query.gte('report_date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('report_date', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;

      let results = (data ?? []) as unknown as ReportWithRelations[];

      // Client-side text search across description + submitter name
      if (filters.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (r) =>
            r.description?.toLowerCase().includes(q) ||
            r.submitter?.full_name?.toLowerCase().includes(q) ||
            r.barangay?.name?.toLowerCase().includes(q)
        );
      }

      return results;
    },
    refetchInterval: 30000,
  });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: ['report', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          barangay:barangays(id, name),
          submitter:profiles!reports_submitted_by_fkey(id, full_name, phone)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as ReportWithRelations;
    },
  });
}

export function useUpdateReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      remarks,
    }: {
      id: string;
      status: ReportStatus;
      remarks?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      const patch: Record<string, any> = {
        status,
        remarks: remarks ?? null,
      };

      if (status === 'verified') {
        patch.verified_by = userData.user?.id;
        patch.verified_at = new Date().toISOString();
      }
      if (status === 'resolved') {
        patch.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase.from('reports').update(patch).eq('id', id);
      if (error) throw error;

      // Best-effort audit log
      try {
        await supabase.from('activity_log').insert({
          actor_id: userData.user?.id,
          action: `report.${status}`,
          target_type: 'report',
          target_id: id,
          metadata: { remarks },
        });
      } catch {
        /* non-fatal */
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: ['report', vars.id] });
    },
  });
}