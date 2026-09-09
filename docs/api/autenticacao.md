# Autenticação

A API utiliza **JWT stateless** com Spring Security. Não há sessão server-side — cada requisição protegida deve incluir o token no header `Authorization`.

## Fluxo de login

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as AuthController
    participant AM as AuthenticationManager
    participant DB as DatabaseUserDetailsService
    participant TS as TokenService

    C->>A: POST /auth/login { email, senha }
    A->>AM: authenticate(credentials)
    AM->>DB: loadUserByUsername(email)
    DB-->>AM: UserDetails (Paciente ou Nutricionista)
    AM-->>A: Authentication
    A->>TS: gerarToken(email)
    TS-->>A: JWT
    A-->>C: { token, tipoUsuario }
```

## Estrutura do token JWT

| Claim | Valor |
| --- | --- |
| `iss` (issuer) | `API Nutri4You` |
| `sub` (subject) | E-mail do usuário autenticado |
| `exp` | Expiração configurável (padrão: 2 horas) |
| Algoritmo | HMAC256 |

Configuração em `backend/src/main/resources/application.properties`:

```properties
api.security.token.secret=${JWT_SECRET:dev-only-change-this-secret-nutri4you}
api.security.token.expiration-hours=${JWT_EXPIRATION_HOURS:2}
```

## Validação em requisições protegidas

```mermaid
sequenceDiagram
    participant C as Cliente
    participant SF as SecurityFilter
    participant TS as TokenService
    participant DB as DatabaseUserDetailsService

    C->>SF: Request + Authorization: Bearer <token>
    SF->>TS: validarToken(token)
    TS-->>SF: email (subject) ou vazio
    alt token inválido
        SF-->>C: 403 Forbidden
    else token válido
        SF->>DB: loadUserByUsername(email)
        DB-->>SF: UserDetails
        SF->>SF: SecurityContextHolder.setAuthentication()
        SF-->>C: Request prossegue ao controller
    end
```

## Roles

| Entidade | Authority Spring | Valor em `tipoUsuario` |
| --- | --- | --- |
| `Paciente` | `ROLE_PACIENTE` | `PACIENTE` |
| `Nutricionista` | `ROLE_NUTRICIONISTA` | `NUTRICIONISTA` |

Ambas as entidades implementam `UserDetails`. O `DatabaseUserDetailsService` busca primeiro em `PacienteRepository`, depois em `NutricionistaRepository`.

## Rotas públicas vs protegidas

Configuradas em `SecurityConfig`:

| Rota | Método | Acesso |
| --- | --- | --- |
| `/api/v1/auth/login` | POST | Público |
| `/api/v1/pacientes/autocadastro` | POST | Público |
| `/api/v1/health` | GET | Público |
| `/error` | * | Público |
| Demais rotas | * | Autenticado |

Outras configurações de segurança:

- CSRF desabilitado (API REST stateless).
- Sessão: `SessionCreationPolicy.STATELESS`.
- Senhas: BCrypt via `PasswordEncoder`.

## Uso do token no cliente

Header obrigatório em rotas protegidas:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Status na Sprint 1

| Cliente | Envio de JWT | Observação |
| --- | --- | --- |
| Web (Angular) | Não implementado | Interceptor `apiErrorInterceptor` existe; auth interceptor previsto Sprint 2 |
| Mobile (Expo) | Não implementado | `apiClient` não adiciona header `Authorization` |

## Próximos passos (Sprint 2+)

- Interceptor HTTP no Angular para injetar JWT automaticamente.
- Armazenamento seguro do token no mobile (SecureStore / AsyncStorage).
- Refresh token ou re-login automático na expiração.
- Endpoints protegidos por role (`@PreAuthorize`).
- Configuração CORS para origens web e mobile.
