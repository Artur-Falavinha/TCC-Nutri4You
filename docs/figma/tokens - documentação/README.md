# Design tokens — referência completa

Documentação de referência dos **design tokens** do projeto **I Need a Nutri**: convenções, escopo (global vs web), **estratégia de unidades (Figma em px vs frontend em `rem`/`px`)** e **descrição de cada token** com valor atual (sincronizado com o arquivo Figma).

| | |
|---|---|
| **Arquivo Figma** | TCC I need a Nutri |
| **Modos** | Apenas claro (sem dark mode) |
| **Última revisão de valores** | alinhada à exportação das variáveis locais do Figma |

---

## Índice

1. [Visão geral e escopo](#1-visão-geral-e-escopo)
2. [Unidades e estratégia de implementação](#2-unidades-e-estratégia-de-implementação) · [§2.8 Tabela por variável](#28-tabela-por-variável-figma-para-css) · [§2.9 Handoff MCP](#29-handoff-mcp-e-px-no-código-gerado)
3. [Convenções de nomenclatura](#3-convenções-de-nomenclatura)
4. [Paleta](#4-paleta)
5. [Tipografia](#5-tipografia)
6. [Raio](#6-raio)
7. [Sombra](#7-sombra)
8. [Traço](#8-traço)
9. [Ícone](#9-ícone)
10. [Camada](#10-camada-z-index)
11. [Opacidade](#11-opacidade)
12. [Web · Espaçamento](#12-web--espaçamento)
13. [Web · Layout](#13-web--layout)
14. [Mobile · Espaçamento](#14-mobile--espaçamento)
15. [Mobile · Layout](#15-mobile--layout)
16. [Manutenção e governança](#16-manutenção-e-governança)

---

## 1. Visão geral e escopo

### Coleções globais (Web + Mobile)

| Coleção | Função |
|---------|--------|
| **Paleta** | Cores semânticas e neutros (marca, texto, superfície, borda, estados). |
| **Tipografia** | Família, peso, escala de tamanho, entrelinha e tracking. |
| **Raio** | `border-radius` em px. |
| **Sombra** | `box-shadow` como **string** (cópia direta para CSS). |
| **Traço** | Espessura de borda em px. |
| **Ícone** | Tamanhos de ícone e área mínima de toque. |
| **Camada** | Escala de `z-index`. |
| **Opacidade** | Alpha para overlays (ex.: scrim de modal) e estados como desativado. |

### Coleções exclusivas de Web

| Coleção | Função |
|---------|--------|
| **Web · Espaçamento** | Ritmo e espaçamento de layout web (`espaco/web/…`). |
| **Web · Layout** | Largura máxima, gutter e breakpoints em px. |

### Coleções exclusivas de Mobile

| Coleção | Função |
|---------|--------|
| **Mobile · Espaçamento** | Ritmo e espaçamento em telas estreitas (`espaco/mobile/…`); barras de app e navegação inferior. |
| **Mobile · Layout** | Margens de tela, largura de artboard de referência e inset de área segura. |

A **paleta** e os demais tokens **globais** são os **mesmos** no web e no mobile; só **espaçamento** e **layout** têm coleções específicas por plataforma.

---

## 2. Unidades e estratégia de implementação

Esta seção define **como os valores definidos em px no Figma** se traduzem para **CSS (ou equivalente)** sem alterar nomes de tokens, coleções ou a escala numérica já adotada no arquivo. O objetivo é alinhar o design system a boas práticas de frontend (**acessibilidade**, **zoom do usuário**, **consistência**) mantendo o **layout no Figma** como fonte da verdade visual.

### 2.1 Figma vs frontend

| Aspecto | Figma | Frontend (recomendado) |
|--------|--------|-------------------------|
| **Papel** | Especificação visual e handoff; valores em **px** são estáveis e auditáveis. | Implementação: parte da escala usa **`rem`** para propriedades que devem escalar com o tamanho de fonte raiz; outras permanecem em **`px`**. |
| **Tipografia e ritmo** | `fonte/tamanho/*`, `fonte/entrelinha/*`, `espaco/web/*`, `espaco/mobile/*` em **px**. | Converter para **`rem`** com base **`1rem = 16px`** (tamanho padrão do `html` no navegador). |
| **Efeitos finos e layout de viewport** | Raio, traço, sombras, ícones, breakpoints, larguras máximas. | Manter em **`px`** (ou string de sombra inalterada), alinhado ao desenho e a media queries. |

**Regra de ouro:** não é necessário **mudar os valores no Figma** nem renomear tokens. A conversão é uma **camada de implementação** (build, tema, variáveis CSS geradas a partir dos tokens).

### 2.2 O que permanece em px no Figma (inalterado)

Conforme já modelado no arquivo: **tipografia** (valores numéricos), **espaçamento**, **layout**, **raio**, **traço**, **ícone**, **breakpoints** e demais medidas em **FLOAT** — todos continuam documentados e definidos em **px** no Figma.

### 2.3 O que converter para `rem` no código

Aplicar **`rem`** apenas aos tokens **escaláveis** (relacionados a texto e ao ritmo de interface):

| Família de token | Conversão |
|------------------|-----------|
| `fonte/tamanho/*` | `font-size` em **`rem`** |
| `fonte/entrelinha/*` | `line-height`: preferir valor **sem unidade** (ex.: `1.5`) quando for múltiplo coerente do tamanho, ou **`rem`** alinhado ao token — ver exemplos abaixo |
| `espaco/web/*` | `padding`, `margin`, `gap`, `inset` em **`rem`** (exceto `0`, que permanece `0`) |
| `espaco/mobile/*` | Idem ao web |

**Base:** `1rem = 16px` → `valor_rem = valor_px ÷ 16`.

### 2.4 O que manter em px no frontend

| Família de token | Uso típico no CSS |
|------------------|-------------------|
| `traco/*` | `border-width`, `outline-width` em **`px`** |
| `sombra/*` | `box-shadow` como **string** com **`px`** (token já é literal) |
| `breakpoint/*` | `min-width` / `max-width` em media queries em **`px`** |
| `layout/*` (web e mobile) | `max-width`, gutters, artboard, referências de viewport em **`px`** |
| `icone/*` | `width`/`height` de ícone, ícones inline em **`px`** (recomendado para casar com grid e traço) |
| `raio/*` | `border-radius` em **`px`** (simplicidade e paridade com o Figma; evita cantos “flutuantes” em escalas híbridas) |
| `camada/*` | `z-index` (número sem unidade) |
| `opacidade/*` | alpha / `opacity` (0–1) |

Isso mantém **bordas de 1px**, **sombras** e **ícones** visualmente **fiéis** ao arquivo, enquanto o **texto e o espaçamento** principal respondem melhor a **preferências de fonte** e zoom.

### 2.5 Tabela — categoria, unidade no Figma, unidade no frontend

| Categoria de token | Coleção(ões) | Unidade no Figma | Unidade no frontend | Observação |
|--------------------|--------------|------------------|---------------------|------------|
| Cores | Paleta | — (hex / alias) | variáveis de cor | Sem `rem`/`px` em si; mapear para `color` / tema. |
| Tamanho de fonte | Tipografia | px | **rem** | Escalável com o usuário. |
| Entrelinha | Tipografia | px | **rem** (ou número sem unidade) | Ver [§5 Tipografia](#5-tipografia) e §2.6. |
| Peso, tracking, família | Tipografia | número / string | — | `font-weight`, `letter-spacing`, `font-family`. |
| Espaçamento | Web · Espaçamento, Mobile · Espaçamento | px | **rem** | Ritmo da UI; exceção: valor `0`. |
| Raio | Raio | px | **px** | Paridade com componentes e ícones. |
| Traço | Traço | px | **px** | Bordas finas estáveis. |
| Sombra | Sombra | string CSS | **px** (na string) | Copiar literalmente ou via variável. |
| Ícone / alvo mínimo | Ícone | px | **px** (recomendado) | Opcional: `alvo/minimo` → `2.5rem` se o time padronizar tudo em `rem`. |
| Camada | Camada | inteiro | `z-index` | Sem unidade. |
| Opacidade | Opacidade | 0–1 | 0–1 | Overlay e estados. |
| Layout e breakpoints | Web · Layout, Mobile · Layout | px | **px** | Media queries e dimensões de layout. |

### 2.6 Exemplos de conversão (`1rem = 16px`)

**Tipografia**

| Token (Figma) | Valor em px | CSS (exemplo) |
|---------------|-------------|----------------|
| `fonte/tamanho/16` | 16 | `font-size: 1rem;` |
| `fonte/tamanho/24` | 24 | `font-size: 1.5rem;` |
| `fonte/entrelinha/16` | 24 | `line-height: 1.5rem;` ou `line-height: 1.5;` (se acoplado ao `font-size` do mesmo elemento) |
| `fonte/entrelinha/36` | 44 | `line-height: 2.75rem;` |

**Espaçamento (web)**

| Token (Figma) | Valor em px | CSS (exemplo) |
|---------------|-------------|----------------|
| `espaco/web/tamanho-32` | 32 | `padding: 2rem;` / `gap: 2rem;` |
| `espaco/web/tamanho-8` | 8 | `0.5rem` |

**Fixos (permanecem px)**

| Token (Figma) | Valor | CSS (exemplo) |
|-----------------|-------|----------------|
| `traco/1` | 1 | `border-width: 1px;` |
| `raio/8` | 8 | `border-radius: 8px;` |
| `breakpoint/1024` | 1024 | `@media (min-width: 1024px) { … }` |

### 2.7 Consistência sem quebrar o design system

1. **Não alterar** nomes de tokens nem a organização das coleções no Figma.
2. **Implementar** a conversão px → rem na **camada de código** (Style Dictionary, variáveis CSS geradas, tema Tailwind, etc.), usando **`16`** como base única documentada.
3. **Definir no time** se `line-height` será sempre em **`rem`** (espelhando o token) ou **sem unidade** (proporção ao `font-size` do mesmo nó); ambos são válidos — o importante é **um padrão único** por repositório.
4. **Validar** visualmente componentes-chave após a adoção de `rem` (sidebar, tabela, modal) em zoom 100% e 125% no navegador.

### 2.8 Tabela por variável (Figma para CSS)

**Base:** `1rem = 16px`.

- **No Figma:** os valores das variáveis **permanecem inalterados** (números em **px** para medidas, **hex** para cores, **0–1** para opacidade). Isso continua sendo a fonte da verdade para layout e handoff.
- **No código:** use a coluna **Unidade no CSS** e **Equivalente / uso** abaixo; não é necessário (nem recomendado) trocar o número armazenado no Figma para “equivalente em rem”.
- **Cópia no arquivo Figma:** página **Tokens — documentação**, frame **Variáveis — rem vs px (referência CSS)**.

| Token | Valor no Figma | Unidade no CSS | Equivalente / uso |
|-------|----------------|----------------|-------------------|
| `camada/0` | 0 | z-index (sem unidade) | 0 |
| `camada/10` | 10 | z-index (sem unidade) | 10 |
| `camada/20` | 20 | z-index (sem unidade) | 20 |
| `camada/30` | 30 | z-index (sem unidade) | 30 |
| `camada/40` | 40 | z-index (sem unidade) | 40 |
| `camada/50` | 50 | z-index (sem unidade) | 50 |
| `cor/borda/forte` | #9ca3af | `color` | `var(--token)` ou hex |
| `cor/borda/padrao` | #cbd5e1 | `color` | `var(--token)` ou hex |
| `cor/marca/primaria` | #006f1e | `color` | `var(--token)` ou hex |
| `cor/marca/secundaria` | #349896 | `color` | `var(--token)` ou hex |
| `cor/neutro/branco` | #ffffff | `color` | `var(--token)` ou hex |
| `cor/neutro/preto` | #000000 | `color` | `var(--token)` ou hex |
| `cor/semantica/erro` | #8c3c3c | `color` | `var(--token)` ou hex |
| `cor/semantica/fundo-sucesso` | #eaffe3 | `color` | `var(--token)` ou hex |
| `cor/superficie/cartao` | alias → branco | `color` | `var(--token)` ou hex |
| `cor/superficie/pagina` | #f5f5f5 | `color` | `var(--token)` ou hex |
| `cor/superficie/sutil` | #eceef0 | `color` | `var(--token)` ou hex |
| `cor/texto/discreto` | #94a3b8 | `color` | `var(--token)` ou hex |
| `cor/texto/principal` | #2d3335 | `color` | `var(--token)` ou hex |
| `cor/texto/secundario` | #64748b | `color` | `var(--token)` ou hex |
| `cor/texto/sobre-marca-primaria` | alias → branco | `color` | `var(--token)` ou hex |
| `raio/0` | 0 px | `px` | 0px |
| `raio/4` | 4 px | `px` | 4px |
| `raio/8` | 8 px | `px` | 8px |
| `raio/12` | 12 px | `px` | 12px |
| `raio/16` | 16 px | `px` | 16px |
| `raio/24` | 24 px | `px` | 24px |
| `raio/pill` | 9999 px | `px` | 9999px |
| `sombra/nivel-0` | string CSS | `px` na string | `box-shadow` literal |
| `sombra/nivel-1` | string CSS | `px` na string | `box-shadow` literal |
| `sombra/nivel-2` | string CSS | `px` na string | `box-shadow` literal |
| `sombra/nivel-3` | string CSS | `px` na string | `box-shadow` literal |
| `traco/1` | 1 px | `px` | 1px |
| `traco/2` | 2 px | `px` | 2px |
| `icone/16` | 16 px | `px` | 16px |
| `icone/20` | 20 px | `px` | 20px |
| `icone/24` | 24 px | `px` | 24px |
| `alvo/minimo` | 40 px | `px` | 40px (ou 2.5rem se o time padronizar) |
| `opacidade/overlay/modal` | 0.5 | 0–1 | alpha em `rgba` / `opacity` |
| `opacidade/overlay/lev` | ~0.4 | 0–1 | idem |
| `opacidade/overlay/forte` | ~0.72 | 0–1 | idem |
| `opacidade/estado/desativado` | 0.5 | 0–1 | `opacity` |
| `fonte/tamanho/12` | 12 px | `rem` | 0.75rem |
| `fonte/tamanho/14` | 14 px | `rem` | 0.875rem |
| `fonte/tamanho/16` | 16 px | `rem` | 1rem |
| `fonte/tamanho/18` | 18 px | `rem` | 1.125rem |
| `fonte/tamanho/20` | 20 px | `rem` | 1.25rem |
| `fonte/tamanho/24` | 24 px | `rem` | 1.5rem |
| `fonte/tamanho/28` | 28 px | `rem` | 1.75rem |
| `fonte/tamanho/32` | 32 px | `rem` | 2rem |
| `fonte/tamanho/36` | 36 px | `rem` | 2.25rem |
| `fonte/entrelinha/12` | 16 px | `rem` | 1rem |
| `fonte/entrelinha/14` | 20 px | `rem` | 1.25rem |
| `fonte/entrelinha/16` | 24 px | `rem` | 1.5rem |
| `fonte/entrelinha/18` | 26 px | `rem` | 1.625rem |
| `fonte/entrelinha/20` | 28 px | `rem` | 1.75rem |
| `fonte/entrelinha/24` | 32 px | `rem` | 2rem |
| `fonte/entrelinha/28` | 36 px | `rem` | 2.25rem |
| `fonte/entrelinha/32` | 40 px | `rem` | 2.5rem |
| `fonte/entrelinha/36` | 44 px | `rem` | 2.75rem |
| `fonte/peso/400` | 400 | número | `font-weight: 400` |
| `fonte/peso/500` | 500 | número | `font-weight: 500` |
| `fonte/peso/600` | 600 | número | `font-weight: 600` |
| `fonte/peso/700` | 700 | número | `font-weight: 700` |
| `fonte/tracking/0` | 0 | número | `letter-spacing: 0` |
| `fonte/familia/1` | Manrope | string | `font-family` |
| `espaco/web/nenhum` | 0 px | `0` | 0 |
| `espaco/web/tamanho-4` | 4 px | `rem` | 0.25rem |
| `espaco/web/tamanho-8` | 8 px | `rem` | 0.5rem |
| `espaco/web/tamanho-12` | 12 px | `rem` | 0.75rem |
| `espaco/web/tamanho-16` | 16 px | `rem` | 1rem |
| `espaco/web/tamanho-24` | 24 px | `rem` | 1.5rem |
| `espaco/web/tamanho-32` | 32 px | `rem` | 2rem |
| `espaco/web/tamanho-40` | 40 px | `rem` | 2.5rem |
| `espaco/web/tamanho-48` | 48 px | `rem` | 3rem |
| `espaco/web/barra-lateral` | 256 px | `rem` | 16rem |
| `espaco/web/cabecalho-altura` | 32 px | `rem` | 2rem |
| `espaco/web/cabecalho-largura` | 40 px | `rem` | 2.5rem |
| `layout/largura-maxima` | 1280 px | `px` | 1280px |
| `layout/gutter` | 24 px | `px` | 24px |
| `breakpoint/640` | 640 px | `px` | 640px em `@media` |
| `breakpoint/768` | 768 px | `px` | 768px em `@media` |
| `breakpoint/1024` | 1024 px | `px` | 1024px em `@media` |
| `breakpoint/1280` | 1280 px | `px` | 1280px em `@media` |
| `espaco/mobile/nenhum` | 0 px | `0` | 0 |
| `espaco/mobile/tamanho-4` | 4 px | `rem` | 0.25rem |
| `espaco/mobile/tamanho-8` | 8 px | `rem` | 0.5rem |
| `espaco/mobile/tamanho-12` | 12 px | `rem` | 0.75rem |
| `espaco/mobile/tamanho-16` | 16 px | `rem` | 1rem |
| `espaco/mobile/tamanho-20` | 20 px | `rem` | 1.25rem |
| `espaco/mobile/tamanho-24` | 24 px | `rem` | 1.5rem |
| `espaco/mobile/tamanho-32` | 32 px | `rem` | 2rem |
| `espaco/mobile/tamanho-40` | 40 px | `rem` | 2.5rem |
| `espaco/mobile/tamanho-48` | 48 px | `rem` | 3rem |
| `espaco/mobile/cabecalho-altura` | 56 px | `rem` | 3.5rem |
| `espaco/mobile/navegacao-inferior` | 56 px | `rem` | 3.5rem |
| `layout/margem-horizontal` | 16 px | `px` | 16px |
| `layout/margem-horizontal-grande` | 20 px | `px` | 20px |
| `layout/largura-maxima-artboard` | 428 px | `px` | 428px |
| `layout/inset-area-segura` | 34 px | `px` | 34px (+ `env(safe-area-inset-bottom)` no app) |

### 2.9 Handoff MCP e px no código gerado

Ferramentas como **Figma MCP** (`get_design_context`, etc.) costumam devolver **referência em React + Tailwind** com **valores em `px`** e classes arbitrárias (`text-[14px]`, `p-[24px]`, `rounded-[8px]`). Isso é **esperado**: o motor replica o layout **computado** no Figma, onde medidas são **px**.

**Isso não define o padrão do seu frontend.** O fluxo recomendado é:

1. **Tratar o output do MCP como rascunho estrutural** (hierarquia, nomes de camadas, ordem dos blocos), não como estilo final.
2. **Substituir** tamanhos de fonte, entrelinha e espaçamentos por **tokens do projeto** (`rem` conforme [§2.8](#28-tabela-por-variável-figma-para-css)), usando variáveis CSS ou o tema do framework.
3. **Manter `px`** onde a política já manda: `border-radius` dos tokens de raio, `border-width`, `box-shadow`, breakpoints, `layout/*`, `icone/*` — mesmo que o MCP tenha gerado `px`, o valor deve **coincidir com o token**, não com números soltos sem nome.
4. **Cores:** preferir **variáveis** (`cor/texto/*`, `cor/superficie/*`, etc.) em vez de hex soltos que o snippet possa trazer.

**Para o agente / IDE:** ao implementar a partir de MCP, seguir explicitamente a [§2](#2-unidades-e-estratégia-de-implementação) e a tabela [§2.8](#28-tabela-por-variável-figma-para-css); **não** copiar `px` de tipografia ou `espaco/*` para o CSS final quando a política for `rem`.

---

## 3. Convenções de nomenclatura

- **Barras (`/`)** separam níveis: categoria → subcategoria → variante (ex.: `cor/texto/principal`).
- **Valores numéricos** nos nomes indicam tamanho em **px** (tipografia, raio, espaçamento, ícone), exceto onde indicado (ex.: `raio/pill`).
- **Opacidade:** valores em **0–1** (como no CSS), para alpha de overlay ou `opacity` em elementos desativados.
- **Prefixo `espaco/web/`** ou **`espaco/mobile/`** deixa explícito o ritmo de layout da plataforma; tokens globais **não** carregam esses prefixos no nome da coleção.
- **Alias no Figma:** quando o valor é idêntico a outro token, o arquivo pode usar **alias** para um primitivo (ex.: branco) — ver [§4 Paleta](#4-paleta).

---

## 4. Paleta

**Escopo:** global.  
**Tipo no Figma:** cor (`COLOR`).  
**Unidade:** hexadecimal (`#RRGGBB`).

### Marca

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `cor/marca/primaria` | `#006f1e` | Verde principal da identidade; maior peso visual de marca. | CTAs primários, links fortes, destaques de marca, ícones de ação principal. |
| `cor/marca/secundaria` | `#349896` | Teal de apoio; contraste com o verde sem competir com ele. | CTAs secundários, gráficos, estados informativos, acentos em UI. |

### Texto

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `cor/texto/principal` | `#2d3335` | Cor padrão de leitura; alto contraste sobre fundos claros. | Títulos, corpo principal, labels importantes. |
| `cor/texto/secundario` | `#64748b` | Hierarquia visual abaixo do principal. | Subtítulos, metadados, texto de apoio. |
| `cor/texto/discreto` | `#94a3b8` | Menor ênfase; ainda legível em fundos claros. | Placeholders, hints, timestamps, texto desabilitado (se não usar opacidade). |
| `cor/texto/sobre-marca-primaria` | → `cor/neutro/branco` | Texto e ícones sobre fundo **marca primária** (alias do branco). | Botão primário preenchido, barra com fundo verde. |

### Superfície

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `cor/superficie/pagina` | `#f5f5f5` | Fundo “canvas” da aplicação; neutro frio leve. | Background de telas, área atrás do conteúdo principal. |
| `cor/superficie/sutil` | `#eceef0` | Camada um pouco mais escura que a página; separação sutil. | Faixas zebradas, blocos secundários, áreas de agrupamento. |
| `cor/superficie/cartao` | → `cor/neutro/branco` | Superfície elevada sobre a página (alias do branco). | Cards, modais, painéis, dropdowns sobre fundo cinza. |

### Borda

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `cor/borda/padrao` | `#cbd5e1` | Borda neutra padrão; visível sem gritar. | Inputs em repouso, divisórias leves, cards com contorno. |
| `cor/borda/forte` | `#9ca3af` | Borda com mais contraste que a padrão. | Hover/foco de input, tabelas, separação forte entre seções. |

### Neutros

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `cor/neutro/branco` | `#ffffff` | **Primitivo** branco sólido; origem dos aliases de cartão e texto sobre marca. | Referência única de branco; fundos que exigem branco puro. |
| `cor/neutro/preto` | `#000000` | Preto sólido; máximo contraste. | Texto invertido em overlays, ícones monocromáticos fortes (uso pontual). |

### Semântica

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `cor/semantica/erro` | `#8c3c3c` | Cor de erro / destrutivo (vermelho acinzentado). | Mensagens de erro, bordas de validação, alertas críticos. |
| `cor/semantica/fundo-sucesso` | `#eaffe3` | Fundo de sucesso (verde muito claro). | Banners de confirmação, toasts positivos, faixas de “salvo com sucesso”. |

> **Alias:** `cor/superficie/cartao` e `cor/texto/sobre-marca-primaria` apontam para `cor/neutro/branco` no Figma. No CSS, mapeiem todos para a mesma variável ou mantenham nomes semânticos com o mesmo valor `#ffffff`.

---

## 5. Tipografia

**Escopo:** global.  
**Família de referência:** **Manrope** (`fonte/familia/1`).  
**Tipos:** `STRING` (família), `FLOAT` (demais; px ou número de peso).

No **Figma**, tamanhos e entrelinhas permanecem em **px** (valores da tabela abaixo). No **frontend**, `fonte/tamanho/*` e `fonte/entrelinha/*` devem ser implementados preferencialmente em **`rem`**, com **`1rem = 16px`**, conforme [§2 Unidades e estratégia de implementação](#2-unidades-e-estratégia-de-implementação).

### Família e peso

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `fonte/familia/1` | `Manrope` | Família única da interface (UI). | `font-family` base do app. |
| `fonte/peso/400` | `400` | Regular. | Corpo longo, parágrafos, texto padrão. |
| `fonte/peso/500` | `500` | Medium. | Ênfase leve, labels, botões secundários. |
| `fonte/peso/600` | `600` | Semibold. | Subtítulos, navegação, destaque em listas. |
| `fonte/peso/700` | `700` | Bold. | Títulos, botões primários, números em destaque. |

### Tamanho (`fonte/tamanho/*`)

| Token | Valor (px) | Descrição | Uso sugerido |
|-------|------------|-----------|----------------|
| `fonte/tamanho/12` | 12 | Menor escala legível. | Legendas, notas de rodapé, badges compactos. |
| `fonte/tamanho/14` | 14 | Texto secundário compacto. | Tabelas densas, labels de formulário. |
| `fonte/tamanho/16` | 16 | **Base** do corpo. | Parágrafos, inputs, lista principal. |
| `fonte/tamanho/18` | 18 | Corpo confortável / subtítulo leve. | Destaque de leitura sem ser título. |
| `fonte/tamanho/20` | 20 | Título de seção menor. | Cabeçalhos de card, seções internas. |
| `fonte/tamanho/24` | 24 | Título de página secundário. | Headers de área, modais. |
| `fonte/tamanho/28` | 28 | Título intermediário. | Hero secundário, nomes de fluxo. |
| `fonte/tamanho/32` | 32 | Título grande. | Páginas principais, dashboards. |
| `fonte/tamanho/36` | 36 | **Display** / título principal. | Headline de página (ex.: “Gestão de Pacientes”). |

### Entrelinha (`fonte/entrelinha/*`)

O **sufixo** corresponde ao **tamanho** associado (ex.: título 36 px → `fonte/entrelinha/36`). No Figma, valores em **px**; no CSS, mapear para **`rem`** (ou `line-height` sem unidade, se o time fixar essa convenção) — ver [§2](#2-unidades-e-estratégia-de-implementação).

| Token | Valor (px) | Descrição |
|-------|------------|-----------|
| `fonte/entrelinha/12` | 16 | Leitura confortável para texto 12. |
| `fonte/entrelinha/14` | 20 | Blocos de texto 14. |
| `fonte/entrelinha/16` | 24 | Corpo 16 (~1,5). |
| `fonte/entrelinha/18` | 26 | Títulos leves 18. |
| `fonte/entrelinha/20` | 28 | Seções 20. |
| `fonte/entrelinha/24` | 32 | Títulos 24. |
| `fonte/entrelinha/28` | 36 | Títulos 28. |
| `fonte/entrelinha/32` | 40 | Títulos 32. |
| `fonte/entrelinha/36` | 44 | Display 36; evita títulos “apertados”. |

### Tracking

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `fonte/tracking/0` | `0` | Sem ajuste de entreletras. | Padrão para quase toda a UI. |

---

## 6. Raio

**Escopo:** global.  
**Tipo:** `FLOAT` (px).  
**CSS:** `border-radius` em **`px`** no código (paridade com o Figma e consistência com traço/ícones; ver [§2](#2-unidades-e-estratégia-de-implementação)).

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `raio/0` | 0 | Sem arredondamento. | Tabelas full-bleed, divisores alinhados a grade. |
| `raio/4` | 4 | Micro canto. | Chips pequenos, tags. |
| `raio/8` | 8 | Padrão **componente** compacto. | Botões, inputs, células. |
| `raio/12` | 12 | Padrão **card** / bloco. | Cards, painéis, dropdowns. |
| `raio/16` | 16 | Blocos grandes, modais. | Modais, hero cards. |
| `raio/24` | 24 | Destaque visual forte. | Ilustrações em container, banners. |
| `raio/pill` | 9999 | Formato **pill** (totalmente arredondado nas pontas). | Badges, pills, barras de busca arredondadas. |

---

## 7. Sombra

**Escopo:** global.  
**Tipo:** `STRING` (valor literal de `box-shadow` para **CSS**).

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `sombra/nivel-0` | `none` | Sem sombra. | Elementos flat, listas densas. |
| `sombra/nivel-1` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Elevação leve. | Cards em repouso, linhas de lista clicável. |
| `sombra/nivel-2` | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)` | Elevação média. | Dropdowns, popovers, date pickers. |
| `sombra/nivel-3` | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)` | Elevação alta. | Modais, drawers, elementos que cobrem o conteúdo. |

> Em telas **mobile**, use a mesma escala; reduza o uso visual se a interface pedir mais flat.

---

## 8. Traço

**Escopo:** global.  
**Tipo:** `FLOAT` (px).  
**CSS:** `border-width`, `outline-width`.

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `traco/1` | 1 | Borda padrão. | Inputs, cards com contorno, divisórias. |
| `traco/2` | 2 | Borda de ênfase. | Foco visível, estados selecionados, tabelas com grade forte. |

---

## 9. Ícone

**Escopo:** global.  
**Tipo:** `FLOAT` (px).

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `icone/16` | 16 | Ícone **compacto**. | Texto inline, metadados, densidade alta. |
| `icone/20` | 20 | Ícone **intermediário**. | Listas, botões pequenos. |
| `icone/24` | 24 | Ícone **padrão**. | Navegação, botões padrão, ações em barra. |
| `alvo/minimo` | 40 | Área mínima tocável / clicável. | Dimensão mínima do alvo (largura e altura ≥ 40 px); ícone pode ser menor com padding. |

---

## 10. Camada (z-index)

**Escopo:** global.  
**Tipo:** `FLOAT` (inteiro recomendado).

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `camada/0` | 0 | Base da página. | Fluxo normal do documento. |
| `camada/10` | 10 | Conteúdo levemente elevado. | Cards que sobrepõem levemente (uso raro). |
| `camada/20` | 20 | Sticky / fixo secundário. | Cabeçalhos sticky, sub-barras. |
| `camada/30` | 30 | Dropdowns e popovers. | Menus, autocomplete, tooltips (se não forem 40). |
| `camada/40` | 40 | Modais e overlays de tela. | Dialog, slide-over. |
| `camada/50` | 50 | Sempre no topo. | Toasts globais, banners críticos. |

> Evite números arbitrários entre os degraus; se precisar de um nível novo, documente aqui e no Figma.

---

## 11. Opacidade

**Escopo:** global (Web + Mobile).  
**Tipo:** `FLOAT` entre **0** e **1** (mesma escala que `opacity` no CSS e canal alpha em `rgba`).

Use para **padronizar** o quanto o fundo escurece atrás de modais e painéis, e para **estado desativado** sem inventar valores soltos no código.

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `opacidade/overlay/modal` | 0,5 | Scrim **padrão** atrás de modais e diálogos. | Camada semitransparente sobre a página; combine com `cor/neutro/preto` em `rgba(0,0,0, α)`. |
| `opacidade/overlay/lev` | 0,4 | Overlay **mais claro**. | Drawers, painéis laterais ou quando o fundo não deve ficar muito escuro. |
| `opacidade/overlay/forte` | 0,72 | Overlay **mais escuro**. | Quando o foco no conteúdo do modal deve ser mais forte. |
| `opacidade/estado/desativado` | 0,5 | Conteúdo ou controle **desativado**. | Aplicar em `opacity` do bloco inteiro ou conforme padrão do componente. |

> **Implementação:** no CSS, o token costuma virar variável `--opacidade-overlay-modal` e ser usada como último argumento de `rgba(0, 0, 0, var(--…))` no fundo do overlay, ou equivalente no tema. Não confunda com opacidade do **próprio** modal (geralmente 1); só o **scrim** usa esses valores.

---

## 12. Web · Espaçamento

**Escopo:** somente **Web**.  
**Tipo:** `FLOAT` (px).  
**Uso:** `padding`, `margin`, `gap`, espaçamento interno de layout. **No frontend:** converter valores para **`rem`** (`1rem = 16px`), exceto `0` — ver [§2](#2-unidades-e-estratégia-de-implementação).

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `espaco/web/nenhum` | 0 | Ausência de espaço. | Reset, alinhamento a grade. |
| `espaco/web/tamanho-4` | 4 | Micro espaço. | Ícone + texto muito próximos, ajustes finos. |
| `espaco/web/tamanho-8` | 8 | Espaço **xs**. | Pilhas compactas, padding interno de chip. |
| `espaco/web/tamanho-12` | 12 | Espaço **sm**. | Entre linhas de formulário densas. |
| `espaco/web/tamanho-16` | 16 | Espaço **md** (base comum). | Entre blocos em listas, gaps de grade. |
| `espaco/web/tamanho-24` | 24 | Espaço **lg**. | Entre seções dentro de uma página. |
| `espaco/web/tamanho-32` | 32 | Espaço **xl**. | Respiro entre grupos grandes de conteúdo. |
| `espaco/web/tamanho-40` | 40 | Espaço **2xl**. | Hero interno, blocos destacados. |
| `espaco/web/tamanho-48` | 48 | Espaço **3xl**. | Separação forte entre regiões da tela. |
| `espaco/web/barra-lateral` | 256 | Largura da **sidebar** de navegação. | Coluna fixa de menu (layout nutricionista / admin). |
| `espaco/web/cabecalho-altura` | 32 | Padding vertical típico do **header** (referência de layout). | Área do top bar / heading de página. |
| `espaco/web/cabecalho-largura` | 40 | Padding horizontal típico do **header**. | Margens laterais do cabeçalho em telas largas. |

---

## 13. Web · Layout

**Escopo:** somente **Web**.  
**Tipo:** `FLOAT` (px).

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `layout/largura-maxima` | 1280 | Largura máxima do **conteúdo** central. | Container principal; evita linhas longas em ultrawide. |
| `layout/gutter` | 24 | Margem entre colunas / respiro lateral da grade. | Grids multi-coluna, espaço entre cards na mesma linha. |
| `breakpoint/640` | 640 | Largura mínima comum **sm** (referência). | Media queries `min-width` (ajustar ao stack técnico). |
| `breakpoint/768` | 768 | **Tablet** portrait / breakpoint `md`. | Layout intermediário, sidebar colapsável. |
| `breakpoint/1024` | 1024 | **Desktop** pequeno / `lg`. | Sidebar fixa, duas colunas confortáveis. |
| `breakpoint/1280` | 1280 | **Desktop** largo / alinhado à largura máxima. | Conteúdo alinhado a `layout/largura-maxima`. |

> Os breakpoints são **referências numéricas**; o time de front deve alinhar com o framework (Tailwind, CSS puro, etc.) e documentar qual token corresponde a cada `min-width`.

---

## 14. Mobile · Espaçamento

**Escopo:** somente **Mobile** (apps / layouts estreitos).  
**Tipo:** `FLOAT` (px).  
**Uso:** `padding`, `margin`, `gap`; alturas de referência para **app bar** e **barra inferior**. **No frontend:** mesma regra de conversão **`px` → `rem`** que no web — ver [§2](#2-unidades-e-estratégia-de-implementação).

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `espaco/mobile/nenhum` | 0 | Sem espaçamento. | Reset, alinhamento a grade. |
| `espaco/mobile/tamanho-4` | 4 | Micro espaço. | Ajustes finos entre ícone e rótulo. |
| `espaco/mobile/tamanho-8` | 8 | Espaço xs. | Pilhas compactas, chips. |
| `espaco/mobile/tamanho-12` | 12 | Espaço sm. | Listas densas, células. |
| `espaco/mobile/tamanho-16` | 16 | Espaço md (base comum). | Entre blocos em listas e formulários. |
| `espaco/mobile/tamanho-20` | 20 | Entre md e lg. | Conforto em toque entre linhas. |
| `espaco/mobile/tamanho-24` | 24 | Espaço lg. | Entre seções dentro da tela. |
| `espaco/mobile/tamanho-32` | 32 | Espaço xl. | Grupos maiores de conteúdo. |
| `espaco/mobile/tamanho-40` | 40 | Espaço 2xl. | Destaques e respiro forte. |
| `espaco/mobile/tamanho-48` | 48 | Espaço 3xl. | Separação entre regiões principais. |
| `espaco/mobile/cabecalho-altura` | 56 | Altura de referência da **barra superior** (app bar). | Alinhar frames e componentes de topo. |
| `espaco/mobile/navegacao-inferior` | 56 | Altura de referência da **barra inferior** (tabs). | Área da navegação por abas. |

> Inclui **`tamanho-20`**, que não existe na escala web, para ritmo típico de telas tocáveis. Ajuste valores no Figma se o time padronizar outra altura de header ou tab bar.

---

## 15. Mobile · Layout

**Escopo:** somente **Mobile**.  
**Tipo:** `FLOAT` (px), exceto onde o uso for **referência** (artboard).

| Token | Valor | Descrição | Uso sugerido |
|-------|-------|-----------|----------------|
| `layout/margem-horizontal` | 16 | Padding horizontal **padrão** do conteúdo. | Margens laterais da tela em listas e formulários. |
| `layout/margem-horizontal-grande` | 20 | Padding horizontal **maior**. | Telas largas ou quando o design pedir mais respiro lateral. |
| `layout/largura-maxima-artboard` | 428 | Largura máxima de **artboard** (referência). | Frames no Figma; no código, `max-width` ou limite de conteúdo em tablets pequenos. |
| `layout/inset-area-segura` | 34 | Inset inferior de **área segura** (referência). | Home indicator (iPhone); use `env(safe-area-inset-bottom)` no app real e este token como alinhamento visual no design. |

> Tokens de **layout** mobile convivem com os de **Web · Layout** em coleções diferentes; nomes podem repetir o prefixo `layout/` porque pertencem a coleções distintas no Figma — no **código**, prefixe variáveis CSS (ex.: `--mobile-layout-margem-horizontal`) para evitar colisão com o web.

---

## 16. Manutenção e governança

1. **Fonte da verdade:** arquivo Figma + este documento; alterações de token devem refletir nos dois.
2. **Unidades no código:** ao gerar CSS (ou tema), aplicar a política de **`rem` vs `px`** definida em [§2](#2-unidades-e-estratégia-de-implementação); não alterar valores no Figma só para “forçar rem”.
3. **Conventional Commits:** exemplos — `docs(figma): atualizar sombra nivel-2`, `fix(tokens): corrigir alias do branco`.
4. **Alias:** novos aliases devem ser preferidos a hex duplicado para cores idênticas.
5. **Mobile vs web:** não duplicar **cores** nem tokens globais; só **Mobile · Espaçamento** e **Mobile · Layout** são específicos de mobile, além de **Web ·** * para web.

---

## Referência rápida — mapa de coleções

| Coleção | Tokens (quantidade aprox.) |
|---------|----------------------------|
| Paleta | 15 |
| Tipografia | 24 |
| Raio | 7 |
| Sombra | 4 |
| Traço | 2 |
| Ícone | 4 |
| Camada | 6 |
| Opacidade | 4 |
| Web · Espaçamento | 12 |
| Web · Layout | 6 |
| Mobile · Espaçamento | 12 |
| Mobile · Layout | 4 |

*Quantidades podem mudar se variáveis forem adicionadas ou removidas no Figma.*
