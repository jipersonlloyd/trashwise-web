import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/StatusChip';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { LocationMap } from '@/components/shared/LocationMap';
import { StatusActionDialog } from '@/components/staff/StatusActionDialog';
import { ActivityTimeline } from '@/components/staff/ActivityTimeline';
import { useReport, useUpdateReportStatus } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import type { ReportStatus } from '@/types/report';
import { format } from 'date-fns';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { data: report, isLoading, error } = useReport(id);
  const update = useUpdateReportStatus();

  const [dialogStatus, setDialogStatus] = useState<ReportStatus | null>(null);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading report...</div>;
  }
  if (error || !report) {
    return (
      <div className="space-y-3">
        <p className="text-red-600">
          Failed to load report: {(error as Error)?.message ?? 'Not found'}
        </p>
        <Link to="/staff/queue" className="text-blue-600 hover:underline text-sm">
          ← Back to queue
        </Link>
      </div>
    );
  }

  const canAct = profile?.role === 'admin' || profile?.role === 'staff';
  const isFinal = report.status === 'resolved' || report.status === 'rejected';

  const handleConfirm = async (remarks: string) => {
    if (!dialogStatus) return;
    await update.mutateAsync({
      id: report.id,
      status: dialogStatus,
      remarks,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/staff/queue"
          className="text-sm text-muted-foreground hover:text-slate-900"
        >
          ← Back to queue
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold">Report Detail</h1>
            <p className="text-sm text-muted-foreground">
              {report.barangay?.name} · Submitted by{' '}
              {report.submitter?.full_name ?? 'Unknown'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ReasonChip reason={report.reason} />
            <StatusChip status={report.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: photos + map */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoGallery urls={report.photo_urls ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap
                latitude={report.latitude}
                longitude={report.longitude}
                accuracy={report.location_accuracy}
                label={report.barangay?.name}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline reportId={report.id} />
            </CardContent>
          </Card>
        </div>

        {/* Right: meta + actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Report date" value={format(new Date(report.report_date), 'MMM d, yyyy')} />
              <Row label="Submitted" value={format(new Date(report.created_at), 'MMM d, yyyy h:mm a')} />
              <Row label="Barangay" value={report.barangay?.name ?? '—'} />
              <Row label="Submitter" value={report.submitter?.full_name ?? '—'} />
              {report.submitter?.phone && (
                <Row label="Contact" value={report.submitter.phone} />
              )}
              {report.description && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{report.description}</p>
                </div>
              )}
              {report.remarks && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Staff remarks</p>
                  <p className="text-sm italic">"{report.remarks}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {canAct && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!isFinal && report.status !== 'pending' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDialogStatus('pending')}
                  >
                    Move back to Pending
                  </Button>
                )}
                {report.status === 'pending' && (
                  <>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setDialogStatus('verified')}
                    >
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setDialogStatus('rejected')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {report.status === 'verified' && (
                  <>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setDialogStatus('resolved')}
                    >
                      Mark as Resolved
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setDialogStatus('rejected')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {isFinal && (
                  <p className="text-sm text-muted-foreground italic">
                    This report has been {report.status}. No further action needed.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <StatusActionDialog
        open={!!dialogStatus}
        onOpenChange={(o) => !o && setDialogStatus(null)}
        status={dialogStatus ?? 'verified'}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}