# Sprints — Vera Cruz Effa | Do início ao go-live

Documento que detalha **passo a passo** do projeto, dividido em sprints. Use junto com **SDD.md**, **SPEC.md**, **PRD.md** e **DESIGN_SYSTEM.md** (frontend).

---

## Onde você está agora

- [x] Chat 1 (Pesquisa) e Chat 2 (SPEC) concluídos  
- [x] Chat 3 (Implementação) — código DB, API e frontend  
- [x] Refresh visual do frontend (layout e design system Notion + Asana)  
- [x] Migrations aplicadas no Supabase (projeto `nwhzcvdsfcioepxucrfr`)  

### Próximo passo imediato

**Sprint 4 — Deploy e integração:** fazer deploy na Vercel, configurar variáveis de ambiente e conectar o agente no SuperAgentes (HTTP Tool + Evolution QR). Detalhes na seção [Sprint 4](#sprint-4--deploy-e-integração) abaixo.

---

## Visão geral das sprints

| Sprint | Nome                    | Status       | Objetivo principal                          |
|--------|-------------------------|--------------|---------------------------------------------|
| 0      | Preparação e contratos  | **Concluído** | PRD, SDD, contratos (DB/API), ambiente     |
| 1      | Pesquisa + SPEC         | **Concluído** | Chat 1 + Chat 2 (lista fechada de arquivos) |
| 2      | Banco de dados          | **Concluído** | Migrations e aplicação no Supabase          |
| 3      | Implementação (código) | **Concluído** | Chat 3 — API + frontend conforme SPEC       |
| 3.1    | Refresh de design UI    | **Concluído** | Layout e design system do Mini-CRM          |
| 4      | Deploy e integração     | **Pendente**  | Vercel, env, SuperAgentes (HTTP + WhatsApp) |
| 5      | Validação e go-live     | **Pendente**  | Testes, Magic Link, comandos, métricas      |

---

## Sprint 0 — Preparação e contratos

**Status:** Concluído  

**O que já foi feito:**
- [x] PRD em `docs/PRD.md` (escopo MVP, vendedores, integração SuperAgentes, métricas).
- [x] SDD em `docs/SDD.md` e checklist em `docs/SDD_CHECKLIST.md`.
- [x] Contratos: `DATABASE_SCHEMA.md`, `API_CONTRACT.md`, `DECISIONS.md`.
- [x] `.env.example` com Vite, Supabase, CRM_API_KEY, SUPABASE_URL.
- [x] Regras em `.cursor/rules/` (guardrails, rules, skills, commands, vercel, supabase, superagentes, sdd).

**Objetivo:** Ter escopo claro e contratos estáveis antes de qualquer código.

### Passos

1. **Definir escopo (PRD)**  
   - Documento `docs/PRD.md` com: problema, objetivo, escopo MVP, fora de escopo, papéis, vendedores (seed), integração SuperAgentes (canal, knowledge, HTTP Tool), requisitos não-funcionais e métricas.

2. **Definir workflow (SDD)**  
   - `docs/SDD.md`: regra “nada de implementar antes de SPEC”, Etapa 0 (leitura PRD/SPEC/SDD e .cursor), Chat 1 (Pesquisa), Chat 2 (SPEC), Chat 3 (Implementação), validação final.  
   - Opcional: `docs/SDD_CHECKLIST.md` para uso operacional.

3. **Contratos técnicos**  
   - `docs/DATABASE_SCHEMA.md`: tabelas (sellers, leads, lead_events, lead_transcripts, app_users), colunas e função `assign_seller_round_robin()`.  
   - `docs/API_CONTRACT.md`: base URL, header `X-CRM-API-KEY`, endpoints (GET contacts_role, POST leads_upsert, leads_qualify, leads_handoff, vendors_command) e payloads/respostas.  
   - `docs/DECISIONS.md`: rotas `/api/<arquivo>`, segurança, métricas no painel, handoff (round-robin, handoff_short_id 6 chars).

4. **Ambiente e regras Cursor**  
   - `.env.example` com variáveis necessárias (Vite, Supabase, CRM_API_KEY).  
   - `.cursor/rules/` alinhado (guardrails, rules, skills, commands, vercel, supabase, superagentes, sdd).

**Critério de conclusão:** PRD e SDD lidos; contratos revisados; ambiente pronto para Chat 1.

---

## Sprint 1 — Pesquisa + SPEC

**Status:** Concluído  

**O que já foi feito:**
- [x] Chat 1: inventário do repo (docs/, .cursor/, supabase/migrations/, .env.example).
- [x] Chat 1: documentação SuperAgentes consultada; regras `rules.mdc` e `superagentes.mdc` alinhadas ao PRD/API_CONTRACT.
- [x] Chat 2: `docs/SPEC.md` com lista fechada CREATE/MODIFY (api/, migrations, frontend, README).
- [x] Nenhum arquivo de código criado na fase SPEC.

**Objetivo:** Entender o repo e produzir uma SPEC executável (lista fechada de arquivos).

### Passos (Chat 1 — Pesquisa)

1. Inventariar o repositório (pastas, arquivos, padrões).  
2. Identificar dependências, scripts, env, deploy (Vercel), base (Supabase).  
3. Ler documentação externa relevante (SuperAgentes, Supabase, Vercel).  
4. Atualizar **apenas** `docs/PRD.md` se algo alterar escopo ou decisões.  
5. Produzir um resumo curto e uma **lista de arquivos** a criar/alterar para o Chat 2.  
6. Executar **/clear** antes de seguir para o Chat 2.

### Passos (Chat 2 — SPEC)

1. Atualizar `docs/SPEC.md` com **lista fechada** de arquivos (CREATE/MODIFY).  
2. Para cada arquivo: caminho + ação + “o que fazer” (mudanças exatas, sem itens vagos).  
3. Incluir: backend (api/_lib, api/*.ts), DB (migrations), frontend (package.json, vite, src/*), README.  
4. Proibir criação de arquivos fora da lista.  
5. Executar **/clear** antes do Chat 3.

**Critério de conclusão:** SPEC com lista fechada e descrições precisas; nenhum arquivo de código criado ainda.

---

## Sprint 2 — Banco de dados

**Status:** Concluído  

**O que já foi feito:**
- [x] `supabase/migrations/0001_init.sql` no repo (sellers, vehicle_models, leads, lead_events, conversation_messages, seller_round_robin, conversation_exports, RLS, seeds).
- [x] `supabase/migrations/0002_crm_schema.sql` no repo (phone_e164, last_assigned_at, lead_stage e colunas de qualificação, lead_events.actor_type/actor_phone, lead_transcripts, app_users, assign_seller_round_robin()).
- [x] Migrations aplicadas no projeto Supabase **nwhzcvdsfcioepxucrfr** via MCP (`init` e `crm_schema`).
- [x] Schema e seeds consistentes com DATABASE_SCHEMA.md.

**Objetivo:** Schema no Supabase alinhado ao DATABASE_SCHEMA.md.

### Passos

1. **Migrations no repo**  
   - `supabase/migrations/0001_init.sql`: extensão pgcrypto, tabelas (sellers, vehicle_models, leads, lead_events, conversation_messages, seller_round_robin, conversation_exports), RLS, policies, seeds (vendedores e modelos Effa).  
   - `supabase/migrations/0002_crm_schema.sql`: alinhar ao doc (sellers.phone_e164, last_assigned_at; leads.lead_stage e colunas de qualificação; lead_events.actor_type/actor_phone; lead_transcripts; app_users; função assign_seller_round_robin(); trigger em sellers).

2. **Aplicar no projeto Supabase**  
   - Via Supabase MCP (ou CLI): aplicar migrations no projeto desejado (ex.: `nwhzcvdsfcioepxucrfr`).  
   - Conferir com `list_migrations` que `init` e `crm_schema` (ou equivalentes) constam como aplicadas.

3. **Validar**  
   - Conferir tabelas e função no dashboard Supabase (ou via SQL) conforme DATABASE_SCHEMA.md.

**Critério de conclusão:** Migrations aplicadas; schema e seeds consistentes com os contratos.

---

## Sprint 3 — Implementação (código)

**Status:** Concluído  

**O que já foi feito:**
- [x] **Backend:** `api/_lib/auth.ts`, `api/_lib/db.ts`; `api/contacts_role.ts`, `api/leads_upsert.ts`, `api/leads_qualify.ts`, `api/leads_handoff.ts`, `api/vendors_command.ts` (todos conforme API_CONTRACT).
- [x] **Frontend:** `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`; `src/lib/supabase.ts`, `src/main.tsx`, `src/App.tsx`; `src/pages/Login.tsx` (Magic Link), `LeadsList.tsx`, `LeadDetail.tsx`, `Metricas.tsx`.
- [x] **Docs:** `README.md` atualizado (env, npm install/dev, build, deploy Vercel, referência aos docs).
- [x] **Validação:** `npm run build` ok; lint sem erros; apenas arquivos da SPEC criados/alterados.

**Objetivo:** Implementar exatamente o que está na SPEC (Chat 3).

### Passos (ordem sugerida)

1. **Backend (API)**  
   - `api/_lib/auth.ts`: validar header `X-CRM-API-KEY`.  
   - `api/_lib/db.ts`: cliente Supabase (service role).  
   - `api/contacts_role.ts`, `api/leads_upsert.ts`, `api/leads_qualify.ts`, `api/leads_handoff.ts`, `api/vendors_command.ts` conforme API_CONTRACT.md.

2. **Frontend**  
   - `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`.  
   - `src/lib/supabase.ts`, `src/main.tsx`, `src/App.tsx` (rotas e proteção por sessão).  
   - `src/pages/Login.tsx` (Magic Link), `src/pages/LeadsList.tsx`, `src/pages/LeadDetail.tsx`, `src/pages/Metricas.tsx`.

3. **Config e docs**  
   - Atualizar `README.md` (env, npm install, npm run dev, build, deploy Vercel).

4. **Validação**  
   - `npm run build` e lint sem erros; não criar arquivos fora da SPEC.

**Critério de conclusão:** Build e lint ok; apenas arquivos listados na SPEC foram criados/alterados.

---

## Sprint 3.1 — Refresh de design (Mini-CRM)

**Status:** Concluído

**O que já foi feito:**
- [x] Layout base autenticado com sidebar + conteúdo no `src/App.tsx`.
- [x] Design system com tokens e componentes globais em `src/styles.css`.
- [x] Páginas `Login`, `LeadsList`, `LeadDetail` e `Metricas` atualizadas para o novo padrão visual.
- [x] Tipografia do app carregada em `index.html`.
- [x] Responsividade aplicada para desktop e mobile.
- [x] Build validado com sucesso (`npm run build`).

**Objetivo:** elevar a usabilidade e consistência visual mantendo o escopo MVP.

**Critério de conclusão:** todas as páginas do frontend no novo layout, com build ok.

---

## Sprint 4 — Deploy e integração

**Status:** Pendente  

**O que já foi feito:**
- [ ] Nada ainda. Próximo passo do projeto.

**Objetivo:** App no ar na Vercel e agente no SuperAgentes chamando a API e conectado ao WhatsApp.

### Passos

1. **Deploy Vercel**  
   - Conectar o repositório ao Vercel.  
   - Configurar variáveis de ambiente no projeto:  
     - `SUPABASE_URL` (ou mesmo valor do front: URL do projeto Supabase).  
     - `SUPABASE_SERVICE_ROLE_KEY`.  
     - `CRM_API_KEY` (segredo forte; será o valor do header `X-CRM-API-KEY`).  
   - Fazer deploy; confirmar que as rotas `/api/*` respondem (ex.: GET `/api/contacts_role?phone=+5562999999999` com header `X-CRM-API-KEY` retorna JSON).

2. **SuperAgentes — Ferramenta HTTP**  
   - No agente: Configurações → Ferramentas → Ferramenta HTTP.  
   - Base URL: `https://<SEU_APP_VERCEL>/api`.  
   - Header: `X-CRM-API-KEY: <valor de CRM_API_KEY>`.  
   - Configurar chamadas para:  
     - `GET /contacts_role?phone=<E164>`  
     - `POST /leads_upsert`, `POST /leads_qualify`, `POST /leads_handoff`, `POST /vendors_command`  
   - Conteúdo e momento de cada chamada conforme instruções do agente (qualificação, handoff, comando vendedor).

3. **SuperAgentes — Conhecimento**  
   - Criar/associar conhecimento “Vera Cruz — Effa (catálogo + FAQ)” (modelos, ficha técnica, pagamento, endereço, horários).

4. **SuperAgentes — WhatsApp**  
   - Integração → Adicionar Conta → **Evolution QR**.  
   - Gerar QR Code e vincular o número ao agente.

5. **SuperAgentes — Variáveis e estágios (opcional)**  
   - Variáveis para dados do lead (nome, cidade, modelo, prazo, pagamento, etc.) com descrições claras.  
   - Estágios de conversação (qualificação → handoff → pós-handoff) se desejar fluxo mais estruturado.

**Critério de conclusão:** API respondendo na Vercel; agente configurado com HTTP Tool e Evolution QR; conhecimento e variáveis alinhados ao PRD.

---

## Sprint 5 — Validação e go-live

**Status:** Pendente  

**O que já foi feito:**
- [ ] Nada ainda (depende da conclusão da Sprint 4).

**Objetivo:** Validar fluxos de ponta a ponta e liberar uso real.

### Passos

1. **Auth e Mini-CRM**  
   - Configurar Supabase Auth (Magic Link) para o domínio do front (ex.: Vercel).  
   - Testar login por e-mail; acesso a /leads, /leads/:id e /metricas apenas autenticado.

2. **Fluxo lead (WhatsApp)**  
   - Simular conversa: primeiro contato → coleta de dados → salvamento via leads_upsert/leads_qualify.  
   - Verificar no CRM que o lead aparece e que a timeline (lead_events) é preenchida.

3. **Handoff**  
   - Com lead qualificado (modelo, cidade, prazo, pagamento, telefone), disparar handoff.  
   - Conferir: vendedor atribuído (round-robin), handoff_short_id gerado, mensagem para o vendedor com resumo e link WhatsApp.

4. **Comandos do vendedor**  
   - Do número de um vendedor cadastrado, enviar no WhatsApp: `1 <ID>`, `2 <ID>`, `3 <ID>`, `4 <ID>`.  
   - Verificar no CRM que o estágio do lead e, se for o caso, `seller_first_action_at` são atualizados.

5. **Métricas**  
   - Conferir na tela Métricas: tempo até qualificação, tempo até 1º contato, conversão, leads por modelo.

6. **Go-live**  
   - Comunicar vendedores (lista de números, comandos 1/2/3/4 e uso do ID).  
   - Monitorar primeiros leads e ajustar textos/instruções do agente se necessário.

**Critério de conclusão:** Magic Link ok; fluxo lead → qualificação → handoff → comando vendedor funcionando; métricas coerentes; time ciente para uso em produção.

---

## Resumo do fluxo completo (início ao fim)

| # | Etapa | Status |
|---|--------|--------|
| 1 | **Preparação** — PRD, SDD, contratos (DB/API), regras Cursor. | Concluído |
| 2 | **Pesquisa** — Chat 1: inventário, dependências, docs; lista de arquivos para a SPEC. | Concluído |
| 3 | **SPEC** — Chat 2: lista fechada CREATE/MODIFY em SPEC.md. | Concluído |
| 4 | **Banco** — Migrations no repo e aplicação no Supabase. | Concluído |
| 5 | **Código** — Chat 3: API + frontend conforme SPEC; build e lint ok. | Concluído |
| 5.1 | **UI Refresh** — design system e layout Notion + Asana no frontend. | Concluído |
| 6 | **Deploy** — Vercel (env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRM_API_KEY). | Pendente |
| 7 | **SuperAgentes** — HTTP Tool (base URL + X-CRM-API-KEY), conhecimento Effa, Evolution QR. | Pendente |
| 8 | **Validação** — Auth, fluxo lead, handoff, comandos vendedor, métricas. | Pendente |
| 9 | **Go-live** — Liberar para uso real e monitorar. | Pendente |

---

## Referência rápida de documentos

| Documento | Uso |
|-----------|-----|
| `docs/PRD.md` | Escopo, requisitos, integração SuperAgentes. |
| `docs/SDD.md` | Workflow (Chat 1 → 2 → 3); regra “SPEC antes de código”. |
| `docs/SPEC.md` | Lista fechada de arquivos; só implementar o que está listado. |
| `docs/DESIGN_SYSTEM.md` | Tipografia, cores, espaçamento, layout e componentes (referência Asana). |
| `docs/DATABASE_SCHEMA.md` | Tabelas, colunas, função round-robin. |
| `docs/API_CONTRACT.md` | Endpoints e header X-CRM-API-KEY. |
| `docs/SUPERAGENTES_CONFIG.md` | Configuração do agente no Super Agentes (ferramentas HTTP, URL base, headers). |
| `docs/DECISIONS.md` | Decisões técnicas (rotas, segurança, handoff). |
| `docs/SPRINTS.md` | Este arquivo — passos e sprints do início ao go-live. |
