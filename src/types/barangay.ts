export interface Barangay {
  id: string;
  name: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Truck {
  id: string;
  plate_no: string;
  driver_name: string | null;
  capacity_kg: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  barangay_id: string;
  truck_id: string | null;
  day_of_week: number; // 0=Sun ... 6=Sat
  time_window: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}