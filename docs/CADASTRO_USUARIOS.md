# Cadastro de Usuários do CRM

Para acessar o frontend do CRM, os usuários precisam estar cadastrados na tabela `app_users`.

---

## Tipos de Perfil

| Perfil | Permissões |
|--------|------------|
| **gestor** | Vê todos os leads, acessa métricas, gerencia sistema |
| **vendedor** | Vê apenas leads atribuídos a ele |

---

## Como Cadastrar Usuários

### Via SQL no Supabase

Acesse o Supabase Dashboard → SQL Editor e execute:

### Cadastrar Gestor

```sql
INSERT INTO app_users (email, name, role, is_active)
VALUES ('email.do.gestor@empresa.com', 'Nome do Gestor', 'gestor', true);
```

### Cadastrar Vendedor

Para vendedor, você precisa vincular ao `seller_id` correspondente:

```sql
-- Primeiro, encontre o seller_id do vendedor
SELECT id, name FROM sellers WHERE is_active = true;

-- Depois cadastre o usuário
INSERT INTO app_users (email, name, role, seller_id, is_active)
VALUES (
  'email.do.vendedor@empresa.com',
  'Nome do Vendedor',
  'vendedor',
  'COLE_O_SELLER_ID_AQUI',
  true
);
```

---

## Vendedores Cadastrados (sellers)

| Nome | seller_id | Telefone |
|------|-----------|----------|
| Natan | f429f44e-b391-4d6f-92c3-76f69bff1ac9 | +5562982081997 |
| Raul | 945262dd-dbdb-4e17-b526-beef7a016b99 | +5562984548826 |
| Marieli | a06c1b05-2fe7-45e3-a899-d83caab5696a | +5562992113779 |
| Leonardo | 12548a15-0287-4607-8eb9-1f6358ae8c94 | +5562982035566 |
| Paulo Vitor | 1c22db3d-1b6e-4ce1-a67d-635e1952f86b | +5562983211668 |
| Luciano | 70584a12-7d21-4647-9408-fe5d2f0b6edc | +5562992060476 |

---

## Exemplo Completo - Cadastrar Todos

```sql
-- Gestor
INSERT INTO app_users (email, name, role, is_active)
VALUES ('gestor@veracruz.com.br', 'Gestor Vera Cruz', 'gestor', true);

-- Vendedores (ajuste os emails conforme necessário)
INSERT INTO app_users (email, name, role, seller_id, is_active) VALUES
('natan@veracruz.com.br', 'Natan', 'vendedor', 'f429f44e-b391-4d6f-92c3-76f69bff1ac9', true),
('raul@veracruz.com.br', 'Raul', 'vendedor', '945262dd-dbdb-4e17-b526-beef7a016b99', true),
('marieli@veracruz.com.br', 'Marieli', 'vendedor', 'a06c1b05-2fe7-45e3-a899-d83caab5696a', true),
('leonardo@veracruz.com.br', 'Leonardo', 'vendedor', '12548a15-0287-4607-8eb9-1f6358ae8c94', true),
('paulovitor@veracruz.com.br', 'Paulo Vitor', 'vendedor', '1c22db3d-1b6e-4ce1-a67d-635e1952f86b', true),
('luciano@veracruz.com.br', 'Luciano', 'vendedor', '70584a12-7d21-4647-9408-fe5d2f0b6edc', true);
```

---

## Fluxo de Acesso

1. Usuário acessa o frontend
2. Digita o email e recebe Magic Link
3. Clica no link do email
4. Sistema verifica se email está em `app_users`
   - **Se sim**: entra no sistema com o perfil correto
   - **Se não**: mostra mensagem "Acesso Negado"

---

## Verificar Usuários Cadastrados

```sql
SELECT email, name, role, seller_id, is_active FROM app_users;
```

---

## Desativar Usuário

```sql
UPDATE app_users SET is_active = false WHERE email = 'email@empresa.com';
```
