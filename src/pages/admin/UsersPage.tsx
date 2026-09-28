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
  useUsers, useInviteUser, useUpdateUser, useDeleteUser,
  type UserWithBarangay,
} from '@/hooks/useUsers';
import { useBarangays } from '@/hooks/useBarangays';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/user';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';

const ROLE_BADGES: Record<UserRole, string> = {
  user:  'bg-slate-100 text-slate-700 border-slate-200',
  staff: 'bg-blue-100 text-blue-800 border-blue-200',
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
};

const NATIVE_SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function UsersPage() {
  const { profile: currentUser } = useAuth();
  const { data: users = [], isLoading, error } = useUsers();
  const { data: barangays = [] } = useBarangays();
  const invite = useInviteUser();
  const update = useUpdateUser();
  const remove = useDeleteUser();

  const [editing, setEditing] = useState<UserWithBarangay | null>(null);
  const [inviting, setInviting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<UserWithBarangay | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleteError(null);
    try {
      await remove.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('foreign key') || msg.includes('violates')) {
        setDeleteError(
          `Cannot delete "${confirmDelete.full_name}" — they have reports on file. ` +
          `Deactivate them instead to preserve the audit trail.`
        );
      } else {
        setDeleteError(msg || 'Delete failed');
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage staff and admin accounts"
        action={
          <Button onClick={() => setInviting(true)}>
            <Plus className="h-4 w-4 mr-2" /> Invite User
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
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No users yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.full_name}</div>
                      {u.phone && (
                        <div className="text-xs text-muted-foreground">{u.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ROLE_BADGES[u.role]}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.barangay?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        u.is_active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDelete(u)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? "You can't delete yourself" : 'Delete'}
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

      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        barangays={barangays}
        onSubmit={(payload) => invite.mutateAsync(payload)}
      />

      <EditDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        user={editing}
        barangays={barangays}
        isSelf={editing?.id === currentUser?.id}
        onSubmit={async (payload) => {
          if (!editing) return;
          await update.mutateAsync({ id: editing.id, ...payload });
          setEditing(null);
        }}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {confirmDelete?.full_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes their account. If they have filed reports,
              the delete will fail to preserve the audit trail — deactivate them
              instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
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

// ============================================================
// Invite dialog
// ============================================================
function InviteDialog({
  open, onOpenChange, barangays, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  barangays: { id: string; name: string }[];
  onSubmit: (payload: {
    email: string;
    full_name: string;
    role: UserRole;
    barangay_id?: string | null;
  }) => Promise<{ user: { id: string; email: string }; temporary_password: string }>;
}) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [barangayId, setBarangayId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (createdCredentials) return; // already done — waiting for Close
    if (!email.trim()) { setFormError('Email is required'); return; }
    if (!fullName.trim()) { setFormError('Full name is required'); return; }

    setSubmitting(true);
    try {
      const result = await onSubmit({
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        barangay_id: barangayId || null,
      });
      setCreatedCredentials({
        email: email.trim(),
        password: result.temporary_password,
      });
      setEmail('');
      setFullName('');
      setRole('staff');
      setBarangayId('');
    } catch (err: any) {
      setFormError(err.message ?? 'Invite failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedCredentials(null);
    setFormError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email" type="email" placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!createdCredentials}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name" value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={!!createdCredentials}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role *</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={NATIVE_SELECT_CLASS}
              disabled={!!createdCredentials}
            >
              <option value="user">User</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-brgy">Barangay (for staff)</Label>
            <select
              id="invite-brgy"
              value={barangayId}
              onChange={(e) => setBarangayId(e.target.value)}
              className={NATIVE_SELECT_CLASS}
              disabled={!!createdCredentials}
            >
              <option value="">None</option>
              {barangays.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {!createdCredentials && (
            <div className="text-xs text-muted-foreground bg-slate-50 border rounded px-3 py-2">
              The user will be created with a temporary password. Share it with
              them; they should change it after first login.
            </div>
          )}

          {createdCredentials && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 space-y-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-emerald-900">
                <Check className="h-4 w-4" />
                User created successfully
              </div>
              <p className="text-emerald-800 text-xs">
                Share these credentials with the user — they should change the
                password after first login:
              </p>
              <div className="bg-white rounded border border-emerald-200 p-3 font-mono text-xs space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold">{createdCredentials.email}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="font-semibold">{createdCredentials.password}</span>
                </div>
              </div>
              <p className="text-xs text-emerald-700">
                Save these now — the password won't be shown again.
              </p>
            </div>
          )}

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {formError}
            </p>
          )}

          <DialogFooter>
            {createdCredentials ? (
              <Button type="button" onClick={handleClose}>
                Done
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Inviting...' : 'Send Invite'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Edit dialog
// ============================================================
function EditDialog({
  open, onOpenChange, user, barangays, isSelf, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: UserWithBarangay | null;
  barangays: { id: string; name: string }[];
  isSelf: boolean;
  onSubmit: (payload: Partial<{
    full_name: string;
    phone: string | null;
    role: UserRole;
    barangay_id: string | null;
    is_active: boolean;
  }>) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'user');
  const [barangayId, setBarangayId] = useState(user?.barangay_id ?? '');
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState(user?.id);

  // Reset form when the target user changes
  if (user && user.id !== lastUserId) {
    setFullName(user.full_name);
    setPhone(user.phone ?? '');
    setRole(user.role);
    setBarangayId(user.barangay_id ?? '');
    setIsActive(user.is_active);
    setLastUserId(user.id);
    setFormError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role,
        barangay_id: barangayId || null,
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
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="en">Full Name *</Label>
            <Input
              id="en" value={fullName}
              onChange={(e) => setFullName(e.target.value)} required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ph">Phone</Label>
            <Input
              id="ph" value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={isSelf}
              className={NATIVE_SELECT_CLASS}
            >
              <option value="user">User</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">
                You can't change your own role.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-brgy">Barangay</Label>
            <select
              id="edit-brgy"
              value={barangayId}
              onChange={(e) => setBarangayId(e.target.value)}
              disabled={role !== 'staff'}
              className={NATIVE_SELECT_CLASS}
            >
              <option value="">None</option>
              {barangays.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {role !== 'staff' && (
              <p className="text-xs text-muted-foreground">
                Only staff are assigned to barangays.
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSelf}
            />
            Active account
            {isSelf && (
              <span className="text-xs text-muted-foreground ml-2">
                (You can't deactivate yourself)
              </span>
            )}
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}