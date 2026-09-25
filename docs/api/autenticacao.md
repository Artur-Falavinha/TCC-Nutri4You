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
app.cors.allowed-origins=${APP_CORS_ALLOWED_ORIGINS:http://localhost:4200,http://127.0.0.1:4200}
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

O `DatabaseUserDetailsService` busca primeiro em `NutricionistaRepository`, depois em `PacienteRepository`.

## E-mail confirmado (Sprint 2)

Pacientes autocadastrados nascem com `email_confirmado=false`. O login é bloqueado via `UserDetails.isEnabled()` até confirmação (S2-B3). Seed de demo usa `email_confirmado=true`.

## CORS

Configurado em `CorsConfig` e habilitado no `SecurityFilterChain`.

| Origem padrão | Uso |
| --- | --- |
| `http://localhost:4200` | Angular (`ng serve` / Docker web) |
| `http://127.0.0.1:4200` | Mesmo host, IP literal |

Headers permitidos: `Authorization`, `Content-Type`, `Accept`.  
Métodos: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`.

**Mobile (Expo):** requisições nativas não aplicam política CORS de browser.

## Rotas públicas vs protegidas

Configuradas em `SecurityConfig`:

| Rota | Método | Acesso |
| --- | --- | --- |
| `/api/v1/auth/login` | POST | Público |
| `/api/v1/auth/confirmar-email` | GET | Público |
| `/api/v1/auth/recuperar-senha` | POST | Público |
| `/api/v1/auth/redefinir-senha` | POST | Público |
| `/api/v1/dev/email-preview/{token}` | GET | Público *(perfil dev)* |
| `/api/v1/pacientes/autocadastro` | POST | Público |
| `/api/v1/nutricionistas/autocadastro` | POST | Público *(Q29)* |
| `/api/v1/health` | GET | Público |
| `/api/v1/nutricionistas/cadastro` | POST | `ROLE_NUTRICIONISTA` *(cadastro assistido — HU019)* |
| `/api/v1/gestao-pacientes/**` | * | `ROLE_NUTRICIONISTA` |
| `/error` | * | Público |
| Demais rotas | * | Autenticado |

Outras configurações:

- CSRF desabilitado (API REST stateless).
- Sessão: `SessionCreationPolicy.STATELESS`.
- Senhas: BCrypt via `PasswordEncoder`.
- CORS integrado ao filtro de segurança.

## Uso do token no cliente

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Status nos clientes

| Cliente | Envio de JWT | Observação |
| --- | --- | --- |
| Web (Angular) | `authInterceptor` + `TokenStorageService` | Rotas públicas: login, autocadastro, recuperação |
| Mobile (Expo) | Pendente S2-M1 | Sem restrição CORS nativa |

## E-mail (S2-B3)

| Perfil | Provider | Auto-confirma | Uso |
| --- | --- | --- | --- |
| `dev` (Docker local) | `console` | Sim (Q20) | Log + `/dev/email-preview` |
| `demo` (Sprint Review) | `smtp` (Mailtrap) | Não | Fluxo completo na caixa de testes |

Adapter: `EmailSender` → `ConsoleEmailSender` ou `SmtpEmailSender`.

## Recuperação de senha (Q26–Q28)

- `POST /auth/recuperar-senha` aceita e-mail de **paciente ou nutricionista** (lookup nutri → paciente).
- Resposta sempre genérica 200, mesmo se o e-mail não existir (RNF02).
- Falha no envio SMTP/console **não** propaga 500 — token persiste e e-mail é enviado de forma assíncrona.
- Tokens de recuperação anteriores do mesmo titular são invalidados ao solicitar novo link.
- Consumo atômico do token — segunda tentativa retorna `Token inválido ou expirado.`

## Autocadastro nutricionista (Q29)

- Wizard web: dados → senha → `POST /nutricionistas/autocadastro` → login.
- Nutricionista **não** exige `email_confirmado` na S2 — login imediato após autocadastro.

## Próximos passos (Sprint 2)

- Interceptor HTTP mobile para JWT (S2-M1).
