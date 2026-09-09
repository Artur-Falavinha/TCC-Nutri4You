# API — Nutri4You

Documentação da API REST do backend Spring Boot. Base URL em desenvolvimento:

```text
http://localhost:8080/api/v1
```

## Stack

| Tecnologia | Versão / detalhe |
| --- | --- |
| Java | 21 |
| Spring Boot | 4.0.8 |
| Spring Security | JWT stateless (Auth0 java-jwt 4.4.0) |
| Banco de dados | PostgreSQL 16 |
| ORM | Spring Data JPA (`ddl-auto=none`) |

## Índice

| Documento | Conteúdo |
| --- | --- |
| [Endpoints](endpoints.md) | Referência de rotas, payloads e respostas |
| [Autenticação](autenticacao.md) | Fluxo JWT, roles e rotas públicas/protegidas |

## Convenções

### Prefixo de versão

Todos os endpoints expostos pelo backend usam o prefixo `/api/v1`.

### Formato de resposta (RNF09/RNF10)

**Sucesso:**

```json
{
  "data": { },
  "message": "Mensagem opcional",
  "timestamp": "2026-09-09T14:00:00Z"
}
```

**Erro** (via `@RestControllerAdvice`):

```json
{
  "status": 400,
  "error": "REQUISICAO_INVALIDA",
  "message": "Descrição do erro",
  "path": "/api/v1/pacientes/autocadastro",
  "timestamp": "2026-09-09T14:00:00Z"
}
```

Os clientes web e mobile desembrulham automaticamente o campo `data`.

### Autenticação

Rotas protegidas exigem o header:

```http
Authorization: Bearer <token>
```

Detalhes completos em [autenticacao.md](autenticacao.md).

### Códigos HTTP usados

| Código | Uso |
| --- | --- |
| `200` | Sucesso (login, health check) |
| `201` | Recurso criado (autocadastro de paciente) |
| `400` | Validação de negócio (e-mail duplicado, campos obrigatórios) |
| `401` | Credenciais inválidas no login |
| `403` | Token ausente ou inválido em rota protegida |

### Variáveis de ambiente (backend)

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `JWT_SECRET` | `dev-only-change-this-secret-nutri4you` | Segredo HMAC256 do JWT |
| `JWT_EXPIRATION_HOURS` | `2` | Validade do token em horas |
| `SPRING_DATASOURCE_URL` | — | JDBC URL do PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | — | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | — | Senha do banco |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `none` | Schema gerenciado via `database/init.sql` |

## Endpoints disponíveis (Sprint 1)

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | Pública | Health check da API |
| `POST` | `/auth/login` | Pública | Login com e-mail e senha |
| `POST` | `/pacientes/autocadastro` | Pública | Cadastro de paciente |

Referência completa com exemplos em [endpoints.md](endpoints.md).

## Dados de teste (seed)

O script `database/init.sql` popula o banco com usuários mock:

| Tipo | E-mail | Senha (seed) |
| --- | --- | --- |
| Nutricionista | `nutri@nutri4you.com` | Hash BCrypt no SQL |
| Paciente | `arthur@email.com` | Hash BCrypt no SQL |
| Paciente | `artur@email.com` | Hash BCrypt no SQL |

> **Nota:** As senhas dos pacientes seed usam placeholder `$2a$10$ExemploDeHashBcrypt` — podem não funcionar para login até serem substituídas por hashes BCrypt válidos. Use o endpoint de autocadastro para criar pacientes testáveis.

## Lacunas conhecidas (Sprint 1)

- CORS não configurado no backend.
- JWT ainda não é enviado pelos clientes web e mobile.
- OpenAPI/Swagger ainda não gerado (skill `spring-boot-openapi-documentation` disponível).
