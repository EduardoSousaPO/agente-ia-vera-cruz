# SPEC — Vera Cruz Effa | IA SDR + Mini‑CRM (MVP)

> **Regra:** a implementação só pode tocar arquivos listados aqui.
> Se faltar algo: **pare** e atualize esta SPEC primeiro.

## 1) Estrutura do repo (MVP)

Documentos canônicos em `docs/`:
- `docs/PRD.md`, `docs/SPEC.md`, `docs/SDD.md`, `docs/DECISIONS.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_CONTRACT.md`

Cursor:
- `.cursor/rules/` — guardrails.mdc, rules.mdc, skills.mdc, commands.mdc, subagents.mdc, vercel.mdc, supabase.mdc, superagentes.mdc, sdd.mdc, 01_research–03_implement, 00_bootstrap, 02_spec

Raiz: `.env.example`, `README.md`, `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/`, `api/`, `supabase/migrations/`.

## 2) Contratos

- `docs/DATABASE_SCHEMA.md` — tabelas, colunas, função `assign_seller_round_robin()`.
- `docs/API_CONTRACT.md` — endpoints, payloads, header `X-CRM-API-KEY`.
- `docs/DECISIONS.md` — rotas `/api/<arquivo>`, round‑robin, handoff_short_id 6 chars.

## 3) Lista fechada de arquivos (CREATE / MODIFY)

Nenhum arquivo fora desta lista pode ser criado ou alterado na implementação.

---

### 3.1 Backend (API) — Vercel Functions

| Arquivo | Ação | O que fazer |
|--------|------|-------------|
| `api/_lib/auth.ts` | CREATE | Helper: ler header `X-CRM-API-KEY`, comparar com `process.env.CRM_API_KEY`; se ausente ou diferente, retornar 401 JSON. |
| `api/_lib/db.ts` | CREATE | Cliente Supabase com `createClient(url, service_role_key)`; exportar para uso nas rotas. |
| `api/contacts_role.ts` | CREATE | GET; validar API key (auth); query `phone` (E.164); buscar em `sellers` por `phone_e164`; resposta `{ role: "seller" \| "lead", seller?: { id, name, phone_e164 } }`. |
| `api/leads_upsert.ts` | CREATE | POST; validar API key; body conforme API_CONTRACT (lead_phone obrigatório + campos opcionais + event?); upsert em `leads`; se `event` presente, inserir em `lead_events`; retornar `{ lead_id, handoff_short_id, lead_stage }`. |
| `api/leads_qualify.ts` | CREATE | POST; validar API key; body `lead_phone` + campos; atualizar lead; se critérios MVP preenchidos (modelo, cidade, pagamento, telefone), setar `qualified_at` e `lead_stage = 'qualified'`; após qualificação, disparar handoff automático (idempotente) quando ainda não houver vendedor atribuído; retornar `{ lead_id, lead_stage, auto_handoff_triggered, auto_handoff_error, whatsapp_notification_sent }`. |
| `api/leads_handoff.ts` | CREATE | POST; validar API key; body `lead_phone`; chamar `assign_seller_round_robin()`; gerar `handoff_short_id` (6 chars uppercase do UUID); atualizar lead (assigned_seller_id, handoff_at, lead_stage); registrar evento handoff em lead_events; montar texto para vendedor (resumo + link WhatsApp); enviar notificação ao vendedor com retry; registrar telemetria de envio em `lead_events`; retornar `{ lead_id, handoff_short_id, assigned_seller_name, assigned_seller_phone, seller_message_text, whatsapp_notification_sent, notification_attempts, notification_status_code, notification_error }`. |
| `api/vendors_command.ts` | CREATE | POST; validar API key; body `seller_phone`, `command_text`; validar que phone é vendedor; parsear comando (1/2/3/4 + ID curto); mapear para stage (in_contact, follow_up, lost, won); atualizar lead e `seller_first_action_at` se for primeira ação; retornar `{ ok: true, new_stage, lead_id }`. |

---

### 3.2 Banco de dados

| Arquivo | Ação | O que fazer |
|--------|------|-------------|
| `supabase/migrations/0002_crm_schema.sql` | CREATE | Migration aplicável após 0001: alinhar schema ao DATABASE_SCHEMA.md. Incluir: `sellers` (coluna `phone_e164` se não existir, `last_assigned_at`); `leads` (colunas lead_*, `lead_stage` text, `handoff_short_id`, `conversation_id`, `visitor_id`, `seller_first_action_at`, `last_contact_at`; compatibilizar com 0001 ou migrar enum → text); `lead_events` (`actor_type`, `actor_phone`); tabelas `lead_transcripts`, `app_users`; função `assign_seller_round_robin()`; RLS e policies conforme doc. Seeds de sellers já existem em 0001 (manter E.164). |

---

### 3.3 Frontend (React + Vite + Supabase Auth)

| Arquivo | Ação | O que fazer |
|--------|------|-------------|
| `package.json` | CREATE | Dependências: react, react-dom, vite, @vitejs/plugin-react, @supabase/supabase-js, react-router-dom. Scripts: dev, build, preview. TypeScript. |
| `vite.config.ts` | CREATE | Plugin React; build outDir dist. |
| `tsconfig.json` | CREATE | target ES2020, module ESNext, strict; include src. |
| `index.html` | CREATE | Root com div#root; script type=module src=/src/main.tsx. |
| `src/main.tsx` | CREATE | ReactDOM.createRoot; BrowserRouter; provider de auth (Supabase); App. |
| `src/App.tsx` | CREATE | Rotas: /login, /leads, /leads/:id, /metricas. Proteger /leads e /metricas com checagem de sessão; redirecionar não autenticado para /login. |
| `src/lib/supabase.ts` | CREATE | createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY); export default. |
| `src/pages/Login.tsx` | CREATE | Form Magic Link (email); signInWithOtp; mensagem “Verifique seu e-mail”; redirect para /leads após login. |
| `src/pages/LeadsList.tsx` | CREATE | Lista de leads (tabela/cards); filtro por lead_stage; busca por nome/telefone; link para detalhe. Dados via Supabase client (select em leads). |
| `src/pages/LeadDetail.tsx` | CREATE | Detalhe do lead (campos); timeline (lead_events); exibir handoff_short_id. Rota /leads/:id. |
| `src/pages/Metricas.tsx` | CREATE | Cards: tempo até qualificação, tempo até 1º contato, conversão; tabela “leads por modelo”. Cálculos no client a partir de leads (MVP conforme D3). |

---

### 3.4 Config e docs

| Arquivo | Ação | O que fazer |
|--------|------|-------------|
| `README.md` | MODIFY | Incluir: variáveis de ambiente (.env.example); npm install, npm run dev; deploy Vercel; referência a docs/PRD e docs/SPEC. |
| `docs/SPEC.md` | MODIFY | Este arquivo (lista fechada já está aqui). |

---

### 3.5 Refresh visual (Notion + Asana) — Frontend

| Arquivo | Ação | O que fazer |
|--------|------|-------------|
| `src/styles.css` | CREATE | Definir design tokens (cores, tipografia, spacing), componentes visuais (panel, table, inputs, metric-card), animações leves e responsividade mobile. |
| `src/main.tsx` | MODIFY | Importar CSS global do app (`styles.css`). |
| `src/App.tsx` | MODIFY | Implementar layout compartilhado autenticado (sidebar + content) e manter proteção de rotas. |
| `src/pages/Login.tsx` | MODIFY | Aplicar layout de autenticação no novo design system. |
| `src/pages/LeadsList.tsx` | MODIFY | Atualizar estrutura visual (header, toolbar, tabela) com classes do design system. |
| `src/pages/LeadDetail.tsx` | MODIFY | Atualizar visual de dados e timeline com padrão de painel. |
| `src/pages/Metricas.tsx` | MODIFY | Atualizar visual de cards e tabela com padrão de painel. |
| `index.html` | MODIFY | Carregar fonte utilizada no design system. |

---

## 4) Proibido

- Criar arquivos não listados acima.
- Expandir escopo além do PRD (ex.: /api/metrics para browser, multi-tenant, outros canais).
- Expor `SUPABASE_SERVICE_ROLE_KEY` ou `CRM_API_KEY` no frontend.

## 5) Ordem sugerida na implementação (Chat 3)

1. DB: aplicar/ajustar migration 0002.
2. API: _lib (auth, db) → contacts_role → leads_upsert → leads_qualify → leads_handoff → vendors_command.
3. Frontend: package.json + config → supabase client → Login → App rotas → LeadsList → LeadDetail → Metricas.
4. README e validação (build + lint).
