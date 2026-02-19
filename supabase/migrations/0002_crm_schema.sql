-- 0002_crm_schema.sql
-- Alinha schema ao DATABASE_SCHEMA.md (aplicável após 0001)

-- sellers: phone_e164 e last_assigned_at
alter table public.sellers add column if not exists updated_at timestamptz default now();
alter table public.sellers add column if not exists last_assigned_at timestamptz null;
alter table public.sellers add column if not exists phone_e164 text unique;
update public.sellers set phone_e164 = phone where phone_e164 is null and phone is not null;
create unique index if not exists sellers_phone_e164_key on public.sellers(phone_e164) where phone_e164 is not null;

-- leads: colunas do DATABASE_SCHEMA + lead_stage (text)
alter table public.leads add column if not exists lead_model_interest text;
alter table public.leads add column if not exists lead_timeframe text;
alter table public.leads add column if not exists lead_payment_method text;
alter table public.leads add column if not exists lead_has_cnpj text;
alter table public.leads add column if not exists lead_best_contact_time text;
alter table public.leads add column if not exists lead_notes text;
alter table public.leads add column if not exists lead_stage text;
alter table public.leads add column if not exists conversation_id text;
alter table public.leads add column if not exists visitor_id text;
alter table public.leads add column if not exists handoff_short_id text;
alter table public.leads add column if not exists assigned_at timestamptz null;
alter table public.leads add column if not exists seller_first_action_at timestamptz null;
alter table public.leads add column if not exists last_contact_at timestamptz null;

update public.leads set lead_stage = case
  when lead_status::text = 'NEW' then 'new'
  when lead_status::text = 'QUALIFYING' then 'new'
  when lead_status::text = 'QUALIFIED' then 'qualified'
  when lead_status::text = 'HANDOFFED' then 'handoff_sent'
  when lead_status::text = 'IN_CONTACT' then 'in_contact'
  when lead_status::text = 'FOLLOW_UP' then 'follow_up'
  when lead_status::text = 'WON' then 'won'
  when lead_status::text = 'LOST' then 'lost'
  else 'new'
end where lead_stage is null;

-- lead_events: actor_type, actor_phone
alter table public.lead_events add column if not exists actor_type text;
alter table public.lead_events add column if not exists actor_phone text;

-- lead_transcripts (opcional MVP)
create table if not exists public.lead_transcripts (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  updated_at timestamptz not null default now(),
  transcript_json jsonb default '{}'::jsonb,
  transcript_text text
);
alter table public.lead_transcripts enable row level security;
create policy "read lead_transcripts (auth)" on public.lead_transcripts for select to authenticated using (true);

-- app_users (admin/gestor)
create table if not exists public.app_users (
  user_id uuid primary key,
  created_at timestamptz not null default now(),
  role text not null check (role in ('admin','manager'))
);
alter table public.app_users enable row level security;
create policy "read app_users (auth)" on public.app_users for select to authenticated using (true);

-- Função round-robin por last_assigned_at (D4)
create or replace function public.assign_seller_round_robin()
returns uuid language plpgsql as $$
declare
  sid uuid;
begin
  select id into sid
  from public.sellers
  where is_active = true
  order by last_assigned_at asc nulls first
  limit 1
  for update;
  if sid is not null then
    update public.sellers set last_assigned_at = now() where id = sid;
  end if;
  return sid;
end;
$$;

-- Trigger updated_at em sellers (se não existir)
create or replace function public.set_sellers_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists trg_sellers_updated_at on public.sellers;
create trigger trg_sellers_updated_at
before update on public.sellers
for each row execute function public.set_sellers_updated_at();
