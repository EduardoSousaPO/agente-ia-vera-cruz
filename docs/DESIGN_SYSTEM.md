# Design System — Vera Cruz CRM (referência Asana)

Documento canônico de **tipografia, cores, espaçamento, layout e componentes** do frontend. Inspirado no padrão visual do [Asana](https://asana.com/pt): clareza, hierarquia de informação, espaços generosos e leitura confortável.

**Referências:** [Asana Brand](https://asana.com/brand), [Asana Design](https://asana.design/). Uso apenas como inspiração; não reproduzimos marcas ou logos da Asana.

---

## 1. Tipografia

### Família
- **Principal:** Source Sans 3 (Google Fonts) — legível, neutra e profissional, próxima ao uso de sans-serif em produtos de gestão como o Asana.
- **Fallback:** "Segoe UI", system-ui, sans-serif.

### Escala (line-height para reduzir carga cognitiva)
| Uso            | Tamanho | Peso   | Line-height | Letter-spacing |
|----------------|---------|--------|-------------|----------------|
| Page title     | 28px    | 700    | 1.25        | -0.02em        |
| Section title  | 20px    | 600    | 1.3         | -0.01em        |
| Card title     | 16px    | 600    | 1.4         | 0              |
| Body           | 15px    | 400    | 1.5         | 0              |
| Small / muted  | 13px    | 400    | 1.45        | 0              |
| Caption        | 12px    | 400    | 1.4         | 0              |

### Regras
- Títulos com hierarquia clara: H1 (página) → H2 (seção) → H3 (bloco/card).
- Parágrafos de apoio logo abaixo do título (page-subtitle) em tamanho menor e cor secundária.
- Evitar blocos longos sem quebras; preferir listas ou cards para escaneabilidade.

---

## 2. Cores

Paleta inspirada na clareza e no uso de acentos moderados (coral/verde como referência de marca Asana; adaptamos para o CRM).

### Neutros (fundos e texto)
| Token        | Uso                    | Valor hex    |
|--------------|------------------------|--------------|
| `--bg`       | Fundo da aplicação     | #f6f5f3      |
| `--bg-elevated` | Áreas elevadas     | #fcfbf9      |
| `--surface`  | Cards, modais, inputs  | #ffffff      |
| `--surface-soft` | Inputs, hover leve | #f8f7f5      |
| `--border`   | Bordas e divisores     | #e0ddd8      |
| `--text`     | Texto principal        | #1a1d21      |
| `--text-muted` | Texto secundário    | #5c6370      |

### Acentos
| Token          | Uso                  | Valor hex    |
|----------------|----------------------|--------------|
| `--accent`     | Botões primários, links ativos | #e85d4c (coral) |
| `--accent-hover` | Hover primário     | #d94a43      |
| `--accent-soft` | Fundo de destaque leve | #fef2f0   |
| `--success`    | Sucesso, confirmação | #2ea96e (verde) |
| `--danger`     | Erro, destrutivo     | #c92a1e      |

### Uso
- Botão primário: `--accent`; hover `--accent-hover`.
- Link ativo na navegação: `--accent` ou `--accent-soft` como fundo.
- Texto secundário (subtítulos, labels): `--text-muted`.

---

## 3. Espaçamento

Grade base **4px**. Multiplos preferidos: 4, 8, 12, 16, 24, 32, 48.

| Token       | Valor  | Uso típico                    |
|-------------|--------|--------------------------------|
| `--space-1` | 4px    | Gaps mínimos, ícones           |
| `--space-2` | 8px    | Entre itens de lista, padding interno pequeno |
| `--space-3` | 12px   | Entre label e valor, toolbar   |
| `--space-4` | 16px   | Padding de bloco pequeno       |
| `--space-5` | 24px   | Padding de painel, entre seções |
| `--space-6` | 32px   | Entre blocos grandes           |
| `--space-8` | 48px   | Separação de seções principais  |

Regra: **respiro generoso** entre seções (24–32px) e dentro de cards (18–24px), no estilo Asana.

---

## 4. Formas e linhas

### Border radius
| Token          | Valor  | Uso              |
|----------------|--------|------------------|
| `--radius-sm`  | 6px    | Badges, chips    |
| `--radius-md`  | 10px   | Inputs, botões   |
| `--radius-lg`  | 14px   | Cards, painéis   |

### Bordas
- Espessura: **1px**.
- Cor: `--border`.
- Uso: separar sidebar do conteúdo; delimitar cards; tabelas com `border-bottom` em linhas.

### Sombras
- Leve: `0 2px 8px rgba(26, 29, 33, 0.06)` para cards.
- Elevado: `0 12px 32px rgba(26, 29, 33, 0.08)` para modais/destaque.

### Linhas e divisores
- Divisor de seção: 1px sólido `--border` ou linha discreta.
- Timeline: linha vertical (2–3px) com cor `--border` ou tom mais suave.

---

## 5. Layout e organização

### Estrutura geral
- **Shell:** grid `sidebar (260px) + conteúdo (1fr)`; em mobile, coluna única e sidebar acima.
- **Área de conteúdo:** padding 24–32px; largura máxima opcional (ex.: 1200px) centralizada.
- **Topbar:** título da página (H1) + subtítulo em uma linha; ações (ex.: “Ver métricas”) à direita.

### Apresentação da informação (lógica Asana)
1. **Uma ideia por bloco:** cada painel (`.panel`) trata de um tema (lista de leads, dados do lead, métricas).
2. **Título + resumo:** em cada página, H1 seguido de uma frase curta (page-subtitle) explicando o contexto.
3. **Tabelas:** cabeçalhos em `--text-muted`, peso 600; linhas com padding 12px 16px; borda inferior sutil.
4. **Cards de métrica:** label pequena (13px, muted); valor em destaque (28px, bold); cantos arredondados e fundo levemente elevado.
5. **Formulários e listas:** labels alinhadas (ex.: grid 160px 1fr); inputs com altura mínima 40px e radius `--radius-md`.

### Responsividade
- Breakpoint principal: **900px** (sidebar vira bloco superior).
- Padding reduzido em mobile (16px em vez de 24px).
- Tabelas: considerar scroll horizontal ou layout em cards em telas muito pequenas.

---

## 6. Componentes referenciados no código

| Classe / elemento     | Estilo resumido |
|-----------------------|------------------|
| `.app-shell`          | Grid sidebar + main |
| `.sidebar`            | Fundo `--bg-elevated`, borda direita `--border` |
| `.nav-link`, `.nav-link-active` | Padding 10–12px, radius `--radius-md`; ativo com `--accent` ou `--accent-soft` |
| `.page-title`         | 28px, 700, letter-spacing -0.02em |
| `.page-subtitle`      | 14px, `--text-muted` |
| `.panel`              | `--surface`, borda, `--radius-lg`, sombra leve |
| `.panel-inner`        | Padding 20–24px |
| `.btn`                | `--accent`, cor branca, `--radius-md`, peso 600 |
| `.input`, `.select`   | `--surface-soft`, borda, `--radius-md`, focus com borda accent |
| `.data-table`         | th/td com padding e border-bottom sutil |
| `.metric-card`        | Card com label + valor; `--radius-md` |
| `.timeline-item`      | Borda esquerda 3px, padding-left 12px |
| `.auth-wrap` / `.auth-card` | Centralizado; card com `--radius-lg` e sombra |
| `.action-link` | Link de ação no topbar (borda, hover suave) — "Ver métricas", "Ver leads" |
| `.loading-wrap` | Bloco de carregamento (padding `--space-5`, texto muted) |
| `.empty-state` | Mensagem de lista vazia ou carregando (muted, margem superior) |
| `.section-gap` | Margem inferior entre painéis (`--space-4`) |
| `.data-table .cell-num` | Célula alinhada à direita (valores numéricos) |
| `.code-block` | Bloco de código (fundo `--surface-soft`, radius, fonte 12px) |
| `.form-field` | Campo de formulário full width com margem inferior (auth) |
| `.auth-card--center` | Card de auth com texto centralizado (ex.: "Verifique seu e-mail") |

---

## 7. Integração com SDD / SPEC

- Mudanças de **design, layout ou estilo** devem ser descritas na SPEC (tokens, páginas afetadas).
- Este documento é a **referência canônica** para consistência visual; novas telas e componentes devem seguir os tokens e a lógica de apresentação aqui definidos.
- Atualizar `DESIGN_SYSTEM.md` quando houver nova decisão de estilo aprovada (ex.: nova cor de destaque, nova escala de títulos).
