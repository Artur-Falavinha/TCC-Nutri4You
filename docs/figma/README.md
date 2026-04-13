# Documentação — Figma

Material de referência sobre o arquivo de design e os **design tokens** do projeto.

## Arquivo no Figma

- **Projeto:** TCC I need a Nutri (ajuste o link no repositório se o arquivo mudar de dono ou nome).
- **System Design** ([frame na seção](https://www.figma.com/design/56pR0RpOtcJSxEphHUA1Z1/TCC-I-need-a-Nutri?node-id=189-522)): biblioteca em **Atomic Design** (Átomos, Moléculas, Organismos). A **sidebar web** reutiliza o componente já existente **`Aside - SideNavBar Shell`** (instância na linha de organismos), em vez de um mock duplicado. Cabeçalho mobile e modal seguem como shells de referência; outros organismos do arquivo podem ser alinhados da mesma forma. Estados (link ativo, etc.) entram como **variantes** depois; o baseline permanece **neutro**.

## Conteúdo nesta pasta

| Pasta / arquivo | Conteúdo |
|-----------------|----------|
| [tokens - documentação](tokens%20-%20documentação/README.md) | Referência **completa**: escopo, convenções, **unidades (Figma em px vs frontend em rem/px)**, **tabela por token** (valor, tipo, descrição, uso sugerido) e governança |

## No Figma

Além desta pasta no Git, existe uma **página** no arquivo chamada **`Tokens — documentação`**, com o frame **Guia de escopo (Web + Mobile)** (resumo das coleções) e o frame **Variáveis — rem vs px (referência CSS)** (tabela de cada variável: unidade no Figma vs CSS). Mantenha esses textos alinhados ao [`tokens - documentação/README.md`](tokens%20-%20documentação/README.md) quando houver mudanças nas coleções ou na política de `rem`/`px`.

## Coleções de variáveis (referência rápida)

| Escopo | Coleções |
|--------|----------|
| **Global (Web + Mobile)** | Paleta, Tipografia, Raio, Sombra, Traço, Ícone, Camada, Opacidade |
| **Somente Web** | Web · Espaçamento, Web · Layout |
| **Somente Mobile** | Mobile · Espaçamento, Mobile · Layout |

Detalhes e regras de uso estão em [tokens - documentação](tokens%20-%20documentação/README.md).
