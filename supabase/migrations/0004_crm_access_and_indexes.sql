-- 0004_crm_access_and_indexes.sql
-- Endurece acesso por papel (gestor/vendedor) e adiciona índices de consulta do CRM.

create extension if not exists pg_trgm;

-- Leads: gestor/admin/manager veem tudo; vendedor vê somente leads atribuídos a ele.
drop policy if exists "read leads (auth)" on public.leads;
drop policy if exists "read leads by role" on public.leads;
create policy "read leads by role"
on public.leads
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and au.role in ('admin', 'manager', 'gestor')
  )
  or exists (
    select 1
    from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and au.role = 'vendedor'
      and au.seller_id = public.leads.assigned_seller_id
  )
);

-- Lead events: mesma regra de visibilidade, ligada ao lead.
drop policy if exists "read events (auth)" on public.lead_events;
drop policy if exists "read events by role" on public.lead_events;
create policy "read events by role"
on public.lead_events
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and au.role in ('admin', 'manager', 'gestor')
  )
  or exists (
    select 1
    from public.leads l
    join public.app_users au on au.seller_id = l.assigned_seller_id
    where l.id = public.lead_events.lead_id
      and au.is_active = true
      and au.role = 'vendedor'
      and lower(au.email) = lower(coalesce(auth.jwt()->>'email', ''))
  )
);

-- Sellers: gestor/admin/manager veem todos; vendedor vê apenas seu cadastro.
drop policy if exists "read sellers (auth)" on public.sellers;
drop policy if exists "read sellers by role" on public.sellers;
create policy "read sellers by role"
on public.sellers
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and au.role in ('admin', 'manager', 'gestor')
  )
  or exists (
    select 1
    from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and au.role = 'vendedor'
      and au.seller_id = public.sellers.id
  )
);

-- app_users: gestor/admin/manager podem listar todos; vendedor consulta somente o próprio perfil.
drop policy if exists "read app_users (auth)" on public.app_users;
drop policy if exists "read app_users by role" on public.app_users;
create policy "read app_users by role"
on public.app_users
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and au.role in ('admin', 'manager', 'gestor')
  )
  or lower(public.app_users.email) = lower(coalesce(auth.jwt()->>'email', ''))
);

-- Índices para filtros e visões do CRM.
create index if not exists idx_leads_assigned_stage_created_at
  on public.leads (assigned_seller_id, lead_stage, created_at desc);

create index if not exists idx_leads_stage_created_at
  on public.leads (lead_stage, created_at desc);

create index if not exists idx_leads_last_contact_at
  on public.leads (last_contact_at desc);

create index if not exists idx_leads_stalled_handoff
  on public.leads (handoff_at)
  where handoff_at is not null and seller_first_action_at is null;

create index if not exists idx_leads_search_trgm
  on public.leads
  using gin (
    (coalesce(lead_name, '') || ' ' || coalesce(lead_phone, '') || ' ' || coalesce(lead_city, '') || ' ' || coalesce(lead_model_interest, '')) gin_trgm_ops
  );

create index if not exists idx_app_users_lower_email_active
  on public.app_users (lower(email))
  where is_active = true and email is not null;
