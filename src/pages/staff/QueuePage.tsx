import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/shared/StatusChip';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { useReports } from '@/hooks/useReports';
import { useBarangays } from '@/hooks/useBarangays';
import { useAuth } from '@/hooks/useAuth';
import { STATUS_LABELS, type ReportStatus } from '@/types/report';
import { format } from 'date-fns';

export default function QueuePage() {
    const { profile } = useAuth();
    const [status, setStatus] = useState<ReportStatus | 'all'>('all');
    const [barangayId, setBarangayId] = useState<string | 'all'>(
        profile?.role === 'staff' && profile.barangay_id ? profile.barangay_id : 'all'
    );
    const [reason, setReason] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');

    const { data: barangays = [] } = useBarangays();
    const { data: reports = [], isLoading, error, refetch, isFetching } =
        useReports({ status, barangayId, reason, search, dateFrom });

    const stats = useMemo(() => {
        return {
            total: reports.length,
            pending: reports.filter((r) => r.status === 'pending').length,
            verified: reports.filter((r) => r.status === 'verified').length,
            resolved: reports.filter((r) => r.status === 'resolved').length,
        };
    }, [reports]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Reports Queue</h1>
                    <p className="text-sm text-muted-foreground">
                        {profile?.role === 'staff'
                            ? 'Reports from your barangay'
                            : 'All barangay reports'}
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                    {isFetching ? 'Refreshing...' : 'Refresh'}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total" value={stats.total} />
                <StatCard label="Pending" value={stats.pending} tone="amber" />
                <StatCard label="Verified" value={stats.verified} tone="blue" />
                <StatCard label="Resolved" value={stats.resolved} tone="emerald" />
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                            <label className="text-xs font-medium mb-1 block">Search</label>
                            <Input
                                placeholder="Description, submitter..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Status</label>
                            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Barangay</label>
                            <Select
                                value={barangayId}
                                onValueChange={setBarangayId}
                                disabled={profile?.role === 'staff'}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {profile?.role === 'admin' && (
                                        <SelectItem value="all">All barangays</SelectItem>
                                    )}
                                    {barangays.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Reason</label>
                            <Select value={reason} onValueChange={setReason}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All reasons</SelectItem>
                                    <SelectItem value="no_show">No Show</SelectItem>
                                    <SelectItem value="late_arrival">Late Arrival</SelectItem>
                                    <SelectItem value="partial_collection">Partial Collection</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">From date</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : error ? (
                        <div className="p-6 text-red-600 text-sm">
                            Failed to load reports: {(error as Error).message}
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No reports match your filters.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Barangay</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Submitter</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((r) => (
                                    <TableRow key={r.id} className="hover:bg-slate-50">
                                        <TableCell className="whitespace-nowrap">
                                            {format(new Date(r.report_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>{r.barangay?.name ?? '—'}</TableCell>
                                        <TableCell><ReasonChip reason={r.reason} /></TableCell>
                                        <TableCell>{r.submitter?.full_name ?? '—'}</TableCell>
                                        <TableCell><StatusChip status={r.status} /></TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                to={`/staff/reports/${r.id}`}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                View →
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({
    label,
    value,
    tone = 'slate',
}: {
    label: string;
    value: number;
    tone?: 'slate' | 'amber' | 'blue' | 'emerald';
}) {
    const toneClass = {
        slate: 'text-slate-900',
        amber: 'text-amber-600',
        blue: 'text-blue-600',
        emerald: 'text-emerald-600',
    }[tone];

    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {label}
                </p>
                <p className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
            </CardContent>
        </Card>
    );
}