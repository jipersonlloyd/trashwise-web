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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  useTrucks, useCreateTruck, useUpdateTruck, useDeleteTruck,
} from '@/hooks/useTrucks';
import type { Truck } from '@/types/barangay';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function TrucksPage() {
  const { data: trucks = [], isLoading, error } = useTrucks();
  const create = useCreateTruck();
  const update = useUpdateTruck();
  const remove = useDeleteTruck();

  const [editing, setEditing] = useState<Truck | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Truck | null>(null);

  return (
    <div>
      <PageHeader
        title="Trucks"
        description="Manage the garbage collection fleet"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Truck
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="p-6 text-red-600 text-sm">
              Failed to load: {(error as Error).message}
            </div>
          ) : trucks.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No trucks yet. Click "Add Truck" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate No.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trucks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-medium">{t.plate_no}</TableCell>
                    <TableCell>{t.driver_name ?? '—'}</TableCell>
                    <TableCell>{t.capacity_kg ? `${t.capacity_kg} kg` : '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        t.is_active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDelete(t)}
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

      <TruckDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) { setCreating(false); setEditing(null); }
        }}
        initial={editing}
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
            <AlertDialogTitle>Delete truck {confirmDelete?.plate_no}?</AlertDialogTitle>
            <AlertDialogDescription>
              Schedules referencing this truck will have it unset. This cannot be undone.
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

function TruckDialog({
  open, onOpenChange, initial, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Truck | null;
  onSubmit: (payload: Partial<Truck>) => Promise<void>;
}) {
  const [plate, setPlate] = useState(initial?.plate_no ?? '');
  const [driver, setDriver] = useState(initial?.driver_name ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity_kg?.toString() ?? '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset on open
  if (open && initial && plate === '' && initial.plate_no !== '') {
    setPlate(initial.plate_no);
    setDriver(initial.driver_name ?? '');
    setCapacity(initial.capacity_kg?.toString() ?? '');
    setIsActive(initial.is_active);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!plate.trim()) {
      setFormError('Plate number is required');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        plate_no: plate.trim(),
        driver_name: driver.trim() || null,
        capacity_kg: capacity ? parseInt(capacity) : null,
        is_active: isActive,
      });
      setPlate(''); setDriver(''); setCapacity(''); setIsActive(true);
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
          <DialogTitle>{initial ? 'Edit Truck' : 'Add Truck'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plate">Plate Number *</Label>
            <Input id="plate" value={plate} onChange={(e) => setPlate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="driver">Driver Name</Label>
            <Input id="driver" value={driver} onChange={(e) => setDriver(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (kg)</Label>
            <Input
              id="capacity" type="number"
              value={capacity} onChange={(e) => setCapacity(e.target.value)}
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