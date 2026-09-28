import { Link } from 'react-router-dom';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/shared/StatusChip';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { ClipboardList, Clock, CheckCircle2 } from 'lucide-react';

const REASON_COLORS: Record<string, string> = {
  'No Show': '#64748b',
  'Late Arrival': '#f97316',
  'Partial Collection': '#a855f7',
  'Other': '#9ca3af',
};

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Failed to load dashboard: {(error as Error).message}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of waste collection reports across all barangays
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Reports" value={data.total}    icon={ClipboardList} tone="slate" />
        <KpiCard label="Pending"       value={data.pending}  icon={Clock}         tone="amber" />
        <KpiCard label="Verified"      value={data.verified} icon={CheckCircle2}  tone="blue" />
        <KpiCard label="Resolved"      value={data.resolved} icon={CheckCircle2}  tone="emerald" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reports per Barangay</CardTitle>
          </CardHeader>
          <CardContent>
            {data.reportsPerBarangay.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.reportsPerBarangay}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f172a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reports by Reason</CardTitle>
          </CardHeader>
          <CardContent>
            {data.reportsPerReason.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.reportsPerReason}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(props: any) =>
                      `${props.label ?? ''}: ${props.count ?? ''}`
                    }
                  >
                    {data.reportsPerReason.map((r) => (
                      <Cell
                        key={r.reason}
                        fill={REASON_COLORS[r.label] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reports — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => format(new Date(d), 'MMM d')}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(d: any) =>
                  d ? format(new Date(String(d)), 'MMM d, yyyy') : ''
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0f172a"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Reports</CardTitle>
          <Link to="/staff/queue" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentReports.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No reports yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentReports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(r.report_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{(r as any).barangay?.name ?? '—'}</TableCell>
                    <TableCell><ReasonChip reason={r.reason} /></TableCell>
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

function KpiCard({
  label, value, icon: Icon, tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: 'slate' | 'amber' | 'blue' | 'emerald';
}) {
  const toneClass = {
    slate:   'text-slate-900 bg-slate-100',
    amber:   'text-amber-600 bg-amber-50',
    blue:    'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
  }[tone];

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
      No data to display yet.
    </div>
  );
}