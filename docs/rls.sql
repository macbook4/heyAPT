-- heyAPT Supabase RLS baseline
-- Scope: pois, profiles, audit_logs
-- Admin source of truth: JWT app_metadata.role = 'admin'
--   auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
--
-- Assumptions:
-- 1) Tables exist: public.pois, public.profiles, public.audit_logs
-- 2) public.pois.owner_user_id is uuid (or compatible with auth.uid())
-- 3) Supabase Auth is enabled and JWT claims are available

begin;

-- Enable RLS
alter table if exists public.pois enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.audit_logs enable row level security;

-- Drop existing policies (safe rerun)
drop policy if exists pois_select_public on public.pois;
drop policy if exists pois_insert_owner_only on public.pois;
drop policy if exists pois_update_owner_or_admin on public.pois;
drop policy if exists pois_delete_owner_or_admin on public.pois;

drop policy if exists profiles_select_public_safe on public.profiles;

drop policy if exists audit_logs_select_admin_only on public.audit_logs;
drop policy if exists audit_logs_insert_server_only on public.audit_logs;

-- -----------------------------
-- pois
-- -----------------------------

-- Public read (guest/owner/admin)
create policy pois_select_public
on public.pois
for select
using (true);

-- Insert only for authenticated owner
create policy pois_insert_owner_only
on public.pois
for insert
with check (
  auth.uid() is not null
  and auth.uid() = owner_user_id
);

-- Update allowed for owner or admin
create policy pois_update_owner_or_admin
on public.pois
for update
using (
  auth.uid() = owner_user_id
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  auth.uid() = owner_user_id
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Delete allowed for owner or admin
create policy pois_delete_owner_or_admin
on public.pois
for delete
using (
  auth.uid() = owner_user_id
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- -----------------------------
-- profiles
-- -----------------------------

-- Public profile rows can be read, but API must only expose safe columns.
-- Recommended: expose a view (e.g., public_profiles) with minimal fields.
create policy profiles_select_public_safe
on public.profiles
for select
using (true);

-- -----------------------------
-- audit_logs
-- -----------------------------

-- Read restricted to admin only.
-- Note: service_role typically bypasses RLS in Supabase server context.
create policy audit_logs_select_admin_only
on public.audit_logs
for select
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Direct client insert blocked by default.
-- Server writes should use service_role (bypass RLS) from trusted backend only.
create policy audit_logs_insert_server_only
on public.audit_logs
for insert
with check (false);

commit;

-- ----------------------------------------------------------
-- Validation checklist (manual)
-- ----------------------------------------------------------
-- 1) guest: SELECT public.pois succeeds
-- 2) guest: INSERT/UPDATE/DELETE public.pois fails
-- 3) owner: INSERT with owner_user_id = auth.uid() succeeds
-- 4) owner: UPDATE/DELETE own rows succeeds, others fail
-- 5) admin claim: UPDATE/DELETE any poi succeeds
-- 6) non-admin: SELECT public.audit_logs fails
-- 7) admin/service context: SELECT public.audit_logs succeeds
--
-- Optional helper (run in SQL editor with JWT simulation tooling):
-- - verify auth.uid() and auth.jwt() claims for guest/owner/admin contexts
