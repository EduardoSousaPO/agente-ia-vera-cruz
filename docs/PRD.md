# PRD — Vera Cruz Effa | IA SDR (SuperAgentes) + Mini‑CRM (Supabase + Vercel)

## 1) Contexto e problema
A Vera Cruz Effa Motors recebe leads (principalmente via WhatsApp) interessados em veículos novos da **Effa Motors** (ex.: V21, V21 Baú, V22, Furgão). Hoje existem gargalos:

- Falta de um **fluxo controlado** (chegada → qualificação → repasse → acompanhamento → resultado).
- Falta de um **CRM enxuto** para registrar e monitorar.
- Vendedores têm **baixa tolerância à fricção**; não dá para depender de preenchimento manual.

**Princípio do produto:** o sistema deve funcionar quase todo automaticamente; quando exigir ação humana, deve ser **extremamente simples**.

## 2) Objetivo
Entregar uma solução composta por:

1) **Agente de IA no SuperAgentes (WhatsApp)** para:
- responder imediatamente;
- qualificar coletando dados essenciais;
- registrar tudo no Supabase (CRM);
- quando qualificado, fazer **handoff** para um vendedor (round‑robin) e enviar resumo;
- continuar no modo **pós‑handoff** (ajuda e coleta, sem negociar preço final).

2) **Mini‑CRM Web** (React + Vite + Supabase + Vercel) para:
- listar leads e status;
- ver detalhes e timeline;
- acompanhar métricas básicas (SLA e conversão);
- exportar/consultar conversas quando necessário.

## 3) Escopo (MVP)

### 3.1 Atendimento e qualificação (IA)
A IA deve:
- conversar em português simples;
- entender o interesse (modelo e uso);
- coletar **campos mínimos**:
  - nome (se possível)
  - cidade/bairro
  - modelo de interesse (V21 / V21 Baú / V22 / Furgão)
  - prazo de compra (hoje / 7 dias / 30 dias / 90+)
  - forma de pagamento (financiamento / à vista / consórcio)
  - possui CNPJ/MEI? (sim/não)
  - melhor horário para contato
  - observações

A IA deve ir salvando os dados no CRM, via **HTTP Tool**.

**Definição de “qualificado” (MVP):**
- modelo + cidade + prazo + pagamento + telefone (já existe) preenchidos.

### 3.2 Handoff (repasse)
Quando qualificado:
- selecionar vendedor por **round‑robin** entre vendedores ativos;
- registrar atribuição no CRM;
- gerar um **ID curto** do lead (ex.: 6 caracteres) para comandos;
- enviar para o vendedor um resumo pronto + link rápido para WhatsApp do lead.

### 3.3 Pós‑handoff (IA continua ativa)
A IA continua respondendo o lead, mas:
- reforça que “o vendedor X está responsável e vai falar com você”;
- **não** negocia preço final;
- pode tirar dúvidas gerais e coletar mais dados;
- registra tudo no CRM.

### 3.4 Comandos do vendedor (WhatsApp)
O vendedor não precisa abrir CRM.
Ele responde ao WhatsApp do número da IA com comandos:

- `1 <ID>` = Em abordagem
- `2 <ID>` = Retornar depois
- `3 <ID>` = Perdido
- `4 <ID>` = Vendido

A IA valida se o número é de vendedor cadastrado e atualiza o CRM.

### 3.5 Mini‑CRM Web (Admin/Gestor)
- Login via Supabase Auth (Magic Link).
- Tela Leads: lista + filtros simples + busca.
- Detalhe do lead: campos + timeline + notas.
- Tela Métricas: cards simples e tabela “leads por modelo”.

### 3.6 Direção visual do Mini‑CRM (MVP)
- Referência de estilo: mistura de padrões do Notion e do Asana (limpo, editorial, com hierarquia forte).
- Layout base: sidebar fixa + área de conteúdo com cards/painéis.
- Padrão visual: fundo claro com profundidade sutil, bordas suaves, tipografia legível, foco em escaneabilidade.
- Responsividade obrigatória: funcionamento completo em desktop e mobile sem quebra de navegação.
- Consistência: todas as páginas autenticadas devem compartilhar o mesmo sistema de layout/tokens.

## 4) Fora de escopo (agora)
- Integração automática com estoque/ERP.
- Automação avançada de follow‑ups.
- Multi‑empresa / multi‑tenant.
- Funil complexo (tarefas, etapas, etc.).
- Canais além do WhatsApp.

## 5) Papéis
- **Lead:** conversa com IA.
- **Vendedor:** recebe handoff e atualiza status por comando.
- **Gestor/Admin:** monitora painel e ajusta exceções.

## 6) Vendedores (seed inicial)
- Luciano — +55 62 99206‑0476
- Natan — +55 62 98208‑1997
- Raul — +55 62 98454‑8826
- Marieli — +55 62 99211‑3779
- Leonardo — +55 62 98203‑5566
- Paulo Vitor — +55 62 98321‑1668

## 7) Integração SuperAgentes (configuração)
> A configuração do agente (estágios, variáveis, ferramentas) ocorre dentro do SuperAgentes, usando a pesquisa/documentação que você já levantou.

### 7.1 Canal
- WhatsApp via **Evolution QR**.

### 7.2 Knowledge/Datastore
- “Vera Cruz — Effa (catálogo + FAQ)”: modelos, resumo de ficha técnica, pagamento, docs, endereço, horários.

### 7.3 HTTP Tool (CRM)
Base URL: `https://<SEU_APP_VERCEL>/api`
Headers:
- `Content-Type: application/json`
- `X-CRM-API-KEY: <SEGREDO>`

Endpoints:
- `POST /leads_upsert`
- `POST /leads_qualify`
- `POST /leads_handoff`
- `POST /vendors_command`
- `GET  /contacts_role?phone=+5562...`

## 8) Requisitos não‑funcionais
- 100% português.
- Baixa fricção para vendedor.
- Segurança:
  - `SUPABASE_SERVICE_ROLE_KEY` só no backend.
  - endpoints protegidos por `X-CRM-API-KEY`.

## 9) Métricas do MVP
- Tempo até qualificação (`qualified_at - created_at`).
- Tempo até 1º contato vendedor (`seller_first_action_at - handoff_at`).
- Conversão por vendedor (`won / total`).
- Leads sem contato > 24h (handoff e nenhum comando).
- Leads por modelo.
