import { useState } from 'react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { useBarangays } from '@/hooks/useBarangays';
import { useTrucks } from '@/hooks/useTrucks';
import {
  useSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule,
  DAY_NAMES, type ScheduleWithRelations,
} from '@/hooks/useSchedules';
import type { Schedule } from '@/types/barangay';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function SchedulesPage() {
  const { data: schedules = [], isLoading, error } = useSchedules();
  const { data: barangays = [] } = useBarangays();
  const { data: trucks = [] } = useTrucks();
  const create = useCreateSchedule();
  const update = useUpdateSchedule();
  const remove = useDeleteSchedule();

  const [editing, setEditing] = useState<ScheduleWithRelations | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ScheduleWithRelations | null>(null);

  return (
    <div>
      <PageHeader
        title="Schedules"
        description="Weekly pickup schedule per barangay"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Schedule
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="p-6 text-red-600 text-sm">
              Failed to load: {(error as Error).message}
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No schedules yet. Click "Add Schedule" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Time Window</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {DAY_NAMES[s.day_of_week]}
                    </TableCell>
                    <TableCell>{s.time_window ?? '—'}</TableCell>
                    <TableCell>{s.barangay?.name ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.truck?.plate_no ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        s.is_active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDelete(s)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ScheduleDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) { setCreating(false); setEditing(null); }
        }}
        initial={editing}
        barangays={barangays}
        trucks={trucks}
        onSubmit={async (payload) => {
          if (editing) await update.mutateAsync({ id: editing.id, ...payload });
          else await create.mutateAsync(payload);
          setCreating(false);
          setEditing(null);
        }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the pickup schedule for{' '}
              {confirmDelete?.barangay?.name} on {confirmDelete && DAY_NAMES[confirmDelete.day_of_week]}.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (confirmDelete) await remove.mutateAsync(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ScheduleDialog({
  open, onOpenChange, initial, barangays, trucks, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ScheduleWithRelations | null;
  barangays: { id: string; name: string }[];
  trucks: { id: string; plate_no: string }[];
  onSubmit: (payload: Partial<Schedule>) => Promise<void>;
}) {
  const [barangayId, setBarangayId] = useState(initial?.barangay_id ?? '');
  const [truckId, setTruckId] = useState(initial?.truck_id ?? '');
  const [day, setDay] = useState(initial?.day_of_week ?? 1);
  const [timeWindow, setTimeWindow] = useState(initial?.time_window ?? '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!barangayId) { setFormError('Barangay is required'); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        barangay_id: barangayId,
        truck_id: truckId || null,
        day_of_week: day,
        time_window: timeWindow.trim() || null,
        is_active: isActive,
      });
    } catch (err: any) {
      setFormError(err.message ?? 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Barangay *</Label>
            <Select value={barangayId} onValueChange={setBarangayId}>
              <SelectTrigger><SelectValue placeholder="Select barangay" /></SelectTrigger>
              <SelectContent>
                {barangays.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Truck (optional)</Label>
            <Select value={truckId} onValueChange={setTruckId}>
              <SelectTrigger><SelectValue placeholder="Assign a truck" /></SelectTrigger>
              <SelectContent>
                {trucks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.plate_no}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Day of Week *</Label>
            <Select value={String(day)} onValueChange={(v) => setDay(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAY_NAMES.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tw">Time Window</Label>
            <Input
              id="tw" placeholder="e.g. 06:00-09:00"
              value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {formError}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : initial ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}