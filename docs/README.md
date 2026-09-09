# Documentação

Índice central da documentação do projeto Nutri4You (TCC — I Need a Nutri).

## Estrutura

```text
docs/
├── README.md                 ← você está aqui
├── api/                      ← API REST (Spring Boot)
│   ├── README.md
│   ├── endpoints.md
│   └── autenticacao.md
├── arquitetura/              ← decisões, diagramas e ADRs
│   ├── README.md
│   ├── visao-geral.md
│   ├── banco-de-dados.md
│   └── adr/
├── clientes/                 ← Web (Angular) e Mobile (Expo)
│   └── README.md
├── figma/                    ← Figma (tokens, guias)
│   ├── README.md
│   └── tokens - documentação/
├── onboarding/               ← setup do ambiente local
├── sprints/                  ← evidências de Sprint Review
│   └── sprint-01-review.md
└── glossario/                ← termos técnicos (nutrição, anamnese)
```

## Conteúdo por área

| Tópico | Descrição |
| --- | --- |
| [API](api/README.md) | Endpoints, autenticação JWT, convenções e variáveis de ambiente |
| [Endpoints](api/endpoints.md) | Referência detalhada: health, login, autocadastro |
| [Autenticação](api/autenticacao.md) | Fluxo JWT, roles, rotas públicas/protegidas |
| [Arquitetura](arquitetura/README.md) | Visão geral do monorepo, stack e estado da Sprint 1 |
| [Visão geral](arquitetura/visao-geral.md) | Camadas backend/web/mobile, Docker, fluxo de dados |
| [Banco de dados](arquitetura/banco-de-dados.md) | Schema PostgreSQL, entidades JPA, seed |
| [ADRs](arquitetura/adr/README.md) | Decisões: monorepo/Docker, JWT, schema SQL |
| [Clientes](clientes/README.md) | Angular 19 e Expo 57 — estrutura, rotas, configuração |
| [Onboarding](onboarding/README.md) | Pré-requisitos, Docker Compose, mobile, CI |
| [Figma](figma/README.md) | Índice da documentação de design |
| [Tokens — documentação](figma/tokens%20-%20documentação/README.md) | Regras de tokens globais vs web |
| [Glossário](glossario/README.md) | Termos clínicos e de interface |

## Stack do projeto

| Camada | Tecnologia |
| --- | --- |
| API | Spring Boot 4.0.8, Java 21, PostgreSQL 16 |
| Web | Angular 19 |
| Mobile | Expo 57, React Native 0.86 |
| Infra local | Docker Compose |
| CI | GitHub Actions (Markdown + gitleaks) |

## Sprint 1 — escopo documentado

- Health check (`GET /api/v1/health`)
- Login JWT (`POST /api/v1/auth/login`)
- Autocadastro de paciente (`POST /api/v1/pacientes/autocadastro`)
- Clientes web e mobile com camada HTTP base
- Schema completo do banco (15 tabelas), 2 entidades JPA
