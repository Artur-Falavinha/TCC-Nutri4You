# Design tokens — documentação

Este documento descreve o **escopo de uso** das coleções de variáveis no Figma e no produto (Web e Mobile).

**Última atualização:** alinhado ao guia da página `Tokens — documentação` no arquivo Figma.

---

## Global (Web + Mobile)

Use estas coleções em **todas as plataformas** (web e mobile).

| Coleção | Conteúdo |
|---------|-----------|
| **Paleta** | Cores: marca, texto, superfície, borda, neutros, semântica. |
| **Tipografia** | Família (`Manrope`), pesos, tamanhos, entrelinha, tracking. |
| **Raio** | Cantos (`border-radius`), incluindo `raio/pill`. |
| **Sombra** | Valores de `box-shadow` em **texto** (string) para uso no CSS. |
| **Traço** | Espessura de borda em px. |
| **Ícone** | Tamanhos de ícone e **alvo mínimo** de toque. |
| **Camada** | Escala de **z-index** (ordem de sobreposição). |

---

## Somente Web

| Coleção | Conteúdo |
|---------|-----------|
| **Web · Espaçamento** | Escala de espaçamento para **layout web** (nomes `espaco/web/…`). |
| **Web · Layout** | Largura máxima, gutter e **breakpoints** de layout desktop. |

No **mobile**, quando existir escala própria, criar coleção separada (ex.: **Mobile · Espaçamento**) e regras de layout específicas — **sem** duplicar a paleta de cores.

---

## Observações

1. **Dark mode:** não há; cada token tem um único modo.
2. **Paleta:** é **única** — o mobile reutiliza as **mesmas cores** do web.
3. **Prefixo `Web ·`:** indica coleção **exclusiva de web**; nomes `espaco/web/…` reforçam uso em layout web.
4. **Neutros:** `cor/neutro/branco` é a referência; `cor/superficie/cartao` e `cor/texto/sobre-marca-primaria` podem apontar para esse token (alias no Figma).

---

## Manutenção

- Ao criar novas coleções, atualize **este README**, a página **Tokens — documentação** no Figma e o [`docs/figma/README.md`](../README.md).
- Commits que alterarem tokens devem mencionar o que mudou (ex.: “tokens: novos raios na coleção Raio”).
