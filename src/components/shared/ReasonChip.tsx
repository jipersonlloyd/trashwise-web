import { Badge } from '@/components/ui/badge';
import { REASON_LABELS, type ReportReason } from '@/types/report';
import { cn } from '@/lib/utils';

const styles: Record<ReportReason, string> = {
  no_show:             'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100',
  late_arrival:        'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
  partial_collection:  'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
  other:               'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100',
};

export function ReasonChip({ reason }: { reason: ReportReason }) {
  return (
    <Badge variant="outline" className={cn('font-medium', styles[reason])}>
      {REASON_LABELS[reason]}
    </Badge>
  );
}