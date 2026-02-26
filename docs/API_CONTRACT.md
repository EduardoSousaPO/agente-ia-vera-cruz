# API_CONTRACT — CRM (para SuperAgentes)

Base URL: `https://agente-ia-vera-cruz.vercel.app/api`
Header obrigatório (todos os endpoints abaixo):
- `X-CRM-API-KEY: veracruz_2026`

## POST /contacts_role
Body (JSON):
- `phone` (E.164, ex.: +5562999999999)

Resposta:
- `{ "role": "seller" | "lead", "seller"?: { id, name, phone } }`

## POST /leads_upsert
Body (JSON):
- `lead_phone` (obrigatório)
- `lead_name?`, `lead_city?`, `lead_model_interest?`, `lead_timeframe?`, `lead_payment_method?`
- `lead_email?`, `lead_cpf?`, `lead_birth_date?`, `lead_down_payment?` (qualificação financeira)
- `lead_has_cnpj?`, `lead_best_contact_time?`, `lead_notes?`
- `conversation_id?`, `visitor_id?`
- `event?` (opcional):
  - `type` (ex.: message_in/message_out)
  - `actor_type` (ai/lead)
  - `text`
  - `raw?`

Resposta:
- `{ lead_id, handoff_short_id, lead_stage }`

## POST /leads_qualify
Body:
- `lead_phone` + campos coletados

Comportamento: Se lead não existir, cria automaticamente (upsert).

Resposta:
- `{ lead_id, lead_stage }`

## POST /leads_handoff
Body:
- `lead_phone`
- Campos opcionais para criar lead se não existir: `lead_name?`, `lead_city?`, `lead_model_interest?`, `lead_payment_method?`, `lead_email?`, `lead_cpf?`, `lead_birth_date?`, `lead_down_payment?`

Comportamento: Se lead não existir, cria automaticamente (upsert). Envia notificação WhatsApp ao vendedor via Super Agentes Campaigns API.

Resposta:
- `{ lead_id, handoff_short_id, assigned_seller_name, assigned_seller_phone, seller_message_text, whatsapp_notification_sent }`

## POST /vendors_command
Body:
- `seller_phone` (E.164)
- `command_text` (ex.: "1 ABC123")

Comandos:
- 1 = Aceitar (in_contact)
- 2 = Agendar visita (follow_up)
- 3 = Venda realizada (won)
- 4 = Não conseguiu contato (lost)

Resposta:
- `{ ok: true, new_stage, lead_id }`
