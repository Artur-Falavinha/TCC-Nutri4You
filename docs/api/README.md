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
| [Autenticação](autenticacao.md) | Fluxo JWT, roles, CORS e rotas públicas/protegidas |

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

### CORS (Sprint 2)

Origens permitidas por padrão:

- `http://localhost:4200` (Angular dev)
- `http://127.0.0.1:4200`

Configurável via `APP_CORS_ALLOWED_ORIGINS` (lista separada por vírgula).  
Apps mobile nativos (Expo Go) não passam por CORS de browser.

### Códigos HTTP usados

| Código | Uso |
| --- | --- |
| `200` | Sucesso |
| `201` | Recurso criado |
| `400` | Validação de negócio |
| `401` | Credenciais inválidas no login |
| `403` | Token ausente/inválido ou role insuficiente |
| `404` | Recurso não encontrado |

### Variáveis de ambiente (backend)

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `JWT_SECRET` | `dev-only-change-this-secret-nutri4you` | Segredo HMAC256 do JWT |
| `JWT_EXPIRATION_HOURS` | `2` | Validade do token em horas |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:4200,http://127.0.0.1:4200` | Origens CORS permitidas |
| `EMAIL_PROVIDER` | `console` | `console` (dev) ou `smtp` (Mailtrap demo) |
| `SPRING_PROFILES_ACTIVE` | — | `dev` auto-confirma e-mail; `demo` usa SMTP |
| `MAILTRAP_USERNAME` / `MAILTRAP_PASSWORD` | — | Credenciais Mailtrap (perfil demo) |
| `SPRING_DATASOURCE_URL` | — | JDBC URL do PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | — | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | — | Senha do banco |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `none` | Schema via `database/init.sql` |

## Endpoints disponíveis (Sprint 2 — parcial)

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | Pública | Health check |
| `POST` | `/auth/login` | Pública | Login JWT |
| `POST` | `/pacientes/autocadastro` | Pública | Cadastro de paciente |
| `POST` | `/nutricionistas/autocadastro` | Pública | Autocadastro de nutricionista (Q29) |
| `POST` | `/nutricionistas/cadastro` | `NUTRICIONISTA` | Cadastro assistido de nutricionista |
| `GET` | `/usuarios/me` | Autenticado | Dados do usuário logado (envelope) |
| `DELETE` | `/usuarios/me/nutricionistas/{id}/relacao` | `PACIENTE` | Desvincular nutricionista |
| `GET` | `/gestao-pacientes` | `NUTRICIONISTA` | Listagem Q16 |
| `GET` | `/gestao-pacientes/busca` | `NUTRICIONISTA` | Busca por e-mail ou CPF |
| `GET` | `/gestao-pacientes/{id}` | `NUTRICIONISTA` | Detalhe do paciente |
| `PUT` | `/gestao-pacientes/{id}` | `NUTRICIONISTA` | Atualizar paciente |
| `POST` | `/gestao-pacientes/{id}/vincular` | `NUTRICIONISTA` | Vincular relação recorrente |
| `DELETE` | `/gestao-pacientes/{id}/relacao` | `NUTRICIONISTA` | Desvincular relação recorrente |
| `GET` | `/auth/confirmar-email` | Pública | Confirmar e-mail |
| `POST` | `/auth/recuperar-senha` | Pública | Solicitar reset de senha |
| `POST` | `/auth/redefinir-senha` | Pública | Aplicar nova senha |
| `GET` | `/dev/email-preview/{token}` | Pública *(dev)* | Preview de e-mail |

Referência completa em [endpoints.md](endpoints.md).

## Dados de teste (seed)

| Tipo | E-mail | Observação |
| --- | --- | --- |
| Nutricionista | `nutri@nutri4you.com` | Senha dev: `password` |
| Paciente | `arthur@email.com`, `artur@email.com` | `email_confirmado=true` no seed |

> Pacientes seed podem ter hash placeholder — prefira autocadastro ou usuários criados nos testes de integração.

## Lacunas conhecidas

- OpenAPI/Swagger ainda não gerado.
- Interceptor JWT no mobile (S2-M1). Web concluído (S2-W1).
