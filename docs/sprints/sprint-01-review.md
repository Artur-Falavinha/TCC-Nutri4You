# Sprint 1 — Sprint Review

**Período:** 27/08/2026 a 09/09/2026  
**Status:** Concluída

## Objetivo

Estabelecer base reproduzível para API, web, mobile, banco de dados e integração contínua.

## Critérios de aceite

| Critério | Status | Evidência |
| --- | --- | --- |
| Instalação limpa documentada | ✅ | [docs/onboarding/README.md](../onboarding/README.md) |
| Banco recria do zero | ✅ | `database/init.sql` + `docker compose down -v` |
| Web e mobile consultam `/health` | ✅ | Telas `/health` e `HealthScreen` |
| CI com build/lint/test | ✅ | `.github/workflows/ci.yml` |
| PoCs e riscos externos registrados | ✅ | [pocs-servicos-externos.md](../arquitetura/pocs-servicos-externos.md) |
| Envelope RNF09/RNF10 | ✅ | `ApiResponse` / `ApiErrorResponse` no backend |

## Demo — roteiro

### Fluxo obrigatório (Sprint 1)

1. `docker compose up -d --build`
2. `curl http://localhost:8080/api/v1/health` → JSON com `data.status: "UP"`
3. Web: `http://localhost:4200/health` → status da API
4. Mobile: Expo Go → tela **Status da API**
5. CI verde no GitHub Actions

### Bônus (Sprint 2 adiantado)

- `POST /api/v1/auth/login` com credenciais válidas
- `POST /api/v1/pacientes/autocadastro` cria paciente de teste

JWT nos clientes web/mobile permanece para Sprint 2.

## Entregáveis técnicos

- Monorepo: `backend/`, `web/`, `mobile/`, `database/`
- API `/api/v1` com health, login e autocadastro
- PostgreSQL 16 via Docker
- Angular 19 + Expo 57 com clientes HTTP
- ADRs: monorepo, JWT, schema SQL
- Documentação: `docs/api/`, `docs/arquitetura/`, `docs/clientes/`

## Pendências transferidas

| Item | Sprint |
| --- | --- |
| JWT nos clientes | 2 |
| CORS configurado | 2 |
| OpenAPI/Swagger | 2+ |
| Flyway/Liquibase | 2+ |

## Registro no quadro

| Item | Link |
| --- | --- |
| Commit | `11e5442` — feat: fechar Sprint 1 com envelope API, CI e documentacao |
| Issue GitHub | [Sprint 1 — Review concluída](https://github.com/Artur-Falavinha/TCC-Nutri4You/issues/1) |
| CI (push) | [GitHub Actions](https://github.com/Artur-Falavinha/TCC-Nutri4You/actions) |

Adicionar esta issue ao [GitHub Projects](https://github.com/users/Artur-Falavinha/projects/1) manualmente (token local sem escopo `read:project`).

## Validação da demo (09/09/2026)

| Passo | Resultado |
| --- | --- |
| `docker compose up` | Pendente — Docker Desktop não estava em execução no ambiente do commit |
| CI após push | Verificar em GitHub Actions |
| Web/mobile `/health` | Validar localmente com Docker ativo |
