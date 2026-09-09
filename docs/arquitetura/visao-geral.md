# Visão geral da arquitetura

## Monorepo

Todo o código-fonte do TCC vive em um único repositório Git. Isso facilita:

- Versionamento coordenado entre API e clientes.
- Docker Compose unificado para desenvolvimento local.
- Documentação centralizada em `docs/`.

## Camadas do backend

```mermaid
flowchart TB
    subgraph presentation [Apresentação]
        HC[HealthController]
        AC[AuthController]
        PC[PacienteController]
    end

    subgraph security [Segurança]
        SC[SecurityConfig]
        SF[SecurityFilter]
        TS[TokenService]
        UDS[DatabaseUserDetailsService]
    end

    subgraph business [Negócio]
        PS[PacienteService]
    end

    subgraph persistence [Persistência]
        PR[PacienteRepository]
        NR[NutricionistaRepository]
    end

    subgraph db [Banco]
        PG[(PostgreSQL)]
    end

    HC --> SC
    AC --> TS
    AC --> SC
    PC --> PS
    PS --> PR
    PS --> NR
    PR --> PG
    NR --> PG
    SF --> TS
    SF --> UDS
    UDS --> PR
    UDS --> NR
```

| Camada | Pacote | Responsabilidade |
| --- | --- | --- |
| Controller | `controller/` | Endpoints REST, DTOs de entrada/saída |
| Service | `service/` | Regras de negócio |
| Repository | `repository/` | Acesso a dados via Spring Data JPA |
| Model | `model/` | Entidades JPA + `UserDetails` |
| Security | `security/` | JWT, filtro, carregamento de usuário |
| Config | `config/` | Spring Security, beans |

## Camadas dos clientes

### Web (Angular)

```mermaid
flowchart LR
    COMP[Components] --> SVC[Services]
    SVC --> API[ApiService]
    API --> HTTP[HttpClient]
    HTTP --> INT[apiErrorInterceptor]
    INT --> BE[Backend /api/v1]
```

| Camada | Caminho | Responsabilidade |
| --- | --- | --- |
| Features | `src/app/features/` | Telas (home, health, not-found) |
| Services | `src/app/core/services/` | `ApiService`, `HealthService` |
| Interceptors | `src/app/core/interceptors/` | Normalização de erros HTTP |
| Models | `src/app/core/models/` | Tipos TypeScript da API |
| Environment | `src/environments/` | `apiBaseUrl` por ambiente |

Rotas definidas em `app.routes.ts`. Módulos de negócio serão carregados via `loadChildren` a partir da Sprint 2.

### Mobile (Expo)

```mermaid
flowchart LR
    SCR[Screens] --> SVC[healthService]
    SVC --> CLI[apiClient]
    CLI --> FETCH[fetch API]
    FETCH --> BE[Backend /api/v1]
```

| Camada | Caminho | Responsabilidade |
| --- | --- | --- |
| Screens | `src/screens/` | Telas (Home, Health) |
| Navigation | `src/navigation/` | Stack Navigator |
| API | `src/core/api/` | `apiClient`, services, types |
| Config | `src/core/config/` | `env.apiBaseUrl` (IP local via Expo) |

O mobile detecta automaticamente o IP da máquina de desenvolvimento via `expo-constants` (`hostUri` / `debuggerHost`).

## Infraestrutura local (Docker Compose)

```mermaid
flowchart LR
    DEV[Desenvolvedor] --> WEB_C[nutri4you-web :4200]
    DEV --> BE_C[nutri4you-backend :8080]
    DEV --> DB_C[nutri4you-db :5432]
    BE_C --> DB_C
    WEB_C -.->|HTTP| BE_C
```

| Serviço | Container | Portas | Volumes |
| --- | --- | --- | --- |
| `postgres-db` | `nutri4you-db` | 5432 | `postgres-data`, `init.sql` |
| `backend` | `nutri4you-backend` | 8080, 5005 (debug) | código fonte + cache Maven |
| `web` | `nutri4you-web` | 4200 | código fonte + `node_modules` |

O mobile **não** roda em container — executa localmente via Expo Go na mesma rede Wi-Fi do host.

## Fluxo de dados — Sprint 1

```mermaid
sequenceDiagram
    participant W as Web / Mobile
    participant B as Backend
    participant P as PostgreSQL

    Note over W,P: Health check
    W->>B: GET /api/v1/health
    B-->>W: "API is running and connected!"

    Note over W,P: Autocadastro
    W->>B: POST /api/v1/pacientes/autocadastro
    B->>P: INSERT Paciente
    P-->>B: OK
    B-->>W: 201 { mensagem }

    Note over W,P: Login
    W->>B: POST /api/v1/auth/login
    B->>P: SELECT por email
    P-->>B: UserDetails
    B-->>W: 200 { token, tipoUsuario }
```

## Integração contínua

Pipeline em `.github/workflows/ci.yml`:

| Job | Ferramenta | Escopo |
| --- | --- | --- |
| Validação de Markdown | markdownlint-cli2 | `**/*.md` |
| Detecção de segredos | gitleaks | Histórico completo |
| Gate | — | Falha se qualquer job anterior falhar |

Build e testes de backend, web e mobile ainda **não** fazem parte do CI.
