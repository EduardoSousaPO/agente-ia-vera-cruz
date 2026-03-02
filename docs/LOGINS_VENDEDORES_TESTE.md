# Logins dos vendedores (visão de teste)

Use estes **e-mails** e **senhas** para acessar o CRM como vendedor e ver apenas os leads atribuídos a cada um.

---

## Como ativar o login com senha

Os usuários estão na tabela `app_users` (migração 0003). Para entrar com **email + senha**, cada e-mail precisa existir no **Supabase Auth** com a senha definida:

1. Acesse **Supabase Dashboard** → **Authentication** → **Users**.
2. Clique em **Add user** → **Create new user**.
3. Preencha **Email** e **Password** com um dos pares da tabela abaixo.
4. Repita para cada vendedor que você quiser testar (ou apenas um, ex.: `vendas@grupoveracruz.com.br`).

Se o e-mail já existir (ex.: já recebeu Magic Link antes), use **Authentication** → **Users** → clique no usuário → não é possível alterar a senha pelo dashboard; nesse caso use “Reset password” ou crie um usuário de teste novo com um e-mail que você controle.

---

## Tabela: e-mail (login) e senha

| # | E-mail (login) | Senha |
|---|----------------|--------|
| 1 | atendimento@grupoveracruz.com.br | `NmWrTCEKdJ` |
| 2 | vendas@grupoveracruz.com.br | `bWugbbCDHp` |
| 3 | vendas1@grupoveracruz.com.br | `s7eB93aAnn` |
| 4 | vendas2@grupoveracruz.com.br | `QHz8ZVcpjt` |
| 5 | vendas3@grupoveracruz.com.br | `U5DJ6HVB3w` |
| 6 | financiamento@grupoveracruz.com.br | `49etXPWB3G` |
| 7 | sofinanciamento@grupoveracruz.com.br | `ykMgCZpB3E` |
| 8 | vendas5@grupoveracruz.com.br | `xQDkSS6PrV` |
| 9 | vendas4@grupoveracruz.com.br | `sqgTWKupcg` |
| 10 | veracruzdiretoria@hotmail.com | `n37ue56s6q` |

---

## Testar a visão do vendedor

1. Abra o CRM: `https://agente-ia-vera-cruz.vercel.app` (ou `http://localhost:5173` em desenvolvimento).
2. Na tela de login, use **um** dos e-mails e a senha correspondente da tabela.
3. Após entrar, você verá **“Meus Leads”** e apenas os leads cujo `assigned_seller_id` seja o vendedor daquele e-mail. Na ficha do lead, use os botões **“Evoluir estágio”** para mudar o status.

**Dica:** para testar rápido, crie no Supabase Auth apenas **um** usuário (ex.: `vendas@grupoveracruz.com.br` / `bWugbbCDHp`) e faça um handoff de lead para o Natan (seller vinculado a esse e-mail) para aparecer um lead na lista do vendedor.

---

**Segurança:** este arquivo contém senhas. Não faça commit em repositório público. Após os testes, altere as senhas no Supabase ou desative os usuários se forem só para demonstração.
