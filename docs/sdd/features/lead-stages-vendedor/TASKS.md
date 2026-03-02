# TASKS — Evolução de estágio do lead pelo vendedor

1. **api/vendors_command.ts** — Aceitar comando por palavra (ok, aceitar, visita, proposta, negociacao, ganho, venda, perdido) + ID; mapear para in_contact, visit_scheduled, proposal_sent, follow_up, won, lost. Manter 1/2/3/4 como fallback (1=in_contact, 2=follow_up, 3=lost, 4=won).
2. **api/lead_stage.ts** — Criar POST; validar JWT (Bearer) com Supabase Auth; obter app_users por email (seller_id, role); validar lead pertence ao vendedor ou usuário é gestor; validar new_stage na lista permitida; atualizar leads (lead_stage, last_contact_at, seller_first_action_at se aplicável); inserir lead_events (event_type stage_change); retornar { ok: true, new_stage }.
3. **src/pages/LeadDetail.tsx** — Adicionar mapa stage → rótulo PT; bloco “Evoluir estágio” com botões para estágios permitidos a partir do atual; chamar POST /api/lead_stage com Authorization Bearer; atualizar estado do lead após sucesso.
4. **src/pages/LeadsList.tsx** — Usar mapa stage → rótulo PT no select de filtro e na coluna Estágio da tabela.
5. **docs/API_CONTRACT.md** — Documentar comando WhatsApp (palavras) e POST /api/lead_stage (body, auth, resposta).
6. **docs/DATABASE_SCHEMA.md** — Incluir visit_scheduled e proposal_sent na lista de valores de lead_stage.
7. **docs/INSTRUCOES_AGENTE.md** — Atualizar seção do vendedor com comandos simplificados (palavra + ID).
