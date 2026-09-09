# PoCs — Serviços externos (Sprint 1)

Registro de viabilidade e riscos para integrações previstas nas sprints futuras. Sprint 1 exige decisão documentada, não implementação completa.

## Tabela TACO

| Item | Decisão |
| --- | --- |
| **Fonte** | Tabela TACO (UNICAMP) — base nutricional de alimentos |
| **Formato** | CSV/JSON para importação em lote na tabela `Alimento` |
| **PoC** | Seed com 5 alimentos em `database/init.sql` comprova modelo relacional |
| **Sprint alvo** | Sprint 4 — importação completa + busca paginada |
| **Riscos** | Qualidade dos dados, unidades (100g), alimentos composto vs simples, licenciamento de uso acadêmico |
| **Mitigação** | Validar amostra manualmente; normalizar para `kcal_100g`, `proteina_100g`, `carboidratos_100g` |

## Google Calendar

| Item | Decisão |
| --- | --- |
| **Uso** | Sincronizar consultas agendadas (data/hora, título genérico) — **sem dados clínicos** |
| **PoC** | OAuth 2.0 via Google Cloud Console; escopos mínimos (`calendar.events`) |
| **Sprint alvo** | Sprint 6 |
| **Riscos** | Expiração de token, fuso horário, falha externa, credenciais em dev |
| **Mitigação** | Consulta persiste no PostgreSQL primeiro; sync é best-effort com flag de pendência |

## Armazenamento de arquivos (exames)

| Item | Decisão |
| --- | --- |
| **Uso** | Upload de PDF/imagem de exames solicitados pelo nutricionista |
| **PoC** | Coluna `BYTEA` em `Exame.arquivo` suporta blob no PostgreSQL |
| **Sprint alvo** | Sprint 6 |
| **Alternativas avaliadas** | Filesystem local (dev), S3-compatible (prod) |
| **Riscos** | Tamanho máximo, tipos MIME, LGPD, backup |
| **Mitigação** | Validar tipo/tamanho na API; limitar a perfis autorizados; não armazenar em repositório Git |

## Ambiente de implantação

| Item | Decisão |
| --- | --- |
| **Desenvolvimento** | Docker Compose (postgres + backend + web) — validado |
| **Mobile** | Expo Go local; build EAS na Sprint 7 |
| **Produção (TCC)** | VM ou PaaS com PostgreSQL gerenciado; domínio `api.nutri4you.com.br` reservado |
| **PoC** | `docker compose up` reproduz stack completa; CI valida build/test |
| **Riscos** | Custo de cloud, HTTPS, secrets em produção, indisponibilidade na banca |
| **Mitigação** | Dados fictícios; plano B com demo local + gravação; variáveis via secrets do GitHub |

## Próximas ações

| Sprint | Ação |
| --- | --- |
| 2 | Serviço de e-mail (validação de conta) |
| 4 | Script de importação TACO |
| 6 | OAuth Google Calendar + upload de exames |
| 7 | Deploy de demonstração + rollback documentado |
