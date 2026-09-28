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
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  useBarangays, useCreateBarangay, useUpdateBarangay, useDeleteBarangay,
} from '@/hooks/useBarangays';
import type { Barangay } from '@/types/barangay';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function BarangaysPage() {
  const { data: barangays = [], isLoading, error } = useBarangays();
  const create = useCreateBarangay();
  const update = useUpdateBarangay();
  const remove = useDeleteBarangay();

  const [editing, setEditing] = useState<Barangay | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Barangay | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await remove.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Barangays"
        description="Manage the barangays in your municipality"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Barangay
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
          ) : barangays.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No barangays yet. Click "Add Barangay" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barangays.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.district ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.latitude != null && b.longitude != null
                        ? `${b.latitude.toFixed(4)}, ${b.longitude.toFixed(4)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDelete(b)}
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

      {/* Create / Edit dialog */}
      <BarangayDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        initial={editing}
        onSubmit={async (payload) => {
          if (editing) {
            await update.mutateAsync({ id: editing.id, ...payload });
          } else {
            await create.mutateAsync(payload);
          }
          setCreating(false);
          setEditing(null);
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the barangay. Reports and schedules that reference
              it may be affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BarangayDialog({
  open, onOpenChange, initial, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Barangay | null;
  onSubmit: (payload: Partial<Barangay>) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [district, setDistrict] = useState(initial?.district ?? '');
  const [latitude, setLatitude] = useState(initial?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(initial?.longitude?.toString() ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form when `initial` or open changes
  useState(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDistrict(initial?.district ?? '');
      setLatitude(initial?.latitude?.toString() ?? '');
      setLongitude(initial?.longitude?.toString() ?? '');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        district: district.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
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
          <DialogTitle>{initial ? 'Edit Barangay' : 'Add Barangay'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat" type="number" step="any"
                value={latitude} onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng" type="number" step="any"
                value={longitude} onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>
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