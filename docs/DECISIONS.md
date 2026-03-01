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

## D5 — Design system do frontend
- O Mini-CRM adota direção visual inspirada em Notion + Asana para o MVP.
- Implementação via tokens em CSS global (`src/styles.css`) e layout compartilhado (`sidebar + content`) no `src/App.tsx`.
- Páginas `Login`, `LeadsList`, `LeadDetail` e `Metricas` seguem o mesmo sistema visual e responsivo.

## D6 — Autenticação do CRM
- Login alterado de Magic Link para email/senha (facilitar testes).
- Usuários cadastrados em `auth.users` (Supabase Auth) e `app_users` (perfil/role).
- Roles: `gestor` (vê todos os leads) e `vendedor` (vê só seus leads atribuídos).

## D7 — APIs com upsert automático
- `leads_qualify` e `leads_handoff` criam o lead automaticamente se não existir.
- Evita erro 404 quando agente pula etapa de `leads_upsert`.
- Garante que nenhum lead seja perdido por sequenciamento incorreto de ferramentas.

## D8 — Notificação WhatsApp ao vendedor
- Handoff envia mensagem automática ao vendedor via Super Agentes Campaigns API.
- Mensagem inclui: dados do lead, link WhatsApp, comandos disponíveis (1/2/3/4 + ID).

## D9 — Comportamento do agente (instruções)
- Mensagens curtas: máximo 2 linhas (exceto explicação de veículo).
- Se cliente já sabe o modelo, ir direto para qualificação financeira.
- Sempre enviar link da ficha técnica ao mencionar modelo.
- Salvar dados imediatamente durante a conversa, não apenas no final.
- Não deixar cliente ir embora sem salvar dados coletados.

## D10 — Blindagem qualificação → handoff
- `leads_qualify` passa a disparar handoff automático quando o lead é qualificado e ainda não possui vendedor atribuído.
- Objetivo: eliminar quebra operacional causada por não execução manual da ferramenta de handoff pelo agente.
- O handoff automático usa lógica idempotente para evitar reatribuição quando já existe vendedor no lead.

## D11 — Resiliência de notificação ao vendedor
- `leads_handoff` envia notificação via Super Agentes com retry (até 3 tentativas).
- O resultado do envio é auditado em `lead_events` (`handoff_notification`) com `sent`, `attempts`, `status_code` e `error`.
- Falhas de auto-handoff após qualificação geram evento `qualification_handoff_error` para monitoramento.
