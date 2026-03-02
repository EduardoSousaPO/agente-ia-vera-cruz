
AULA 1 – Configurando seu Agente no WhatsApp (Evolution QR)

- Método: Conexão via QR Code.
- Etapas:
  1. Abrir o painel do Super Agentes.
  2. Escolher o agente desejado.
  3. Acessar aba "Ambientes" > "Conectar ao WhatsApp" > "Adicionar conta".
  4. Selecionar o tipo de serviço "QR".
  5. Gerar QR Code e escanear com o app do WhatsApp.
  6. Nomear o dispositivo e salvar.
- Resultado: Integração concluída em menos de 1 minuto, com teste de envio de mensagem bem-sucedido.

---

AULA 2 – Interface de Conversas

- Localização: Menu lateral esquerdo > Conversas.
- Estrutura:
  - Filtros: por agente, canal, prioridade, status, responsável.
  - Detecção do tipo de interação: Agente (IA) ou Humano.
  - Exportação: possível para análise posterior ou CRM.
  - Variáveis coletadas automaticamente (ex: telefone via WhatsApp).
  - Atualização de status: Resolvido / Não Resolvido / Solicitação Humana.
- Importante:
  - A IA utiliza contexto anterior da conversa.
  - Conversas podem ser deletadas, transferidas, ou marcadas como lidas.

---

AULA 3 – Como Funcionam os Estágios?

- Diferença entre Instruções (Prompt do Sistema) e Estágios:
  - Instruções: Informação permanente (identidade, tom, regras).
  - Estágios: Cenários específicos, com instruções ativadas conforme contexto.
- Vantagens:
  - Reduz custo de token.
  - Evita carregamento desnecessário de informações.
  - Possibilita respostas mais assertivas.
- Exemplos:
  - SDR com Spin Selling: cada etapa (Situação, Problema, Implicação, Necessidade) vira um estágio com base de conhecimento específica.
  - Marketing: Estágio ativado apenas ao mencionar um podcast/evento.
  - Suporte: Estágio de atualização de base ativado quando IA não consegue responder ou está insatisfeita com sua própria resposta.

---

AULA 4 – Estágios na Prática (Criando Estágios)

- Elementos de um Estágio:
  1. Nome – Identificação.
  2. Objetivo – Intenção do estágio.
  3. Instruções – Prompt específico para esse momento.
  4. Regras de Inferência – Condições para ativar, reiniciar, pular.
- Comportamentos:
  - Estágios podem ser reordenados.
  - Podem acionar ferramentas e bases específicas.
  - Permitem validação de critérios (ex: número de clientes, disponibilidade).
- Exemplos:
  - SDR com regras condicionais para pular etapas.
  - Agente CS (Sofia) com onboarding, uso de recursos, follow-up e avaliação final.
- Recomendações:
  - Comece simples, depois segmente conforme os pontos críticos da conversa.
  - Domínio de prompts é essencial.
  - Construa lógica condicional clara nas regras.


# Aula: Como configurar variáveis no meu Agente?

## Duração: ~5min

### Resumo:
Esta aula demonstra como utilizar variáveis na plataforma SuperAgentes para armazenar, manipular e reaproveitar informações ao longo da conversa com usuários.

### Pontos principais:
- Variáveis são acessadas pela aba **Ferramentas**;
- Funcionam como **caixas de informação**: coletam dados da conversa ou de fontes externas (CRM, banco de dados etc.);
- Podem ser preenchidas automaticamente pelo agente, pelo usuário ou buscadas de forma ativa;
- Usos comuns:
  - Captura de leads: nome, e-mail, telefone;
  - Registro de interações do usuário;
  - Geração de relatórios (com variáveis compostas);
  - Intercâmbio de dados entre agentes (ex: via subagentes);
- As variáveis possuem:
  - Nome: como serão referenciadas nos prompts;
  - Descrição: explica o objetivo da variável (também serve como instrução contextual);
- São utilizadas no **prompt** do agente e podem ser mencionadas diretamente na formatação;
- Exemplo prático:
  - A agente “Sofia” coleta insights de subagentes e armazena na variável `InsightSofia`;
  - Esta variável alimenta uma planilha com relatório para CS;
  - É possível criar variáveis compostas com múltiplos dados estruturados;
- Variáveis são persistentes ao longo dos **estágios**: podem ser capturadas em um estágio e utilizadas em outros posteriores.

**Conclusão:** variáveis são fundamentais para automação, personalização e persistência de dados dentro da lógica de conversação.

---

# Guia: Configurar o agente Vera Cruz no Super Agentes

Referência: [docs.superagentes.ai](https://docs.superagentes.ai/introduction), [Ferramenta HTTP](https://docs.superagentes.ai/agent/tool/http). Resumo alinhado ao CRM (API na Vercel).

## 1. Variáveis de ambiente (.env) — o que preencher

| Variável | Obrigatório? | Onde usar | Onde obter |
|----------|--------------|-----------|------------|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Sim (frontend) | App React (login, leads) | Supabase → Settings → API |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Sim (backend) | API Vercel (leads, sellers) | Supabase → Settings → API (URL + chave **service_role**) |
| `CRM_API_KEY` | Sim (backend) | Header `X-CRM-API-KEY` nas chamadas do Super Agentes à nossa API | Você define (ex.: `veracruz_2026`); use o mesmo valor na ferramenta HTTP do Super Agentes |
| **`SUPERAGENTES_WEBHOOK_TOKEN`**, **`SUPERAGENTES_API_KEY`** | **Não** | **Nenhum** — o código do projeto **não usa** essas variáveis | Pode deixar em branco. Serviriam apenas se no futuro nosso backend chamar a API do Super Agentes ou receber webhooks. |

**Conclusão:** deixar `SUPERAGENTES_WEBHOOK_TOKEN` e `SUPERAGENTES_API_KEY` vazios **não causa erro** neste projeto. O fluxo é: Super Agentes chama a nossa API (Vercel) com o header `X-CRM-API-KEY`; nós não chamamos o Super Agentes a partir do backend.

## 2. Checklist de configuração no Super Agentes

1. **Tecnologia** — Modelo de IA (ex.: Super Agentes gratuito ou chave própria); temperatura; fuso.
2. **Ferramentas** — **Conectar API (HTTP):** Base URL `https://agente-ia-vera-cruz.vercel.app/api`; header `X-CRM-API-KEY`; endpoints conforme `docs/API_CONTRACT.md` e `docs/SUPERAGENTES_CONFIG.md`. **Variáveis:** ativar e criar variáveis para lead (nome, cidade, modelo, prazo, pagamento, telefone).
3. **Instruções** — Prompt do agente (identidade Vera Cruz/Effa, quando chamar a API de papel do contato, qualificação, handoff).
4. **Base de Conhecimento** — Conectar conhecimento Effa (catálogo, FAQ, endereço, horários).
5. **Ambientes** — WhatsApp: **Adicionar conta** → **Evolution QR** → Gerar QR e escanear.
6. **Estágios** (opcional) — Estágios de conversa (qualificação → handoff → pós-handoff).

## 3. Erro "Testar API" 500 ou ERR_CONNECTION_TIMED_OUT

- **500:** Conferir na Vercel (Settings → Environment Variables) se `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `CRM_API_KEY` estão definidos. Depois fazer **Redeploy**.
- **Timeout no navegador:** Usar a URL exata do deploy (ex.: `agente-ia-vera-cruz.vercel.app`). Não colar aspas no número; o correto é `?phone=+5562999999999`. Se aparecer `%22` na URL, há aspas a mais. Preferir testar pelo **Testar API** do Super Agentes (preenchendo o Valor de `phone` com número em E.164).