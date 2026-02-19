# Vera Cruz — Leads IA + Mini-CRM

## Stack
- Vite + React + TypeScript
- Supabase (Auth + Postgres)
- Vercel Functions em `/api/*`

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

- **Frontend (Vite):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Backend (Vercel / api):** `SUPABASE_URL` (ou use o mesmo valor de `VITE_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `CRM_API_KEY` (segredo para o header `X-CRM-API-KEY` usado pelo SuperAgentes)
- Opcional: `SUPERAGENTES_WEBHOOK_TOKEN`, `SUPERAGENTES_API_KEY`

## Desenvolvimento

```bash
npm install
npm run dev
```

Abre o app em `http://localhost:5173`. As rotas da API (`/api/*`) rodam no Vercel em produção; em local use `vercel dev` para simular.

## Build

```bash
npm run build
```

## Deploy (Vercel)

- Conecte o repositório ao Vercel.
- Configure as variáveis de ambiente no painel (incluindo `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRM_API_KEY`).
- O deploy usa a pasta `api/` como serverless functions e o build do Vite como front estático.

## Documentação

- `docs/PRD.md` — escopo e requisitos
- `docs/SPEC.md` — lista de arquivos e implementação
- `docs/SDD.md` — workflow Spec-Driven Development (Chat 1 → 2 → 3)
- `docs/SPRINTS.md` — sprints do início ao go-live (passo a passo)
