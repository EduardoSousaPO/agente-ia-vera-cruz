# DATABASE_SCHEMA — Supabase (MVP)

## Tabela: sellers
- id (uuid, PK)
- created_at (timestamptz)
- updated_at (timestamptz)
- name (text)
- phone_e164 (text, unique)
- is_active (bool)
- last_assigned_at (timestamptz, nullable)

## Tabela: leads
- id (uuid, PK)
- created_at, updated_at
- lead_phone (text, unique)
- lead_name (text)
- lead_city (text)
- lead_model_interest (text)
- lead_timeframe (text)
- lead_payment_method (text)
- lead_has_cnpj (text)
- lead_best_contact_time (text)
- lead_notes (text)
- lead_stage (text) — valores esperados: `new`, `qualified`, `handoff_sent`, `in_contact`, `follow_up`, `lost`, `won`
- conversation_id (text)
- visitor_id (text)
- qualified_at (timestamptz)
- assigned_seller_id (uuid, FK sellers)
- assigned_at (timestamptz)
- handoff_at (timestamptz)
- handoff_short_id (text)
- seller_first_action_at (timestamptz)
- last_contact_at (timestamptz)

## Tabela: lead_events (timeline)
- id (uuid, PK)
- created_at
- lead_id (uuid, FK leads)
- event_type (text) — ex.: `message_in`, `message_out`, `qualification_update`, `handoff`, `handoff_notification`, `qualification_handoff_error`, `vendor_command`, `note`
- actor_type (text) — `ai`, `seller`, `system`, `admin`
- actor_phone (text)
- payload (jsonb)

## Tabela: lead_transcripts (opcional no MVP)
- lead_id (uuid, PK/FK leads)
- updated_at
- transcript_json (jsonb)
- transcript_text (text)

## Tabela: app_users (admin/gestor)
- user_id (uuid, PK)
- created_at
- role (text) — `admin` | `manager`

## Função: assign_seller_round_robin()
- retorna seller_id (uuid)
- escolhe vendedor ativo com menor `last_assigned_at` (NULL primeiro)
- atualiza `last_assigned_at = now()`
