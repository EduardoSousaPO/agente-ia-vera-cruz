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

Comportamento:
- Se lead não existir, cria automaticamente (upsert).
- Qualifica quando houver dados mínimos (`lead_city`, `lead_model_interest`, `lead_payment_method` com valor não vazio).
- Após qualificar, dispara handoff automático (quando ainda não houver vendedor atribuído), para evitar quebra entre qualificação e repasse.

Resposta:
- `{ lead_id, lead_stage, auto_handoff_triggered, auto_handoff_error, whatsapp_notification_sent }`

## POST /leads_handoff
Body:
- `lead_phone`
- Campos opcionais para criar lead se não existir: `lead_name?`, `lead_city?`, `lead_model_interest?`, `lead_payment_method?`, `lead_email?`, `lead_cpf?`, `lead_birth_date?`, `lead_down_payment?`

Comportamento: Se lead não existir, cria automaticamente (upsert). Envia notificação WhatsApp ao vendedor via Super Agentes Campaigns API.
Comportamento adicional:
- Notificação ao vendedor com retry automático (até 3 tentativas).
- Registra telemetria de envio em `lead_events` (`handoff_notification`), incluindo sucesso/falha, tentativas e erro.

Resposta:
- `{ lead_id, handoff_short_id, assigned_seller_name, assigned_seller_phone, seller_message_text, whatsapp_notification_sent, notification_attempts, notification_status_code, notification_error }`

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
