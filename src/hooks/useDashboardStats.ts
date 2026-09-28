import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Report, ReportReason, ReportStatus } from '@/types/report';

export interface DashboardStats {
  total: number;
  pending: number;
  verified: number;
  resolved: number;
  rejected: number;
  reportsPerBarangay: { name: string; count: number }[];
  reportsPerReason: { reason: ReportReason; label: string; count: number }[];
  trend: { date: string; count: number }[];
  recentReports: Report[];
}

const REASON_LABELS: Record<ReportReason, string> = {
  no_show: 'No Show',
  late_arrival: 'Late Arrival',
  partial_collection: 'Partial Collection',
  other: 'Other',
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch everything we need in one shot
      const { data: reports, error } = await supabase
        .from('reports')
        .select('id, status, reason, report_date, created_at, barangay_id, barangay:barangays(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (reports ?? []) as unknown as (Report & {
        barangay: { name: string } | null;
      })[];

      // Status counts
      const statusCounts: Record<ReportStatus, number> = {
        pending: 0, verified: 0, resolved: 0, rejected: 0,
      };
      rows.forEach((r) => { statusCounts[r.status]++; });

      // Per barangay
      const byBarangay = new Map<string, number>();
      rows.forEach((r) => {
        const name = r.barangay?.name ?? 'Unknown';
        byBarangay.set(name, (byBarangay.get(name) ?? 0) + 1);
      });
      const reportsPerBarangay = Array.from(byBarangay.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Per reason
      const byReason = new Map<ReportReason, number>();
      rows.forEach((r) => {
        byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
      });
      const reportsPerReason = Array.from(byReason.entries())
        .map(([reason, count]) => ({
          reason,
          label: REASON_LABELS[reason],
          count,
        }))
        .sort((a, b) => b.count - a.count);

      // 30-day trend
      const days: string[] = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      const trendMap = new Map<string, number>();
      days.forEach((d) => trendMap.set(d, 0));
      rows.forEach((r) => {
        const day = r.created_at.slice(0, 10);
        if (trendMap.has(day)) {
          trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
        }
      });
      const trend = days.map((date) => ({ date, count: trendMap.get(date) ?? 0 }));

      return {
        total: rows.length,
        pending: statusCounts.pending,
        verified: statusCounts.verified,
        resolved: statusCounts.resolved,
        rejected: statusCounts.rejected,
        reportsPerBarangay,
        reportsPerReason,
        trend,
        recentReports: rows.slice(0, 5),
      };
    },
    refetchInterval: 60_000,
  });
}