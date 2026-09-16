# Sprint 2 — Alterações de escopo (Q11 + Round 5)

Checklist de arquivos impactados pela remoção de `Vinculo_Nutricional`, adoção de **eventos clínicos** e **`Relacao_Clinica`** (recorrente).

**Decisões:** [ADR 004](../arquitetura/adr/004-relacao-por-eventos-clinicos.md) · [ADR 005](../arquitetura/adr/005-relacao-clinica-recorrente.md) · [decisions.md](../../specs/002-sprint2-auth/decisions.md)

## Código / schema

| Arquivo | Status | O que mudou |
| --- | --- | --- |
| `database/init.sql` | ⏳ Sprint 2 | + `Relacao_Clinica`, `Token_Email`, `email_confirmado`; seed `Consulta` demo |
| Backend Java | ⏳ Sprint 2 | Vincular/desvincular; listagem Q16; e-mail Q19–Q20; remover soft delete |
| Web / Mobile | ⏳ Sprint 2 | Gestão sem criar conta; desvincular (nutri web + paciente mobile) |

**Ação local:** recriar banco após pull — `docker compose down -v && docker compose up -d --build`

## Documentação atualizada

| Arquivo | Status |
| --- | --- |
| `specs/002-sprint2-auth/spec.md` | ✅ |
| `specs/002-sprint2-auth/decisions.md` | ✅ |
| `docs/arquitetura/modelo-relacao-paciente-nutricionista.md` | ✅ |
| `docs/arquitetura/pesquisa-mercado-relacao-paciente-nutricionista.md` | ✅ |
| `docs/arquitetura/banco-de-dados.md` | ✅ |
| `docs/arquitetura/adr/003-schema-sql-versionado.md` | ✅ |
| `docs/arquitetura/adr/004-relacao-por-eventos-clinicos.md` | ✅ |
| `docs/arquitetura/adr/005-relacao-clinica-recorrente.md` | ✅ |
| `docs/arquitetura/adr/README.md` | ✅ |
| `docs/arquitetura/README.md` | ✅ |
| `docs/README.md` | ✅ |
| `Outras Documentações/RoadMap TCC.md` | ✅ notas de desvio |

## Documentação histórica (não reescrever)

Evidências da Sprint 1 registram **15 tabelas** — correto **na data da demo**. Schema passou a **14 tabelas** após Q11; **15 tabelas** novamente com `Relacao_Clinica` + `Token_Email` (Round 5).

| Arquivo | Tratamento |
| --- | --- |
| `docs/sprints/sprint-01-review.md` | Nota de rodapé |
| `docs/sprints/evidence/sprint-01/*` | Mantido como evidência histórica |

## Ainda depende de implementação

- `Outras Documentações/` PDFs e artigo LaTeX — atualizar manualmente se citarem vínculo ou 15 tabelas.
- Especificação técnica PDF externa — alinhar com orientador.
- Figma / protótipos — revisar telas de “inativar paciente” se existirem.

## Desvio RoadMap (texto para orientador)

> “Inativar/reativar paciente” passa a significar encerrar **relação clínica recorrente** (`Relacao_Clinica`) ou concluir consulta/plano — **não** bloquear login. Consultas avulsas coexistem com pacientes recorrentes. Conta nasce sempre por autocadastro.
