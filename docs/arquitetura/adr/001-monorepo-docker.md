# ADR 001 — Monorepo com Docker Compose para desenvolvimento

**Status:** Aceito  
**Data:** 2026-09

## Contexto

O TCC envolve três aplicações (API, web e mobile) que compartilham contratos de API e evoluem em paralelo. Era necessário um ambiente de desenvolvimento reproduzível entre os integrantes do grupo, sem depender de instalações manuais de Java, Node.js e PostgreSQL em cada máquina.

## Decisão

Adotar um **monorepo Git** na raiz do projeto com:

- `backend/` — Spring Boot
- `web/` — Angular
- `mobile/` — Expo (fora do Docker)
- `database/init.sql` — DDL e seed
- `docker-compose.yaml` — orquestração de PostgreSQL, backend e web

Cada serviço possui `Dockerfile` com target `dev` para hot-reload (Maven wrapper + JDWP no backend; `ng serve` na web).

## Consequências

### Positivas

- Um único `docker compose up` sobe banco, API e web.
- Contratos de API e documentação ficam no mesmo repositório.
- Volumes montados permitem editar código localmente com reload automático.

### Trade-offs

- Mobile roda fora do Docker (Expo Go requer acesso à rede local e QR code).
- Build de produção ainda não está containerizado (apenas target `dev`).
- CI ainda não valida build/test das aplicações.

## Referências

- `docker-compose.yaml`
- `backend/Dockerfile`
- `web/Dockerfile`
