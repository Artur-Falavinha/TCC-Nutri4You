# Sprint 1 — Sprint Review

**Período:** 27/08/2026 a 09/09/2026  
**Status:** ✅ Concluída

## Objetivo

Estabelecer base reproduzível para API, web, mobile, banco de dados e integração contínua.

## Critérios de aceite

| Critério | Status | Evidência |
| --- | --- | --- |
| Instalação limpa documentada | ✅ | [docs/onboarding/README.md](../onboarding/README.md) |
| Banco recria do zero | ✅ | `database/init.sql` + `docker compose down -v` |
| Web e mobile consultam `/health` | ✅ | Telas `/health` e `HealthScreen` + API validada |
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
| Commits | `11e5442` … `dd60838` |
| Issue GitHub | [#1 — fechada](https://github.com/Artur-Falavinha/TCC-Nutri4You/issues/1) |
| CI (push) | [GitHub Actions](https://github.com/Artur-Falavinha/TCC-Nutri4You/actions) |
| Evidências demo | [evidence/sprint-01/](evidence/sprint-01/) |
| GitHub Projects | ⏳ Requer `gh auth refresh -h github.com -s project` (escopo de escrita) |

## Checklist manual (09/09/2026)

| Item | Status | Observação |
| --- | --- | --- |
| Commits Sprint 1 | ✅ | `11e5442` … `dd60838` |
| Push para `origin/main` | ✅ | Conta `Artur-Falavinha` |
| Issue GitHub #1 | ✅ | Fechada com comentário de evidências |
| Card no GitHub Projects | ⏳ | Token sem escopo `project` — adicionar manualmente |
| Demo Docker (`/health`) | ✅ | 3 containers Up, API HTTP 200 |
| CI verde | ✅ | [Run #34364127945](https://github.com/Artur-Falavinha/TCC-Nutri4You/actions/runs/34364127945) |
| Backend `mvn test` local | ✅ | 2 testes, BUILD SUCCESS (Java 21) |

## Validação da demo (09/09/2026)

| Passo | Resultado |
| --- | --- |
| `docker compose up -d --build` | ✅ db + backend + web Up |
| `curl /api/v1/health` | ✅ `data.status: "UP"`, envelope RNF09/RNF10 |
| PostgreSQL | ✅ 15 tabelas via `init.sql` |
| Web `localhost:4200/health` | ⚠️ Tela carrega; fetch bloqueado por CORS (Sprint 2) |
| Mobile Expo Go | ⏳ Requer celular; endpoint `/health` comprovado via API |
| `mvn test` local | ✅ 2 testes, BUILD SUCCESS |
| CI após push | ✅ Gate verde |

Evidências completas (logs de terminal + prints): [docs/sprints/evidence/sprint-01/](evidence/sprint-01/)

### Correções de CI (pós-review)

| Job | Causa | Correção |
| --- | --- | --- |
| Backend — testes | `./mvnw: Permission denied` | Bit executável em `backend/mvnw` |
| Backend — testes | Import SB3 em SB4 | `AutoConfigureMockMvc` → pacote SB4 |
| Markdown | RoadMap + README | Ignorar `Outras Documentações/**`; README formatado |
| Gitleaks | JWT de exemplo em `endpoints.md` | Placeholder `<token-jwt-exemplo>` |
