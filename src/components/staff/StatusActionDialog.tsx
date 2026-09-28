import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ReportStatus } from '@/types/report';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ReportStatus;
  onConfirm: (remarks: string) => Promise<void>;
}

const titles: Record<ReportStatus, string> = {
  pending:  'Move back to Pending',
  verified: 'Verify Report',
  rejected: 'Reject Report',
  resolved: 'Mark as Resolved',
};

const descriptions: Record<ReportStatus, string> = {
  pending:  'This will return the report to pending status.',
  verified: 'Confirm the report is valid. Add any remarks for the audit trail.',
  rejected: 'Explain why this report is being rejected.',
  resolved: 'Describe what action was taken to resolve this issue.',
};

export function StatusActionDialog({
  open,
  onOpenChange,
  status,
  onConfirm,
}: Props) {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(remarks);
      setRemarks('');
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[status]}</DialogTitle>
          <DialogDescription>{descriptions[status]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="remarks">Remarks (optional)</Label>
          <Textarea
            id="remarks"
            placeholder="e.g. Verified with barangay captain, truck had engine trouble..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}