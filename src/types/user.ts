export type UserRole = 'user' | 'staff' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  barangay_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}