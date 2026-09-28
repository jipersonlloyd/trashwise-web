-- ============================================================
-- TRASHWISE — FULL SCHEMA (corrected)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ENUMS
create type user_role as enum ('user', 'staff', 'admin');
create type report_status as enum ('pending', 'verified', 'rejected', 'resolved');
create type report_reason as enum ('no_show', 'late_arrival', 'partial_collection', 'other');

-- BARANGAYS
create table public.barangays (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  district    text,
  latitude    double precision,
  longitude   double precision,
  created_at  timestamptz not null default now()
);

-- PROFILES
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  phone        text,
  role         user_role not null default 'user',
  barangay_id  uuid references public.barangays(id) on delete set null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index profiles_role_idx     on public.profiles(role);
create index profiles_barangay_idx on public.profiles(barangay_id);

-- TRUCKS
create table public.trucks (
  id           uuid primary key default uuid_generate_v4(),
  plate_no     text not null unique,
  driver_name  text,
  capacity_kg  int,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- SCHEDULES
create table public.schedules (
  id            uuid primary key default uuid_generate_v4(),
  barangay_id   uuid not null references public.barangays(id) on delete cascade,
  truck_id      uuid references public.trucks(id) on delete set null,
  day_of_week   int not null check (day_of_week between 0 and 6),
  time_window   text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index schedules_barangay_idx on public.schedules(barangay_id);

-- REPORTS  (FK rules corrected)
create table public.reports (
  id                uuid primary key default uuid_generate_v4(),
  submitted_by      uuid not null references public.profiles(id) on delete restrict,
  barangay_id       uuid not null references public.barangays(id) on delete restrict,
  report_date       date not null,
  reason            report_reason not null,
  description       text,
  photo_urls        text[] not null default '{}',
  latitude          double precision,
  longitude         double precision,
  location_accuracy double precision,
  status            report_status not null default 'pending',
  verified_by       uuid references public.profiles(id) on delete set null,
  verified_at       timestamptz,
  resolved_at       timestamptz,
  remarks           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index reports_barangay_idx  on public.reports(barangay_id);
create index reports_status_idx    on public.reports(status);
create index reports_submitted_idx on public.reports(submitted_by);
create index reports_date_idx      on public.reports(report_date desc);

-- DEVICE TOKENS
create table public.device_tokens (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token       text not null unique,
  platform    text not null check (platform in ('ios', 'android', 'web')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index device_tokens_user_idx on public.device_tokens(user_id);

-- ACTIVITY LOG
create table public.activity_log (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index activity_log_created_idx on public.activity_log(created_at desc);

-- HELPERS
create or replace function public.my_role()
returns user_role language sql security definer stable set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;

create or replace function public.my_barangay_id()
returns uuid language sql security definer stable set search_path = public
as $$ select barangay_id from public.profiles where id = auth.uid(); $$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public
as $$ select public.my_role() = 'admin'; $$;

create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public
as $$ select public.my_role() = 'staff'; $$;

-- TRIGGERS
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_reports_touch  before update on public.reports
  for each row execute function public.touch_updated_at();
create trigger trg_tokens_touch   before update on public.device_tokens
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role, barangay_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unnamed'),
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'user'),
    nullif(new.raw_user_meta_data->>'barangay_id', '')::uuid
  );
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.barangays     enable row level security;
alter table public.profiles      enable row level security;
alter table public.trucks        enable row level security;
alter table public.schedules     enable row level security;
alter table public.reports       enable row level security;
alter table public.device_tokens enable row level security;
alter table public.activity_log  enable row level security;

-- (policies — copy the same policies you already have)

-- GRANTS (this is what fixed the 403 errors)
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant usage on schema public to anon;
grant select on all tables in schema public to anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- STORAGE
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;