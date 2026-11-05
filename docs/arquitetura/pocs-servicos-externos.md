# PoCs — Serviços externos (Sprint 1)

Registro de viabilidade e riscos para integrações previstas nas sprints futuras. Sprint 1 exige decisão documentada, não implementação completa.

## Tabela TACO

| Item | Decisão |
| --- | --- |
| **Fonte** | Tabela TACO (UNICAMP) — base nutricional de alimentos |
| **Formato** | CSV/JSON para importação em lote na tabela `Alimento` |
| **Implementação** | V13 importa 597 alimentos da planilha oficial; `scripts/importar-taco.py` gera e confere a carga |
| **Busca** | Paginada por nome/preparo, com normalização de acentos e pontuação |
| **Riscos** | Qualidade dos dados, unidades (100g), alimentos composto vs simples, licenciamento de uso acadêmico |
| **Mitigação** | Validar amostra manualmente; normalizar para `kcal_100g`, `proteina_100g`, `carboidratos_100g` |

## Google Calendar

| Item | Decisão |
| --- | --- |
| **Uso** | Sincronizar consultas agendadas (data/hora, título genérico) — **sem dados clínicos** |
| **Implementação** | Link de criação de evento preenchido no cliente mobile, sem OAuth ou acesso à conta |
| **Sprint alvo** | Sprint 6 |
| **Riscos** | Evento externo não acompanha reagendamento ou cancelamento automaticamente |
| **Mitigação** | Aplicativo lembra o paciente de atualizar ou remover manualmente o evento |

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
| 6 | Upload de exames; avaliar OAuth Google Calendar apenas se sincronização automática for necessária |
| 7 | Deploy de demonstração + rollback documentado |
