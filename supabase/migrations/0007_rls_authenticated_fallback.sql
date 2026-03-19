-- 0007_rls_authenticated_fallback.sql
-- Fallback: qualquer usuário autenticado (auth.uid() not null) pode ler leads.
-- Garante que gestores vejam os leads enquanto as policies por role podem falhar em edge cases.
-- Para remover: DROP POLICY "read leads authenticated fallback" ON public.leads;

drop policy if exists "read leads authenticated fallback" on public.leads;
create policy "read leads authenticated fallback"
on public.leads for select to authenticated
using (auth.uid() IS NOT NULL);
