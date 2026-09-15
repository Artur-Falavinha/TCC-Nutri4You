# Equipe e workflow — Nutri4You

## Integrantes

| Pessoa | Papel Sprint 2 | Conta GitHub |
| --- | --- | --- |
| Artur Lachoman Falavinha | Backend Sprint 2 + web auth + hub | `Artur-Falavinha` |
| Gabriel de Paula Brasil | Anamnese BE+FE (adiantamento Sprint 3) | `xXbrasilXx` |
| Arthur Henrique Deretti (Ready) | Mobile auth + listagem pacientes (web) | *(confirmar)* |

## Hub vs worktrees

| Local | Uso |
| --- | --- |
| `C:\Users\artur.falavinha\projetoslocal\TCC-Nutri4You` | **Hub** — `main`, docs, specs, reviews |
| `C:\Users\artur.falavinha\projetoslocal\_worktrees\TCC-Nutri4You\<branch>` | **Execução** — uma frente por worktree |

Regras:

1. Hub permanece em `main` sempre que possível.
2. Nova frente → branch a partir de `main` + worktree dedicado (`speckit-worktree`).
3. **Ao criar worktree:** copiar `specs/` do hub (inclui `specs/skills.md`) — ver [worktree-setup.md](worktree-setup.md). **Não usa git.**
4. Conta GitHub por worktree: **`Artur-Falavinha`** neste TCC.
5. `.specify/` e `specs/` são **locais** (gitignored); contratos de API vão em `docs/api/`.
6. Ao terminar a frente: PR para `main`, review, merge, remover worktree.

### Branches / worktrees Sprint 2

```text
002-sprint2-backend-auth-web    # Artur — backend/ + web/features/auth/
003-sprint2-mobile-pacientes    # Deretti — mobile/ + web/features/pacientes/
004-sprint3-anamnese            # Brasil — backend anamnese + web/features/anamnese/
```

## Sprint 2 — divisão fechada

| Integrante | Worktree | Dono de | Figma |
| --- | --- | --- | --- |
| **Artur** | `002-sprint2-backend-auth-web` | Todo `backend/` Sprint 2 *(exc. pacote anamnese)* · `web/features/auth/` · `docs/api/` | [Auth web](https://www.figma.com/design/56pR0RpOtcJSxEphHUA1Z1/TCC-I-need-a-Nutri?node-id=828-1442) |
| **Deretti** | `003-sprint2-mobile-pacientes` | `mobile/` auth · `web/features/pacientes/` listagem | [Auth mobile](https://www.figma.com/design/56pR0RpOtcJSxEphHUA1Z1/TCC-I-need-a-Nutri?node-id=119-480) |
| **Brasil** | `004-sprint3-anamnese` | `backend/` pacote anamnese · `web/features/anamnese/` | Sprint 3 (dados clínicos) |

**Issues:** [#2](https://github.com/Artur-Falavinha/TCC-Nutri4You/issues/2) backend · [#3](https://github.com/Artur-Falavinha/TCC-Nutri4You/issues/3) web auth · [#4](https://github.com/Artur-Falavinha/TCC-Nutri4You/issues/4) mobile · [#11](https://github.com/Artur-Falavinha/TCC-Nutri4You/issues/11) listagem

Ordem: PR #6 ✅ → **Artur entrega CORS + API** → Deretti e Brasil integram em paralelo.

Tasks: [specs/002-sprint2-auth/tasks.md](../../specs/002-sprint2-auth/tasks.md)

## Regras globais do projeto

1. **Não chutar regra de negócio.** Lacuna → `/grill-me` → `specs/<feature>/decisions.md`.
2. **Hub vs worktree.** Docs/specs no hub; código em branch + worktree.
3. **Contratos.** `docs/api/` versionado no git; `specs/` local (copiar na worktree — [worktree-setup.md](worktree-setup.md)).
4. **Envelope API.** RNF09/RNF10 em todos os endpoints novos.
5. **Segurança.** Sem segredo no repo; JWT e SMTP via env.
6. **CI verde antes de merge.**
7. **PR pequeno e revisado.**
8. **Skills:** mapa local `specs/skills.md` *(gitignored)* — invocar só a skill da frente ativa; toda nova spec referencia esse arquivo em `spec.md`.
9. **Conta GitHub TCC:** `Artur-Falavinha`.
10. **Decisão transversal → ADR** em `docs/arquitetura/adr/`.

## Spec Kit + grilling

```text
/grill-me → spec.md + decisions.md → plan → tasks → implement → PR
```

Nova spec: incluir seção **Skills** em `spec.md` → apontar para `specs/skills.md` (local).

## Práticas de código (monorepo)

| Frente | Stack |
| --- | --- |
| `backend/` | Spring Boot 4, Java 21, JWT, PostgreSQL |
| `web/` | Angular 19 — um módulo por feature em `features/` |
| `mobile/` | Expo 57 |

Padrões Sprint 1: envelope API, `/api/v1`, CI completo, `./mvnw test`.

## Kanban

[kanban.md](kanban.md) · [GitHub Projects #1](https://github.com/users/Artur-Falavinha/projects/1)

## Comunicação

1. Grilling → `decisions.md` no mesmo dia.
2. Arquitetura transversal → ADR.
3. Fim de sprint → `docs/sprints/sprint-XX-review.md`.

## Conta GitHub no worktree

```powershell
C:\Users\artur.falavinha\.codex\skills\speckit-worktree\scripts\set-github-account.ps1 -Account Artur-Falavinha
```
