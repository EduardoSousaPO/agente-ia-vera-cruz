-- 0001_init.sql
-- Vera Cruz | Leads IA + Mini-CRM
-- Data: 2026-02-18

create extension if not exists "pgcrypto";

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_models (
  code text primary key,
  name text not null,
  category text null,
  is_active boolean not null default true
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum (
      'NEW','QUALIFYING','QUALIFIED','HANDOFFED','IN_CONTACT','FOLLOW_UP','WON','LOST'
    );
  end if;
end$$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  lead_phone text not null unique,
  lead_name text null,
  lead_city text null,
  source text not null default 'whatsapp',
  intent text null,
  vehicle_model_code text null references public.vehicle_models(code),
  qualification jsonb not null default '{}'::jsonb,
  external_conversation_id text null,
  assigned_seller_id uuid null references public.sellers(id),
  lead_status public.lead_status not null default 'NEW',
  qualified_at timestamptz null,
  handoff_at timestamptz null,
  first_contact_at timestamptz null,
  won_at timestamptz null,
  lost_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_status on public.leads(lead_status);
create index if not exists idx_leads_seller on public.leads(assigned_seller_id);
create index if not exists idx_leads_model on public.leads(vehicle_model_code);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_events_lead on public.lead_events(lead_id, created_at desc);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'message_from') then
    create type public.message_from as enum ('agent','human');
  end if;
end$$;

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  external_conversation_id text null,
  from_role public.message_from not null,
  text text not null,
  ts timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_lead on public.conversation_messages(lead_id, ts asc);

create table if not exists public.seller_round_robin (
  id int primary key default 1,
  next_index int not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.seller_round_robin (id, next_index)
values (1, 0)
on conflict (id) do nothing;

create table if not exists public.conversation_exports (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  external_conversation_id text not null,
  format text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

alter table public.sellers enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.seller_round_robin enable row level security;
alter table public.conversation_exports enable row level security;

create policy "read sellers (auth)" on public.sellers for select to authenticated using (true);
create policy "read models (auth)" on public.vehicle_models for select to authenticated using (true);
create policy "read leads (auth)" on public.leads for select to authenticated using (true);
create policy "read events (auth)" on public.lead_events for select to authenticated using (true);
create policy "read messages (auth)" on public.conversation_messages for select to authenticated using (true);
create policy "read rr (auth)" on public.seller_round_robin for select to authenticated using (true);
create policy "read exports (auth)" on public.conversation_exports for select to authenticated using (true);

-- Seeds
insert into public.sellers (name, phone, is_active) values ('Luciano', '+5562992060476', true) on conflict (phone) do update set name=excluded.name;
insert into public.sellers (name, phone, is_active) values ('Natan', '+5562982081997', true) on conflict (phone) do update set name=excluded.name;
insert into public.sellers (name, phone, is_active) values ('Raul', '+5562984548826', true) on conflict (phone) do update set name=excluded.name;
insert into public.sellers (name, phone, is_active) values ('Marieli', '+5562992113779', true) on conflict (phone) do update set name=excluded.name;
insert into public.sellers (name, phone, is_active) values ('Leonardo', '+5562982035566', true) on conflict (phone) do update set name=excluded.name;
insert into public.sellers (name, phone, is_active) values ('Paulo Vitor', '+5562983211668', true) on conflict (phone) do update set name=excluded.name;

insert into public.vehicle_models (code, name, category, is_active) values ('EFFA_V21', 'EFFA V21', 'Picape', true) on conflict (code) do update set name=excluded.name, category=excluded.category, is_active=true;
insert into public.vehicle_models (code, name, category, is_active) values ('EFFA_V22', 'EFFA V22', 'Picape', true) on conflict (code) do update set name=excluded.name, category=excluded.category, is_active=true;
insert into public.vehicle_models (code, name, category, is_active) values ('EFFA_V21_BAU', 'EFFA V21 Baú', 'Baú', true) on conflict (code) do update set name=excluded.name, category=excluded.category, is_active=true;
insert into public.vehicle_models (code, name, category, is_active) values ('EFFA_FURGAO_V25', 'EFFA Furgão V25', 'Furgão', true) on conflict (code) do update set name=excluded.name, category=excluded.category, is_active=true;
