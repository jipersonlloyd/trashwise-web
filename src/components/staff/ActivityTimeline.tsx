import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LogRow {
  id: string;
  action: string;
  metadata: { remarks?: string } | null;
  created_at: string;
  actor: { full_name: string } | null;
}

const actionLabels: Record<string, string> = {
  'report.verified': 'Verified',
  'report.rejected': 'Rejected',
  'report.resolved': 'Resolved',
  'report.pending':  'Moved to Pending',
};

export function ActivityTimeline({ reportId }: { reportId: string }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, action, metadata, created_at, actor:profiles(id, full_name)')
        .eq('target_type', 'report')
        .eq('target_id', reportId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LogRow[];
    },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading activity...</div>;
  }
  if (!logs.length) {
    return <div className="text-sm text-muted-foreground italic">No activity yet.</div>;
  }

  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-4">
      {logs.map((log) => (
        <li key={log.id} className="ml-4">
          <span
            className={cn(
              'absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white',
              log.action === 'report.verified' && 'bg-blue-500',
              log.action === 'report.rejected' && 'bg-red-500',
              log.action === 'report.resolved' && 'bg-emerald-500',
              log.action === 'report.pending'  && 'bg-amber-500'
            )}
          />
          <p className="text-sm font-medium">
            {actionLabels[log.action] ?? log.action}
          </p>
          <p className="text-xs text-muted-foreground">
            {log.actor?.full_name ?? 'System'} ·{' '}
            {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
          </p>
          {log.metadata?.remarks && (
            <p className="text-xs mt-1 text-slate-700 italic">
              "{log.metadata.remarks}"
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}