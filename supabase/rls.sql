-- Enable Row Level Security + policies.

-- Helper: check admin role
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.site_content enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.appointments enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- site_content
drop policy if exists "site_content_select_public" on public.site_content;
create policy "site_content_select_public"
on public.site_content for select
to anon, authenticated
using (true);

drop policy if exists "site_content_admin_write" on public.site_content;
create policy "site_content_admin_write"
on public.site_content for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- services
drop policy if exists "services_select_public" on public.services;
create policy "services_select_public"
on public.services for select
to anon, authenticated
using (true);

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write"
on public.services for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- availability
drop policy if exists "availability_select_public" on public.availability;
create policy "availability_select_public"
on public.availability for select
to anon, authenticated
using (true);

drop policy if exists "availability_admin_write" on public.availability;
create policy "availability_admin_write"
on public.availability for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- blocked_dates
drop policy if exists "blocked_dates_select_public" on public.blocked_dates;
create policy "blocked_dates_select_public"
on public.blocked_dates for select
to anon, authenticated
using (true);

drop policy if exists "blocked_dates_admin_write" on public.blocked_dates;
create policy "blocked_dates_admin_write"
on public.blocked_dates for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- appointments
drop policy if exists "appointments_insert_public_pending_only" on public.appointments;
create policy "appointments_insert_public_pending_only"
on public.appointments for insert
to anon, authenticated
with check (status = 'Pending');

drop policy if exists "appointments_admin_read" on public.appointments;
create policy "appointments_admin_read"
on public.appointments for select
to authenticated
using (public.is_admin());

drop policy if exists "appointments_admin_update" on public.appointments;
create policy "appointments_admin_update"
on public.appointments for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "appointments_admin_delete" on public.appointments;
create policy "appointments_admin_delete"
on public.appointments for delete
to authenticated
using (public.is_admin());
