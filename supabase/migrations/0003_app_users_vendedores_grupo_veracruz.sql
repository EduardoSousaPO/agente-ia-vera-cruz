-- 0003_app_users_vendedores_grupo_veracruz.sql
-- Adiciona colunas em app_users (email, name, seller_id, is_active) e cria logins para os 10 vendedores do Grupo Vera Cruz.
-- Os vendedores acessam pelo email (Magic Link) e veem apenas leads atribuídos a eles (role vendedor).

-- 1. Colunas em app_users (compatível com AuthContext e CADASTRO_USUARIOS)
alter table public.app_users add column if not exists email text;
alter table public.app_users add column if not exists name text;
alter table public.app_users add column if not exists seller_id uuid references public.sellers(id);
alter table public.app_users add column if not exists is_active boolean not null default true;
create unique index if not exists app_users_email_key on public.app_users(email) where email is not null;

-- 2. Role: permitir gestor e vendedor (além de admin/manager)
alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users add constraint app_users_role_check
  check (role in ('admin','manager','gestor','vendedor'));

-- 3. Novos sellers para vendedores que ainda não estavam na base (5 nomes do print)
-- Telefones placeholder E.164; atualizar depois no Supabase com os celulares reais da tabela.
insert into public.sellers (name, phone, phone_e164, is_active) values
  ('Sara Cristina de castro gomes', '+5562999999001', '+5562999999001', true),
  ('Hugo Alexandre da Silva', '+5562999999002', '+5562999999002', true),
  ('Caio Cesar Graciano Guimaraes Sousa', '+5562999999003', '+5562999999003', true),
  ('Sandra da Cruz Pereira', '+5562999999004', '+5562999999004', true),
  ('Divino Nunes', '+5562999999005', '+5562999999005', true)
on conflict (phone) do update set name = excluded.name, phone_e164 = excluded.phone_e164, is_active = true;

-- 4. Inserir/atualizar app_users para os 10 vendedores (email do print → role vendedor, seller_id pelo nome)
-- Mapeamento: Natanael→Natan, Leonardo→Leonardo, Marieli→Marieli, Luciano→Luciano, Raul→Raul (existentes);
-- Sara, Hugo, Caio, Sandra, Divino (novos sellers acima).
insert into public.app_users (user_id, created_at, role, email, name, seller_id, is_active)
select gen_random_uuid(), now(), 'vendedor', v.email, v.name, s.id, true
from (values
  ('atendimento@grupoveracruz.com.br', 'Sara Cristina de castro gomes', 'Sara Cristina de castro gomes'),
  ('vendas@grupoveracruz.com.br', 'Natanael Londres dos santos', 'Natan'),
  ('vendas1@grupoveracruz.com.br', 'Hugo Alexandre da Silva', 'Hugo Alexandre da Silva'),
  ('vendas2@grupoveracruz.com.br', 'Caio Cesar Graciano Guimaraes Sousa', 'Caio Cesar Graciano Guimaraes Sousa'),
  ('vendas3@grupoveracruz.com.br', 'Leonardo Mendonça Soares', 'Leonardo'),
  ('financiamento@grupoveracruz.com.br', 'Sandra da Cruz Pereira', 'Sandra da Cruz Pereira'),
  ('sofinanciamento@grupoveracruz.com.br', 'Marieli Aparecida Padilha', 'Marieli'),
  ('vendas5@grupoveracruz.com.br', 'Luciano Alves Borges', 'Luciano'),
  ('vendas4@grupoveracruz.com.br', 'Raul Marques', 'Raul'),
  ('veracruzdiretoria@hotmail.com', 'Divino Nunes', 'Divino Nunes')
) as v(email, name, seller_name)
join public.sellers s on s.name = v.seller_name and s.is_active = true
on conflict (email) where email is not null do update set
  name = excluded.name,
  role = excluded.role,
  seller_id = excluded.seller_id,
  is_active = excluded.is_active;
