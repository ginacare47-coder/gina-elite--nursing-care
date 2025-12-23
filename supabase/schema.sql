-- Run this in Supabase SQL editor.
-- Creates tables for the nurse booking starter.

create extension if not exists "uuid-ossp";

-- Profiles (role-based admin)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

-- Site content editable from admin
create table if not exists public.site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Services
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price_cents integer not null default 0,
  duration_mins integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Weekly availability windows (public can read to build slots)
create table if not exists public.availability (
  id uuid primary key default uuid_generate_v4(),
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sun
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

-- Dates to hide from booking (holiday, fully-booked, etc.)
create table if not exists public.blocked_dates (
  id uuid primary key default uuid_generate_v4(),
  date date not null unique,
  note text,
  created_at timestamptz not null default now()
);

-- Appointments (public can insert, admin can manage)
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid not null references public.services(id) on delete restrict,
  date date not null,
  time time not null,
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Cancelled','Finished')),
  full_name text not null,
  phone text not null,
  email text,
  address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_appt_date_time on public.appointments(date, time);
create index if not exists idx_appt_status on public.appointments(status);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Seed minimal content (safe to re-run)
insert into public.site_content (key, value)
values
  ('hero_title', 'Personal Healthcare at Your Home'),
  ('hero_subtitle', 'Professional, calm, and reliable nurse visits. Book in minutes.'),
  ('cta_label', 'Book Appointment')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Seed services
insert into public.services (name, description, price_cents, duration_mins, is_active)
values
  ('Wellness Visit', 'Vitals check, basic assessment, care guidance.', 8000, 30, true),
  ('Home Health Check', 'Follow-up care, medication support, monitoring.', 12000, 60, true),
  ('Elderly Care', 'Daily living support, safety checks, companionship.', 15000, 90, true)
on conflict do nothing;

-- Seed availability (Mon-Fri 9-5)
insert into public.availability (day_of_week, start_time, end_time)
values
  (1, '09:00', '17:00'),
  (2, '09:00', '17:00'),
  (3, '09:00', '17:00'),
  (4, '09:00', '17:00'),
  (5, '09:00', '17:00')
on conflict do nothing;
