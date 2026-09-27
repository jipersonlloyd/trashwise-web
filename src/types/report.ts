export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'resolved';
export type ReportReason =
  | 'no_show'
  | 'late_arrival'
  | 'partial_collection'
  | 'other';

export interface Report {
  id: string;
  submitted_by: string;
  barangay_id: string;
  report_date: string; // YYYY-MM-DD
  reason: ReportReason;
  description: string | null;
  photo_urls: string[];
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  status: ReportStatus;
  verified_by: string | null;
  verified_at: string | null;
  resolved_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// Enriched shape for staff/admin views (joined fields)
export interface ReportWithRelations extends Report {
  barangay?: { id: string; name: string } | null;
  submitter?: { id: string; full_name: string; phone: string | null } | null;
}

export const REASON_LABELS: Record<ReportReason, string> = {
  no_show: 'No Show',
  late_arrival: 'Late Arrival',
  partial_collection: 'Partial Collection',
  other: 'Other',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  resolved: 'Resolved',
};