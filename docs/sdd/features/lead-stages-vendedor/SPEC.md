# SPEC — Evolução de estágio do lead pelo vendedor (CRM + WhatsApp)

## Objetivo

- Simplificar os comandos que o vendedor envia no WhatsApp para registrar status no CRM.
- Permitir que o vendedor evolua o lead de estágio pelo portal (CRM), sem depender só do WhatsApp.
- Usar fases compatíveis com o processo de vendas de veículos: claras, sem fricção e fáceis de entender.

## Estágios do lead (funil de vendas)

Valores internos no banco (`lead_stage`) e rótulos em português na UI:

| Valor interno      | Rótulo na UI        | Quem avança |
|--------------------|---------------------|-------------|
| `new`              | Novo                | sistema     |
| `qualified`        | Qualificado         | IA          |
| `handoff_sent`     | Repassado           | sistema     |
| `in_contact`       | Em contato          | vendedor    |
| `visit_scheduled`  | Visita agendada     | vendedor    |
| `proposal_sent`    | Proposta enviada    | vendedor    |
| `follow_up`        | Em negociação       | vendedor    |
| `won`              | Venda fechada       | vendedor    |
| `lost`             | Não fechou          | vendedor    |

Ordem sugerida de evolução (vendedor): Em contato → Visita agendada → Proposta enviada → Em negociação → Venda fechada ou Não fechou.

## Comandos WhatsApp (simplificados)

Formato: **uma palavra + espaço + ID do lead** (ex.: `ok ABC123`). Palavras aceitas (case-insensitive):

| Palavra     | Próximo estágio   |
|-------------|--------------------|
| ok, aceitar | in_contact         |
| visita      | visit_scheduled    |
| proposta    | proposal_sent      |
| negociacao  | follow_up          |
| ganho, venda| won                |
| perdido     | lost               |

Exemplos: `ok ABC123`, `visita ABC123`, `ganho ABC123`, `perdido ABC123`.

## Portal (CRM)

- Na **tela de detalhe do lead** (`/leads/:id`), para vendedor (e gestor): bloco **“Evoluir estágio”** com botões apenas para os estágios que fazem sentido a partir do atual (ex.: se está “Em contato”, mostrar: Visita agendada, Proposta enviada, Em negociação, Venda fechada, Não fechou).
- Lista de leads e filtro de estágio: usar os **rótulos em português** (não o valor interno).
- Ao clicar em um botão de estágio: chamar API que atualiza `lead_stage` e `last_contact_at` (e `seller_first_action_at` se for a primeira ação do vendedor); atualizar a tela sem recarregar.

## API

- **Comando WhatsApp (já existe):** `POST /api/vendors_command` — passar a aceitar o novo formato (palavra + ID). Manter compatibilidade com formato antigo (1|2|3|4 + ID) durante transição, se desejado, ou substituir apenas pelo novo.
- **Portal (novo):** `POST /api/lead_stage` (ou extensão de um endpoint existente) — body: `{ lead_id, new_stage }`; auth: sessão do usuário (vendedor/gestor) via Supabase; validar que o lead pertence ao vendedor (ou usuário é gestor); atualizar `leads.lead_stage`, `last_contact_at`, `seller_first_action_at` quando aplicável; registrar evento em `lead_events`; retornar `{ ok: true, new_stage }`.

## Lista fechada de arquivos (CREATE / MODIFY)

| Arquivo | Ação   | O que fazer |
|---------|--------|--------------|
| `api/vendors_command.ts` | MODIFY | Aceitar comando por palavra (ok, aceitar, visita, proposta, negociacao, ganho, venda, perdido) + ID; mapear para estágios in_contact, visit_scheduled, proposal_sent, follow_up, won, lost. Manter 1/2/3/4 como fallback opcional. |
| `api/lead_stage.ts` | CREATE | POST; auth Supabase (cookie/session); body lead_id, new_stage; validar lead do vendedor ou gestor; atualizar lead + lead_events; retornar { ok, new_stage }. |
| `src/pages/LeadDetail.tsx` | MODIFY | Bloco “Evoluir estágio” com botões (rótulos PT) para estágios permitidos a partir do atual; chamar POST /api/lead_stage; atualizar estado local. |
| `src/pages/LeadsList.tsx` | MODIFY | Filtro e exibição de estágio com rótulos em português (mapa valor → rótulo). |
| `src/lib/leadStages.ts` | CREATE | Mapa estágio → rótulo PT; função getNextStages; STAGE_ORDER para lista/filtro. |
| `docs/API_CONTRACT.md` | MODIFY | Documentar novo formato de comando WhatsApp e endpoint POST /api/lead_stage. |
| `docs/DATABASE_SCHEMA.md` | MODIFY | Incluir estágios visit_scheduled e proposal_sent na lista de lead_stage. |
| `docs/INSTRUCOES_AGENTE.md` | MODIFY | Seção “Se for VENDEDOR” com comandos simplificados (palavra + ID). |
| `docs/sdd/features/lead-stages-vendedor/SPEC.md` | CREATE | Este arquivo. |

## Critérios de aceite

- Vendedor consegue evoluir lead pelo portal clicando em um botão de estágio.
- Vendedor pode registrar status pelo WhatsApp com uma única palavra + ID (ex.: `visita ABC123`).
- Lista e detalhe exibem estágios em português (rótulos).
- Novos estágios visit_scheduled e proposal_sent existem no schema e no fluxo.
