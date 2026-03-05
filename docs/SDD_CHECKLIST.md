# SDD — Checklist operacional (fixo)

## Etapa 0 — Preparação
- Feature exata
- O que faz / não faz
- Áreas impactadas

## Etapa 1 — Pesquisa (Chat 1)
- Mapear arquivos/pastas
- Padrões similares
- Docs externas (SuperAgentes + Supabase + Vercel)
Saída: PRD.md

## /clear

## Etapa 2 — SPEC (Chat 2)
- Arquivo por arquivo
- CREATE/MODIFY
- Sem ambiguidade
- Em mudanças visuais: documentar design system, páginas afetadas e responsividade
Saída: SPEC.md

## /clear

## Etapa 3 — Implementação (Chat 3)
- Executar SPEC
- Criar/modificar só arquivos listados
- Se erro: corrigir só o erro
- Em UI: validar desktop e mobile

## Config SuperAgentes (fora de SPEC)
- Follow-ups: 6 configurados (2h, 6h, 10h, 1d, 1d6h, 1d12h) — `SUPERAGENTES_CONFIG.md`
