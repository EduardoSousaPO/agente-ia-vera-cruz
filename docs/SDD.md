# SDD — Spec‑Driven Development (workflow obrigatório)

## Regra de ouro
**Nada de implementar antes de ter SPEC.**

## Etapa 0 — Preparação
Antes de qualquer ação:
- Leia: `PRD.md`, `SPEC.md`, `SDD.md` e `.cursor/*.mdc`.
- Defina: “qual feature estou fazendo agora?”

## Chat 1 — Pesquisa (explorar)
Objetivo: entender contexto e mapear impactos.

Checklist:
- Mapear pastas/arquivos existentes e padrões do repo.
- Identificar dependências e scripts.
- Ver como o projeto lida com env, deploy, db.
- Ler docs internas e alinhar com PRD.
- Se necessário, consultar documentação externa (SuperAgentes/Supabase/Vercel).

Saída obrigatória:
- Atualizar `PRD.md` **somente se** aparecer algo que altera escopo/decisões.

## /clear

## Chat 2 — SPEC (planejar)
Objetivo: plano executável e sem ambiguidade.

Checklist:
- Lista fechada de arquivos a criar/editar.
- Para cada arquivo: caminho + CREATE/MODIFY + mudanças exatas.
- Proibir criação de arquivos fora da lista.
- Nenhum item vago (“melhorar”, “refatorar”, “arrumar”).

Saída obrigatória:
- `SPEC.md` atualizado (ou escrito do zero) com a lista final.

## /clear

## Chat 3 — Implementação (executar)
Objetivo: fazer exatamente o que a SPEC mandou.

Checklist:
- Criar/editar apenas os arquivos listados.
- Não expandir escopo.
- Se falhar build/teste: corrigir somente o erro.

## Final — Validação
- Build/lint passam.
- Fluxos do PRD funcionam.
- Nenhum arquivo extra criado.
