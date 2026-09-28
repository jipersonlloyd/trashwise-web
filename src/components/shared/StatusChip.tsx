import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS, type ReportStatus } from '@/types/report';
import { cn } from '@/lib/utils';

const styles: Record<ReportStatus, string> = {
  pending:   'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  verified:  'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  rejected:  'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  resolved:  'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
};

export function StatusChip({ status }: { status: ReportStatus }) {
  return (
    <Badge variant="outline" className={cn('font-medium', styles[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}