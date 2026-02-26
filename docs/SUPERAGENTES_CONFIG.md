# Configuração do agente no Super Agentes

Registro da configuração do agente **Vera Cruz** na plataforma Super Agentes, para integração com o CRM (API na Vercel).

**Referências:** `API_CONTRACT.md`, `.cursor/rules/superagentes.mdc`, Sprint 4 em `SPRINTS.md`.

---

## Dados gerais

| Item | Valor |
|------|--------|
| **Nome do agente** | agente de vendas Vera Cruz (ou Vera Cruz - Seminovos) |
| **URL do agente** | https://dash.superagentes.ai/@vera_cruz_semi |
| **Base URL da API (Vercel)** | `https://agente-ia-vera-cruz.vercel.app/api` |
| **Header obrigatório** | `X-CRM-API-KEY` (valor em variável de ambiente no Super Agentes / .env do projeto) |

---

## Ferramenta HTTP — regras

- **Base URL:** sempre `https://agente-ia-vera-cruz.vercel.app/api` (ou o domínio correto do deploy Vercel).
- **Header:** em toda chamada, adicionar header `X-CRM-API-KEY` com o valor secreto configurado no projeto.
- **Query vs path:** a API do CRM usa **query string** para parâmetros (ex.: `?phone=+5562...`). Não usar variáveis no path (ex.: `/contacts_role/:phone`) para endpoints que no contrato estão como `?phone=`.

---

## Ferramentas configuradas

### 1. Consultar papel do contato ✅ CONFIGURADO

| Campo | Valor |
|-------|--------|
| **Nome** | `Consultar papel do contato` |
| **Descrição** | Usada para saber se um número de WhatsApp é um lead (cliente) ou um vendedor cadastrado no CRM. Deve ser chamada no início da conversa ou quando for necessário identificar o papel do contato pelo telefone no formato E.164 (ex.: +5562999999999). Retorna role (seller ou lead) e, se for vendedor, dados do vendedor. |
| **URL** | `https://agente-ia-vera-cruz.vercel.app/api/contacts_role` |
| **Método** | **POST** |
| **Body (Chave Valor)** | `phone` — marcar "Usuário deve configurar o valor" |
| **Headers** | `X-CRM-API-KEY`: `veracruz_2026`, `Content-Type`: `application/json` |
| **Aprovação necessária** | Não |

**Nota:** Usamos POST com body em vez de GET com query params porque o Super Agentes tem problemas com o caractere `+` em URLs.

---

### 2. Cadastrar ou atualizar lead ✅ CONFIGURADO

| Campo | Valor |
|-------|--------|
| **Nome** | `Cadastrar ou atualizar lead` |
| **Descrição** | Usada para salvar ou atualizar os dados de um lead no CRM. Deve ser chamada quando o agente coletar informações do cliente como nome, interesse, cidade, etc. Envia os dados para o banco de dados. |
| **URL** | `https://agente-ia-vera-cruz.vercel.app/api/leads_upsert` |
| **Método** | **POST** |
| **Body (Chave Valor)** | Todos com "Usuário deve configurar o valor": |
| | `lead_phone` — telefone E.164 (obrigatório) |
| | `lead_name` — nome do lead |
| | `lead_model_interest` — interesse/modelo de veículo |
| | `lead_city` — cidade/região |
| **Headers** | `X-CRM-API-KEY`: `veracruz_2026`, `Content-Type`: `application/json` |

**Resposta:** `{ lead_id, handoff_short_id, lead_stage }`

---

### 3. Qualificar lead ⏳ A CONFIGURAR

| Campo | Valor |
|-------|--------|
| **Nome** | `Qualificar lead` |
| **Descrição** | Usada quando o agente coletou todas as informações necessárias e quer marcar o lead como qualificado. Atualiza o estágio do lead para "qualified". |
| **URL** | `https://agente-ia-vera-cruz.vercel.app/api/leads_qualify` |
| **Método** | **POST** |
| **Body (Chave Valor)** | `lead_phone` — marcar "Usuário deve configurar o valor" |
| **Headers** | `X-CRM-API-KEY`: `veracruz_2026`, `Content-Type`: `application/json` |

**Resposta:** `{ lead_id, lead_stage }`

---

### 4. Fazer handoff para vendedor ⏳ A CONFIGURAR

| Campo | Valor |
|-------|--------|
| **Nome** | `Fazer handoff para vendedor` |
| **Descrição** | Usada quando o lead está qualificado e deve ser transferido para um vendedor humano. Atribui o lead a um vendedor disponível e retorna os dados para o agente enviar a mensagem de transferência. |
| **URL** | `https://agente-ia-vera-cruz.vercel.app/api/leads_handoff` |
| **Método** | **POST** |
| **Body (Chave Valor)** | `lead_phone` — marcar "Usuário deve configurar o valor" |
| **Headers** | `X-CRM-API-KEY`: `veracruz_2026`, `Content-Type`: `application/json` |

**Resposta:** `{ lead_id, handoff_short_id, assigned_seller_name, assigned_seller_phone, seller_message_text }`

---

### 5. Processar comando do vendedor ⏳ A CONFIGURAR

| Campo | Valor |
|-------|--------|
| **Nome** | `Processar comando do vendedor` |
| **Descrição** | Usada quando um vendedor envia um comando numérico (1, 2, 3 ou 4) seguido do ID do lead. Atualiza o status do atendimento conforme o comando. |
| **URL** | `https://agente-ia-vera-cruz.vercel.app/api/vendors_command` |
| **Método** | **POST** |
| **Body (Chave Valor)** | Todos com "Usuário deve configurar o valor": |
| | `seller_phone` — telefone do vendedor E.164 |
| | `command_text` — comando (ex.: "1 ABC123") |
| **Headers** | `X-CRM-API-KEY`: `veracruz_2026`, `Content-Type`: `application/json` |

**Comandos disponíveis:**
- `1 <ID>` — Aceitar lead
- `2 <ID>` — Agendar visita
- `3 <ID>` — Venda realizada
- `4 <ID>` — Não conseguiu contato

**Resposta:** `{ ok: true, new_stage, lead_id }`

---

## Histórico de ajustes

- **2026-02-26:** Ferramentas 1 e 2 configuradas e testadas com sucesso (status 200).
- **2026-02-26:** Alterado método de GET para POST em `contacts_role` porque Super Agentes remove o `+` de query params.
- **2026-02-26:** Corrigido deploy Vercel (Node.js 20.x, imports ESM com `.js`).
- **Primeira configuração:** ferramenta "Consultar papel do contato" criada.

---

## Checklist de progresso

- [x] Ferramenta 1: Consultar papel do contato
- [x] Ferramenta 2: Cadastrar ou atualizar lead
- [ ] Ferramenta 3: Qualificar lead
- [ ] Ferramenta 4: Fazer handoff para vendedor
- [ ] Ferramenta 5: Processar comando do vendedor
- [ ] Configurar Base de Conhecimento
- [ ] Configurar Variáveis do agente
- [ ] Testar fluxo completo com WhatsApp
