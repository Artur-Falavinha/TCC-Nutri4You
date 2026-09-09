# ADR 003 — Schema PostgreSQL versionado via init.sql

**Status:** Aceito  
**Data:** 2026-09

## Contexto

O domínio clínico do Nutri4You envolve múltiplas entidades (anamnese, consultas, antropometria, plano alimentar, consumo diário). Era necessário definir o modelo de dados completo desde cedo, mesmo que nem todas as entidades tenham endpoints na Sprint 1.

## Decisão

Manter o schema completo em um único arquivo SQL versionado:

- `database/init.sql` — DDL de 15 tabelas + dados seed.
- Montado no container PostgreSQL via `/docker-entrypoint-initdb.d/`.
- Spring JPA com `ddl-auto=none` — Hibernate não altera o schema.
- Entidades JPA criadas incrementalmente conforme endpoints são implementados.

## Consequências

### Positivas

- Modelo de dados completo documentado e versionado no Git.
- Seed com dados mock acelera desenvolvimento e testes manuais.
- Separação clara entre schema (SQL) e mapeamento (JPA).

### Trade-offs

- 13 tabelas existem no banco sem entidade JPA correspondente (Sprint 1).
- Alterações de schema exigem recriar o volume Docker ou migração manual.
- Flyway/Liquibase ainda não adotados — evolução incremental do schema é manual.

## Referências

- `database/init.sql`
- [docs/arquitetura/banco-de-dados.md](../banco-de-dados.md)
