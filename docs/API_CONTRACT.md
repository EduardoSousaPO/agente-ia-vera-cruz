# API_CONTRACT — CRM (para SuperAgentes)

Base URL: `https://<SEU_APP_VERCEL>/api`
Header obrigatório (todos os endpoints abaixo):
- `X-CRM-API-KEY: <SEGREDO>`

## GET /contacts_role?phone=<E164>
Resposta:
- `{ "role": "seller" | "lead", "seller"?: { ... } }`

## POST /leads_upsert
Body (JSON):
- `lead_phone` (obrigatório)
- `lead_name?`, `lead_city?`, `lead_model_interest?`, `lead_timeframe?`, `lead_payment_method?`, `lead_has_cnpj?`, `lead_best_contact_time?`, `lead_notes?`
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

Resposta:
- `{ lead_id, lead_stage }`

## POST /leads_handoff
Body:
- `lead_phone`

Resposta:
- `{ lead_id, handoff_short_id, assigned_seller_name, assigned_seller_phone, seller_message_text }`

## POST /vendors_command
Body:
- `seller_phone` (E.164)
- `command_text` (ex.: "1 ABC123")

Resposta:
- `{ ok: true, new_stage, lead_id }`
