# ADR 005 — Relação clínica recorrente (`Relacao_Clinica`)

**Status:** Aceito  
**Data:** 2026-09-14  
**Substitui parcialmente:** interpretação literal de Q11 (“zero entidade de vínculo”)

## Contexto

Q11 removeu `Vinculo_Nutricional` porque associava “inativar paciente” a bloqueio de conta. No Round 5 (Q16–Q18), a equipe precisou de:

- **Consultas avulsas** (só evento `Consulta`).
- **Pacientes recorrentes** (painel estável do nutricionista).
- **Desvincular** por nutricionista ou paciente, sem apagar conta.

## Decisão

Introduzir tabela `Relacao_Clinica` para acompanhamento **recorrente explícito**, separada de:

- `Consulta` (evento pontual ou dentro de acompanhamento).
- Conta `Paciente` (nunca inativada pelo nutricionista).

**Não** recriar `Vinculo_Nutricional`. Diferenças:

| Antigo `Vinculo_Nutricional` | Novo `Relacao_Clinica` |
| --- | --- |
| Implicava “meu paciente” único | Vários nutricionistas recorrentes permitidos |
| “Inativar” bloqueava uso | Desvincular só encerra relação recorrente |
| Nutri podia “cadastrar” paciente | Paciente nasce por **autocadastro** (Sprint 2) |

## Consequências

### Positivas

- Modelo de produto claro: avulsa vs recorrente.
- Desvincular documentado com endpoints distintos por ator.
- Listagem do nutricionista = união relação ativa + consultas.

### Trade-offs

- +1 tabela (15 tabelas totais).
- Q11 e docs históricos precisam referenciar este ADR.
- Sprint 2 implementa API de vincular/desvincular; UI mobile de desvincular pode ser stretch (Deretti).

## Referências

- [modelo-relacao-paciente-nutricionista.md](../modelo-relacao-paciente-nutricionista.md)
- [decisions.md Q16–Q18](../../specs/002-sprint2-auth/decisions.md)
