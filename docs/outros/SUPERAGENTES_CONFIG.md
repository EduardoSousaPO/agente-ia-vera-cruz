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

### 5. Processar comando do vendedor ✅ ATUALIZAR DESCRIÇÃO

| Campo | Valor |
|-------|--------|
| **Nome** | `Processar comando do vendedor` |
| **Descrição** | Usada quando um vendedor envia um comando para atualizar o estágio do lead no CRM. Formato: **uma palavra + espaço + ID do lead** (ex.: "ok ABC123", "visita ABC123"). Repasse a mensagem do vendedor em `command_text` e o telefone dele em `seller_phone`. |
| **URL** | `https://agente-ia-vera-cruz.vercel.app/api/vendors_command` |
| **Método** | **POST** |
| **Body (Chave Valor)** | Todos com "Usuário deve configurar o valor": |
| | `seller_phone` — telefone do vendedor E.164 |
| | `command_text` — comando (ex.: "ok ABC123", "visita ABC123", "ganho ABC123", "perdido ABC123") |
| **Headers** | `X-CRM-API-KEY`: `veracruz_2026`, `Content-Type`: `application/json` |

**Palavras aceitas:** ok, aceitar, visita, proposta, negociacao, ganho, venda, perdido. Ainda aceita o formato antigo: 1, 2, 3, 4 + ID.

**Resposta:** `{ ok: true, new_stage, lead_id }`

---

## Histórico de ajustes

- **2026-02-26:** Ferramentas 1 e 2 configuradas e testadas com sucesso (status 200).
- **2026-02-26:** Alterado método de GET para POST em `contacts_role` porque Super Agentes remove o `+` de query params.
- **2026-02-26:** Corrigido deploy Vercel (Node.js 20.x, imports ESM com `.js`).
- **Primeira configuração:** ferramenta "Consultar papel do contato" criada.
- **2026-03:** Follow-ups configurados (6 no total: 3 no dia 1 + 3 no dia 2) conforme PRD §3.7.

---

---

## Follow-ups (PRD §3.7, DECISIONS D12) ✅ CONFIGURADO

**Formato obrigatório:** 6 follow-ups por conversa — 3 no dia 1 + 3 no dia 2.

### Configuração implementada (2026-03)

| # | Objetivo | Tempo de espera |
|---|----------|-----------------|
| 1 | Reengajar lead que não respondeu em 2–3 horas | 0d 2h 0m 0s |
| 2 | Segunda tentativa de reengajamento no mesmo dia | 0d 6h 0m 0s |
| 3 | Última tentativa de reengajamento no dia da primeira mensagem | 0d 10h 0m 0s |
| 4 | Retomar contato no dia seguinte pela manhã | 1d 0h 0m 0s |
| 5 | Segunda tentativa de reengajamento no dia seguinte | 1d 6h 0m 0s |
| 6 | Última tentativa de reengajamento no dia seguinte | 1d 12h 0m 0s |

### Mensagem padrão (usada nos objetivos)

```
Olá! Vi que você entrou em contato sobre os caminhões EFFA. Ainda posso ajudar com modelos, preços ou financiamento. Responda aqui! 🚗
```

### Restrição de horário

**Horário de envio:** somente entre 07:00 e 21:00. Configurar na plataforma (se disponível na interface de Follow Up ou nas Configurações do WhatsApp > Intervenção automática).

### Onde configurar

1. **Ferramentas** → **Follow Up** → clicar para abrir.
2. Para cada follow-up: preencher **Objetivo** (incluir a mensagem acima) e **Tempo de espera** (dias, horas, minutos, segundos).
3. Clicar **Adicionar** após cada um. Ao final, **Salvar** na tela de Ferramentas.

### Alterações (2026-03)
- Nome da IA: **Dulce** (era Vera).
- Saudação: "seja bem-vindo ao Grupo Vera Cruz".
- V22 Baú (R$ 121.980) adicionado ao catálogo.
- Preço: não informar proativamente.
- Financiamento: até 60x, com ou sem entrada, a partir de R$1, 1ª parcela em 60 dias.
- Qualificação: perguntar CPF ou CNPJ.

---

## Checklist de progresso

- [x] Ferramenta 1: Consultar papel do contato
- [x] Ferramenta 2: Cadastrar ou atualizar lead
- [x] Ferramenta 3: Qualificar lead
- [x] Ferramenta 4: Fazer handoff para vendedor
- [x] Ferramenta 5: Processar comando do vendedor
- [x] Configurar Follow-ups (6 no total)
- [x] Variáveis Internas ativadas
- [x] Instruções atualizadas (Dulce, V22 Baú, CPF/CNPJ, preço passivo, 60x)
- [ ] Atualizar Base de Conhecimento (V22 Baú, financiamento CPF/CNPJ)
- [ ] Testar fluxo completo com WhatsApp
