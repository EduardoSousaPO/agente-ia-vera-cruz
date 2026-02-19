# DECISIONS — Vera Cruz CRM (registro de decisões)

## D1 — Rotas dos endpoints
- Escolha: usar Vercel Functions com nomes simples.
- Padrão: `/api/<arquivo>`.
  Ex.: `api/leads_upsert.ts` → `POST /api/leads_upsert`.

## D2 — Segurança do backend
- Endpoints do CRM exigem header `X-CRM-API-KEY`.
- Supabase service role só no backend.

## D3 — Métricas no painel
- MVP: pode calcular métricas direto via Supabase client no painel.
- Endpoint `/api/metrics` existe para chamadas server‑to‑server (ex.: relatórios), não para browser.

## D4 — Handoff
- Round‑robin via função SQL para evitar concorrência.
- `handoff_short_id`: 6 caracteres (uppercase) derivado do UUID do lead.
