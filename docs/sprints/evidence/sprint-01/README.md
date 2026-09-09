# Sprint 1 — Evidências de validação

**Data:** 09/09/2026  
**Ambiente:** Windows, Docker Desktop, Java 21 Temurin

## Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `01-docker-compose-ps.txt` | Containers db, backend e web ativos |
| `02-curl-health-api.txt` | `GET /api/v1/health` → envelope JSON, HTTP 200 |
| `03-web-health-curl.txt` | Web Angular respondendo na porta 4200 |
| `04-mvn-test.txt` | `mvn test` local — 2 testes, BUILD SUCCESS |
| `05-ci-latest.txt` | Último run do GitHub Actions |
| `06-web-health-page.png` | Tela web `/health` (CORS bloqueia fetch no browser — Sprint 2) |
| `07-integracao-api-db.txt` | Invoke-RestMethod + contagem de tabelas PostgreSQL |
| `08-terminal-summary.txt` | Resumo da validação em terminal |
| `09-desktop-screenshot.png` | Captura de tela do ambiente |
| `10-validation-report.png` | Relatório visual da demo |
| `validation-report.html` | Relatório HTML (abrir no browser) |

## Comandos reproduzíveis

```powershell
docker compose up -d --build
docker compose ps
curl.exe -s http://localhost:8080/api/v1/health
.\scripts\run-backend-tests.ps1
```

## Observações

- **Web no browser:** a tela `/health` carrega, mas o fetch para a API falha por falta de CORS (previsto para Sprint 2). A API foi comprovada via `curl` e `Invoke-RestMethod`.
- **Mobile:** `HealthScreen` usa o mesmo endpoint `/health`; validação física requer Expo Go + mesma rede Wi-Fi.
