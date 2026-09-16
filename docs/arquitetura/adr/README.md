# Architecture Decision Records (ADRs)

Registro das decisões arquiteturais relevantes do Nutri4You. Cada ADR documenta o contexto, a decisão tomada e as consequências.

## Formato

Cada ADR segue a estrutura:

1. **Status** — Proposto, Aceito, Substituído ou Depreciado
2. **Contexto** — Problema ou necessidade
3. **Decisão** — O que foi escolhido
4. **Consequências** — Impactos positivos e trade-offs

## Índice

| ADR | Título | Status |
| --- | --- | --- |
| [001](001-monorepo-docker.md) | Monorepo com Docker Compose para desenvolvimento | Aceito |
| [002](002-autenticacao-jwt-stateless.md) | Autenticação JWT stateless com Spring Security | Aceito |
| [003](003-schema-sql-versionado.md) | Schema PostgreSQL versionado via init.sql | Aceito |
| [004](004-relacao-por-eventos-clinicos.md) | Relação paciente↔nutricionista por eventos (sem `Vinculo_Nutricional`) | Aceito |
| [005](005-relacao-clinica-recorrente.md) | Acompanhamento recorrente (`Relacao_Clinica`) + consulta avulsa | Aceito |
