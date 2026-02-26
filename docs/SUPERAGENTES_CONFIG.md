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

### 1. Consultar papel do contato

| Campo | Valor |
|-------|--------|
| **Nome** | Consultar papel do contato |
| **Descrição** | Usada para saber se um número de WhatsApp é um lead (cliente) ou um vendedor cadastrado no CRM. Deve ser chamada no início da conversa ou quando for necessário identificar o papel do contato pelo telefone no formato E.164 (ex.: +5562999999999). Retorna role (seller ou lead) e, se for vendedor, dados do vendedor. |
| **URL** | `https://agente-ia-vera-cruz.vercel.app/api/contacts_role` |
| **Método** | GET |
| **Query Params** | `phone` = variável do telefone em E.164 (ex.: `{{phone}}`) |
| **Path Variables** | Nenhum (a API usa query, não path) |
| **Headers** | `X-CRM-API-KEY`: valor configurado (não versionar) |
| **Aprovação necessária** | Não |
| **Enviar valores sem sintaxe de variáveis** | Conforme necessidade da plataforma |

**Importante:** a URL não deve conter `:phone` no path; o parâmetro vai em **Query Params** como `phone`.

---

### 2. (Próximas ferramentas a configurar)

- **Salvar/atualizar lead** — POST `/leads_upsert` (body JSON).
- **Qualificar lead** — POST `/leads_qualify`.
- **Disparar handoff** — POST `/leads_handoff`.
- **Comando vendedor** — POST `/vendors_command` (1/2/3/4 + ID).

Detalhes dos payloads em `API_CONTRACT.md`.

---

## Histórico de ajustes

- **Primeira configuração:** ferramenta "Consultar papel do contato" criada; corrigido uso de **query param** `phone` em vez de path variable, para alinhar ao `API_CONTRACT.md` (GET /contacts_role?phone=).
