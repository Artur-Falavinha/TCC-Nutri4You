# ADR 004 — Relação paciente ↔ nutricionista por eventos clínicos

**Status:** Aceito  
**Data:** 13/09/2026  
**Grilling:** Q11 — [specs/002-sprint2-auth/decisions.md](../../../specs/002-sprint2-auth/decisions.md)

## Contexto

O DER original incluía `Vinculo_Nutricional` como relação contínua paciente–nutricionista. Na definição de escopo da Sprint 2, a equipe identificou problemas:

- Paciente poderia ficar preso se dependesse do nutricionista encerrar vínculo.
- Risco de nutricionista inativar conta do paciente de forma unilateral.
- Mercado mistura relação contínua (consultório) e relação por consulta (marketplace/clínica).

Alternativas consideradas: vínculo fixo (RoadMap literal), nutri de referência opcional, ou relação derivada apenas de eventos.

## Decisão

1. **Remover** a tabela `Vinculo_Nutricional` de `database/init.sql`.
2. Relação clínica **derivada** de eventos que já ligam `id_paciente` e `id_nutricionista`: `Consulta`, `Plano_Alimentar` (via consulta), anamnese, antropometria, exames, etc.
3. **Sem** nutri de referência.
4. Nutricionista **não** inativa login do paciente; autorização por participação em evento (403 se não houver relação clínica com aquele paciente).
5. Seed de desenvolvimento: `Consulta` demo substitui inserts em `Vinculo_Nutricional`.

## Consequências

**Positivas**

- Modelo alinhado a consulta + escopo por profissional (LGPD: mínimo necessário).
- Paciente livre para consultar outros nutricionistas sem “desvincular”.
- Schema mais simples (14 tabelas).

**Trade-offs**

- RoadMap fala em “vínculo nutricional” e “inativar/reativar paciente” — reinterpretar com orientador.
- Sprint 3: critério “403 sem vínculo” vira “403 sem evento clínico com o nutricionista logado”.
- Gestão Sprint 2: listagem MVP até agenda (Sprint 6) criar consultas reais.

## Referências

- [modelo-relacao-paciente-nutricionista.md](../modelo-relacao-paciente-nutricionista.md)
- [pesquisa-mercado-relacao-paciente-nutricionista.md](../pesquisa-mercado-relacao-paciente-nutricionista.md)
- [003-schema-sql-versionado.md](003-schema-sql-versionado.md)
