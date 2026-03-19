-- 0005_fix_rls_auth_email.sql
-- Corrige RLS: usa email de auth.users via auth.uid() em vez de auth.jwt()->>'email'
-- (auth.jwt() pode não ter email em alguns contextos; auth.users é fonte confiável)

create or replace function public.current_user_email()
returns text language sql stable security definer as $$
  select email from auth.users where id = auth.uid();
$$;

-- Leads
drop policy if exists "read leads by role" on public.leads;
create policy "read leads by role"
on public.leads for select to authenticated
using (
  exists (
    select 1 from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(public.current_user_email(), ''))
      and au.role in ('admin', 'manager', 'gestor')
  )
  or exists (
    select 1 from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(public.current_user_email(), ''))
      and au.role = 'vendedor'
      and au.seller_id = public.leads.assigned_seller_id
  )
);

-- Lead events
drop policy if exists "read events by role" on public.lead_events;
create policy "read events by role"
on public.lead_events for select to authenticated
using (
  exists (
    select 1 from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(public.current_user_email(), ''))
      and au.role in ('admin', 'manager', 'gestor')
  )
  or exists (
    select 1 from public.leads l
    join public.app_users au on au.seller_id = l.assigned_seller_id
    where l.id = public.lead_events.lead_id
      and au.is_active = true and au.role = 'vendedor'
      and lower(au.email) = lower(coalesce(public.current_user_email(), ''))
  )
);

-- Sellers
drop policy if exists "read sellers by role" on public.sellers;
create policy "read sellers by role"
on public.sellers for select to authenticated
using (
  exists (
    select 1 from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(public.current_user_email(), ''))
      and au.role in ('admin', 'manager', 'gestor')
  )
  or exists (
    select 1 from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(public.current_user_email(), ''))
      and au.role = 'vendedor'
      and au.seller_id = public.sellers.id
  )
);

-- app_users
drop policy if exists "read app_users by role" on public.app_users;
create policy "read app_users by role"
on public.app_users for select to authenticated
using (
  exists (
    select 1 from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(public.current_user_email(), ''))
      and au.role in ('admin', 'manager', 'gestor')
  )
  or lower(public.app_users.email) = lower(coalesce(public.current_user_email(), ''))
);
