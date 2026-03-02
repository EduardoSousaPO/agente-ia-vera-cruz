# Guia Completo: Configuração Meta Ads + Super Agentes

Este guia resolve o problema de leads vindos de anúncios Click-to-WhatsApp do Meta Ads que não são respondidos pelo agente.

## Problema

Mensagens vindas de Click-to-WhatsApp Ads contêm um campo `referral` no webhook que a Evolution API (usada pelo Super Agentes) pode não processar corretamente. A solução é usar **mensagem pré-preenchida** nos anúncios.

---

## Parte 1: Configuração no Meta Ads Manager

### Passo 1: Acessar o Gerenciador de Anúncios

1. Acesse [business.facebook.com](https://business.facebook.com)
2. Clique em **Gerenciador de Anúncios** (Ads Manager)
3. Selecione a conta de anúncios da Vera Cruz

### Passo 2: Criar/Editar Campanha Click-to-WhatsApp

**Se for criar nova campanha:**

1. Clique em **+ Criar**
2. Escolha o objetivo: **Engajamento** ou **Leads**
3. No nível do conjunto de anúncios, em **Destino da conversão**, selecione **Apps de mensagens**
4. Escolha **WhatsApp**

**Se for editar campanha existente:**

1. Vá em **Campanhas** → selecione sua campanha ativa
2. Clique em **Editar**
3. Navegue até o nível de **Anúncio**

### Passo 3: Configurar a Mensagem Pré-preenchida (CRÍTICO)

No nível do **Anúncio**, procure a seção **Destino** ou **Criar anúncio**:

1. Em **Modelo de mensagem** ou **Iniciar conversa**, procure a opção:
   - **"Mensagem pré-preenchida"** ou
   - **"Mensagem de saudação"** ou
   - **"Criar fluxo"** → **Mensagem inicial**

2. **Desative** qualquer "Fluxo automatizado" do Meta (se houver)

3. Em **Mensagem que o cliente envia**, digite:

```
Oi! Vi o anúncio e quero saber mais sobre os caminhões EFFA.
```

**Variações por campanha (para rastreamento):**

| Campanha | Mensagem Pré-preenchida |
|----------|------------------------|
| Geral | `Oi! Vi o anúncio e quero saber mais sobre os caminhões EFFA.` |
| V21 | `Olá! Tenho interesse no V21 que vi no anúncio.` |
| V21 Baú | `Oi! Quero saber mais sobre o V21 Baú do anúncio.` |
| V25 Furgão | `Olá! Vi o V25 Furgão no anúncio e quero mais informações.` |
| Financiamento | `Oi! Vi o anúncio e quero simular um financiamento.` |

### Passo 4: Verificar Número do WhatsApp

1. Em **Número do WhatsApp**, confirme que está selecionado o **mesmo número** conectado ao Super Agentes via Evolution QR
2. Se não estiver, clique em **Alterar** e selecione o número correto

### Passo 5: Salvar e Publicar

1. Clique em **Publicar** ou **Atualizar**
2. Aguarde a aprovação do anúncio (geralmente minutos a horas)

---

## Parte 2: Verificações no Super Agentes

### Passo 1: Verificar Conexão do WhatsApp

1. No Super Agentes, acesse seu agente **"agente de vendas Vera Cruz"**
2. Vá na aba **Ambientes**
3. Em **WhatsApp**, verifique:
   - Status deve estar **"Conectado"** (verde)
   - Se estiver desconectado, clique para reconectar via QR Code

### Passo 2: Verificar Configurações do WhatsApp

1. Na aba **Ambientes** → **WhatsApp**
2. Clique no ícone de **engrenagem** (configurações) ao lado da conexão
3. Configure assim:

| Configuração | Valor Recomendado |
|--------------|-------------------|
| **Dividir mensagens longas** | ✅ Ativado |
| **Tamanho máximo por mensagem** | `300` |
| **Tempo de espera** | `10` segundos |
| **Intervenção Automática** | ❌ Desativado (por enquanto) |

4. Clique em **Salvar**

### Passo 3: Verificar Ferramentas HTTP

Na aba **Ferramentas**, confirme que estão ativas:

| Ferramenta | Status Necessário |
|------------|-------------------|
| Consultar papel do contato | ✅ Ativo |
| Cadastrar ou atualizar lead | ✅ Ativo |
| Fazer handoff para vendedor | ✅ Ativo |
| Qualificar lead | ✅ Ativo |
| Processar comando do vendedor | ✅ Ativo |

### Passo 4: Verificar Variáveis Internas

1. Clique em **Variáveis Internas** (internal-vars)
2. Certifique-se de que está **ativo** (toggle ligado)
3. Isso permite que o agente acesse `{{user-phone-number}}` automaticamente

### Passo 5: Verificar Instruções do Agente

1. Vá na aba **Instruções**
2. Confirme que o prompt está configurado conforme o arquivo `INSTRUCOES_AGENTE.md`
3. O início da conversa deve usar **"Consultar papel do contato"** automaticamente

---

## Parte 3: Teste da Solução

### Teste 1: Mensagem Normal (controle)

1. Pegue um número que **nunca** conversou com o agente
2. Envie uma mensagem direta pelo WhatsApp: `Oi, quero saber sobre os caminhões`
3. **Esperado:** Agente responde normalmente

### Teste 2: Via Link wa.me

1. Abra no navegador:
   ```
   https://wa.me/5562XXXXXXXXX?text=Oi!%20Quero%20saber%20sobre%20os%20caminh%C3%B5es%20EFFA
   ```
   (substitua `5562XXXXXXXXX` pelo número do WhatsApp do agente)
2. Clique em "Enviar" no WhatsApp
3. **Esperado:** Agente responde normalmente

### Teste 3: Via Anúncio (após configurar)

1. Acesse o anúncio no Facebook/Instagram com outro celular
2. Clique no botão do WhatsApp
3. A mensagem pré-preenchida deve aparecer
4. Clique em **Enviar**
5. **Esperado:** Agente responde normalmente

---

## Parte 4: Monitoramento

### No Super Agentes:

1. Vá em **Conversas** (menu lateral)
2. Monitore se as novas conversas dos anúncios estão aparecendo
3. Verifique se o agente está respondendo

### No Meta Ads:

1. Monitore as métricas:
   - **Cliques no link** = pessoas que clicaram no anúncio
   - **Conversas iniciadas** = pessoas que enviaram a mensagem

Se "Cliques" > "Conversas", significa que algumas pessoas estão clicando mas não enviando a mensagem. Isso é normal (taxa de conversão).

---

## Checklist Final

| Item | Verificado? |
|------|-------------|
| Número do WhatsApp no Meta Ads = número no Super Agentes | ⬜ |
| Mensagem pré-preenchida configurada no anúncio | ⬜ |
| Fluxo automatizado do Meta DESATIVADO | ⬜ |
| Conexão WhatsApp no Super Agentes = Conectado (verde) | ⬜ |
| Tempo de espera = 10 segundos | ⬜ |
| Ferramentas HTTP ativas | ⬜ |
| Variáveis Internas ativas | ⬜ |
| Teste com mensagem normal funcionou | ⬜ |
| Teste via wa.me funcionou | ⬜ |
| Teste via anúncio funcionou | ⬜ |

---

## Troubleshooting

### "Agente não responde mesmo com mensagem pré-preenchida"

1. Verifique se a conexão WhatsApp não caiu (reconecte se necessário)
2. Verifique os logs em **Conversas** no Super Agentes
3. Teste com mensagem normal para isolar o problema

### "Mensagem pré-preenchida não aparece no anúncio"

1. Verifique se salvou as alterações no Meta Ads
2. O anúncio pode estar em revisão - aguarde aprovação
3. Limpe o cache do app WhatsApp e teste novamente

### "Número do anúncio diferente do Super Agentes"

1. No Meta Business Suite, vá em **Configurações** → **WhatsApp**
2. Verifique qual número está conectado
3. Use o mesmo número no Super Agentes

---

## Por Que Isso Funciona?

| Tipo de Entrada | Campo `referral` | Agente Responde? |
|-----------------|------------------|------------------|
| Mensagem normal | ❌ Não tem | ✅ Sim |
| Link wa.me | ❌ Não tem | ✅ Sim |
| Mensagem pré-preenchida (ads) | ❌ Não tem | ✅ Sim |
| CTWA puro (sem pré-preenchida) | ✅ Tem | ❌ Não (problema) |

A mensagem pré-preenchida é enviada pelo usuário como uma **mensagem de texto normal**, sem os metadados de `referral` que a Evolution API pode não processar.

---

## Referências

- [Documentação Super Agentes](https://docs.superagentes.ai)
- [Meta Ads - Click to WhatsApp](https://developers.facebook.com/docs/marketing-api/ad-creative/messaging-ads/click-to-whatsapp/)
- [Evolution API - Webhooks](https://doc.evolution-api.com/v1/en/configuration/webhooks)
