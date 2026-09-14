# Sprint 2 — Alterações de escopo (Q11)

Checklist de arquivos impactados pela remoção de `Vinculo_Nutricional` e adoção de **relação por eventos clínicos**.

**Decisão:** [ADR 004](../arquitetura/adr/004-relacao-por-eventos-clinicos.md) · [decisions.md](../../specs/002-sprint2-auth/decisions.md)

## Código / schema

| Arquivo | Status | O que mudou |
| --- | --- | --- |
| `database/init.sql` | ✅ Atualizado | Removida tabela `Vinculo_Nutricional`; seed com `Consulta` demo |
| Backend Java | ⏳ Sprint 2 | Autorização por evento (Sprint 3); merge `rotas-login` |
| Web / Mobile | ⏳ Sprint 2 | Gestão sem “inativar conta”; listagem por evento quando existir consulta |

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
| `docs/arquitetura/adr/README.md` | ✅ |
| `docs/arquitetura/README.md` | ✅ |
| `docs/README.md` | ✅ |
| `Outras Documentações/RoadMap TCC.md` | ✅ notas de desvio |

## Documentação histórica (não reescrever)

Evidências da Sprint 1 registram **15 tabelas** — correto **na data da demo**. Schema passou a **14 tabelas** a partir da Sprint 2.

| Arquivo | Tratamento |
| --- | --- |
| `docs/sprints/sprint-01-review.md` | Nota de rodapé |
| `docs/sprints/evidence/sprint-01/*` | Mantido como evidência histórica |

## Ainda depende de implementação

- `Outras Documentações/` PDFs e artigo LaTeX — atualizar manualmente se citarem vínculo ou 15 tabelas.
- Especificação técnica PDF externa — alinhar com orientador.
- Figma / protótipos — revisar telas de “inativar paciente” se existirem.

## Desvio RoadMap (texto para orientador)

> “Inativar/reativar paciente” passa a significar encerrar **relação clínica** (consulta concluída, plano expirado), não bloquear login. Autorização usa **eventos clínicos** (consulta, plano, anamnese), não tabela de vínculo.
