# Configuração das Ferramentas HTTP - Passo a Passo

Guia para configurar as 5 ferramentas HTTP no Super Agentes.

---

## Acesso Inicial

1. Acesse: **https://dash.superagentes.ai**
2. Faça login com sua conta
3. Selecione o agente **"agente de vendas Vera Cruz"**
4. Clique na aba **"Ferramentas"**
5. Clique em **"Conectar API"** (http)

---

## Ferramenta 1: Consultar papel do contato

### Campos principais

```
Nome: Consultar papel do contato
```

```
Descrição: Usada para saber se um número de WhatsApp é um lead (cliente) ou um vendedor cadastrado no CRM. Deve ser chamada no início da conversa ou quando for necessário identificar o papel do contato pelo telefone no formato E.164 (ex.: +5562999999999). Retorna role (seller ou lead) e, se for vendedor, dados do vendedor.
```

```
URL: https://agente-ia-vera-cruz.vercel.app/api/contacts_role
```

```
Método: POST
```

### Body (Chave Valor)

| Chave | Usuário configura? |
|-------|-------------------|
| `phone` | ✅ Sim |

### Headers

| Chave | Valor |
|-------|-------|
| `X-CRM-API-KEY` | `veracruz_2026` |
| `Content-Type` | `application/json` |

### Aprovação necessária: Não

---

## Ferramenta 2: Cadastrar ou atualizar lead

### Campos principais

```
Nome: Cadastrar ou atualizar lead
```

```
Descrição: Usada para salvar ou atualizar os dados de um lead no CRM. Deve ser chamada quando o agente coletar informações do cliente como nome, email, CPF, interesse, forma de pagamento, valor de entrada, cidade, etc. Envia os dados para o banco de dados.
```

```
URL: https://agente-ia-vera-cruz.vercel.app/api/leads_upsert
```

```
Método: POST
```

### Body (Chave Valor)

| Chave | Usuário configura? |
|-------|-------------------|
| `lead_phone` | ✅ Sim |
| `lead_name` | ✅ Sim |
| `lead_email` | ✅ Sim |
| `lead_cpf` | ✅ Sim |
| `lead_birth_date` | ✅ Sim |
| `lead_model_interest` | ✅ Sim |
| `lead_payment_method` | ✅ Sim |
| `lead_down_payment` | ✅ Sim |
| `lead_city` | ✅ Sim |

### Headers

| Chave | Valor |
|-------|-------|
| `X-CRM-API-KEY` | `veracruz_2026` |
| `Content-Type` | `application/json` |

---

## Ferramenta 3: Qualificar lead

### Campos principais

```
Nome: Qualificar lead
```

```
Descrição: Usada quando o agente coletou todas as informações necessárias e quer marcar o lead como qualificado. Atualiza o estágio do lead para "qualified".
```

```
URL: https://agente-ia-vera-cruz.vercel.app/api/leads_qualify
```

```
Método: POST
```

### Body (Chave Valor)

| Chave | Usuário configura? |
|-------|-------------------|
| `lead_phone` | ✅ Sim |

### Headers

| Chave | Valor |
|-------|-------|
| `X-CRM-API-KEY` | `veracruz_2026` |
| `Content-Type` | `application/json` |

---

## Ferramenta 4: Fazer handoff para vendedor

### Campos principais

```
Nome: Fazer handoff para vendedor
```

```
Descrição: Usada quando o lead está qualificado e deve ser transferido para um vendedor humano. Atribui o lead a um vendedor disponível e retorna os dados para o agente enviar a mensagem de transferência.
```

```
URL: https://agente-ia-vera-cruz.vercel.app/api/leads_handoff
```

```
Método: POST
```

### Body (Chave Valor)

| Chave | Usuário configura? |
|-------|-------------------|
| `lead_phone` | ✅ Sim |

### Headers

| Chave | Valor |
|-------|-------|
| `X-CRM-API-KEY` | `veracruz_2026` |
| `Content-Type` | `application/json` |

---

## Ferramenta 5: Processar comando do vendedor

### Campos principais

```
Nome: Processar comando do vendedor
```

```
Descrição: Usada quando um vendedor envia um comando numérico (1, 2, 3 ou 4) seguido do ID do lead. Atualiza o status do atendimento conforme o comando. Comandos: 1=Aceitar, 2=Agendar visita, 3=Venda realizada, 4=Não conseguiu contato.
```

```
URL: https://agente-ia-vera-cruz.vercel.app/api/vendors_command
```

```
Método: POST
```

### Body (Chave Valor)

| Chave | Usuário configura? |
|-------|-------------------|
| `seller_phone` | ✅ Sim |
| `command_text` | ✅ Sim |

### Headers

| Chave | Valor |
|-------|-------|
| `X-CRM-API-KEY` | `veracruz_2026` |
| `Content-Type` | `application/json` |

---

## Checklist Final

Após configurar todas, você deve ter:

- [ ] Consultar papel do contato
- [ ] Cadastrar ou atualizar lead  
- [ ] Qualificar lead
- [ ] Fazer handoff para vendedor
- [ ] Processar comando do vendedor

**⚠️ Não esqueça de clicar no botão "Salvar" laranja no topo da página de Ferramentas!**

---

## Valores para copiar rapidamente

### Headers (iguais para todas)

```
X-CRM-API-KEY
```

```
veracruz_2026
```

```
Content-Type
```

```
application/json
```

### URLs

```
https://agente-ia-vera-cruz.vercel.app/api/contacts_role
```

```
https://agente-ia-vera-cruz.vercel.app/api/leads_upsert
```

```
https://agente-ia-vera-cruz.vercel.app/api/leads_qualify
```

```
https://agente-ia-vera-cruz.vercel.app/api/leads_handoff
```

```
https://agente-ia-vera-cruz.vercel.app/api/vendors_command
```
