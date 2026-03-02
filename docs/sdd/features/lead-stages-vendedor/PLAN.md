# PLAN — Evolução de estágio do lead pelo vendedor

## Visão técnica

1. **Backend**
   - `api/vendors_command.ts`: parsear `command_text` como "palavra ID" (ex.: "visita ABC123"); mapa de palavras → lead_stage; manter 1/2/3/4 mapeando para in_contact, follow_up, lost, won como fallback.
   - `api/lead_stage.ts`: novo endpoint; usar Supabase Auth (req.headers cookie ou Authorization Bearer) para obter usuário; buscar app_users por email para pegar seller_id e role; se vendedor, filtrar lead por assigned_seller_id = seller_id; se gestor, permitir qualquer lead; validar new_stage na lista permitida; update em leads; insert em lead_events (event_type: stage_change ou vendor_command); retornar { ok, new_stage }. Vercel serverless não tem cookie por padrão — usar header Authorization: Bearer <supabase_session_jwt> ou criar API que recebe session e chama Supabase admin para validar. Alternativa: frontend chama Supabase para update em leads (RLS) + insert em lead_events; assim não precisa de endpoint novo. Verificar RLS em leads: vendedor pode UPDATE apenas onde assigned_seller_id = seu seller_id. Se RLS permitir, fazer update direto do front com supabase.from('leads').update({ lead_stage }).eq('id', id).eq('assigned_seller_id', user.seller_id) e inserir evento; senão criar api/lead_stage com service role e validar seller_id no backend.

2. **RLS Supabase**
   - Leads: política de UPDATE para vendedor apenas em linhas com assigned_seller_id = auth. Como app_users não está ligado ao auth.users por user_id na tabela, o front usa anon key e session; RLS em leads usa auth.uid(). Precisamos que o front envie o JWT do usuário logado. Supabase client já envia o JWT nas requisições ao Supabase. Para UPDATE em `leads`, a política atual é "read" apenas. Então não há UPDATE via RLS para vendedor. Logo: **criar endpoint api/lead_stage** que usa service role, recebe lead_id e new_stage, e identifica o vendedor via token (passado pelo front) ou via header/session. Forma mais simples: front chama `fetch('/api/lead_stage', { method: 'POST', body: JSON.stringify({ lead_id, new_stage }), credentials: 'include' })` e a API Vercel lê o cookie de sessão do Supabase... mas Vercel serverless não lê cookie do mesmo domínio automaticamente em todas as configurações. Alternativa robusta: front envia Authorization: Bearer <access_token> e a API Vercel valida o token com Supabase (getUser), depois consulta app_users pelo email do usuário para obter seller_id e role; então valida se o lead pertence ao vendedor (assigned_seller_id) ou se é gestor; atualiza lead e insere evento.

3. **Frontend**
   - LeadDetail: constante com mapa stage → label PT; lista de estágios “próximos” a partir do atual (ex.: de in_contact pode ir para visit_scheduled, proposal_sent, follow_up, won, lost); botões que chamam API lead_stage e atualizam setLead({ ...lead, lead_stage: new_stage }).
   - LeadsList: mesmo mapa stage → label; no select de filtro e na célula da tabela exibir o rótulo.

4. **Banco**
   - lead_stage já é text; não é obrigatória migration para aceitar visit_scheduled e proposal_sent. Apenas documentar em DATABASE_SCHEMA.

5. **Agente / Docs**
   - INSTRUCOES_AGENTE: substituir "1 ABC123", "2 ABC123" etc. por "ok ID", "visita ID", "ganho ID", "perdido ID", etc.
   - API_CONTRACT: descrever palavras aceitas e endpoint POST /api/lead_stage.

## Ordem de implementação

1. SPEC/PLAN/TASKS (este doc).
2. api/vendors_command.ts — novo parse por palavra.
3. api/lead_stage.ts — criar; auth via Bearer token; validar vendedor/gestor e ownership do lead.
4. Frontend: mapa de estágios para rótulos PT; LeadDetail botões + chamada API; LeadsList rótulos.
5. Docs: API_CONTRACT, DATABASE_SCHEMA, INSTRUCOES_AGENTE.
