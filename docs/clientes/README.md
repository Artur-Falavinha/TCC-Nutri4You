# Clientes — Web e Mobile

Documentação das aplicações cliente que consomem a API Nutri4You.

## Visão geral

| Cliente | Stack | Diretório | URL da API (dev) |
| --- | --- | --- | --- |
| Web | Angular 19 | `web/` | `http://localhost:8080/api/v1` |
| Mobile | Expo 57 / React Native 0.86 | `mobile/` | `http://<IP-local>:8080/api/v1` |

Ambos possuem camada HTTP base e tela de health check na Sprint 1. Autenticação JWT nos clientes está prevista para a Sprint 2.

---

## Web (Angular)

### Web — estrutura

```text
web/src/app/
├── app.routes.ts              # Rotas
├── app.config.ts              # Providers (HttpClient, interceptors)
├── core/
│   ├── services/
│   │   ├── api.service.ts     # Cliente HTTP genérico
│   │   └── health.service.ts  # GET /health
│   ├── interceptors/
│   │   └── api-error.interceptor.ts
│   └── models/
│       └── api-response.model.ts
├── features/
│   ├── home/
│   ├── health/
│   └── not-found/
└── environments/
    ├── environment.ts              # production
    └── environment.development.ts  # development
```

### Rotas

| Path | Componente | Descrição |
| --- | --- | --- |
| `/` | `HomeComponent` | Página inicial |
| `/health` | `HealthComponent` | Status da API |
| `/**` | `NotFoundComponent` | 404 |

### Web — configuração de ambiente

| Arquivo | `apiBaseUrl` |
| --- | --- |
| `environment.development.ts` | `http://localhost:8080/api/v1` |
| `environment.ts` (production) | `https://api.nutri4you.com.br/api/v1` |

Substituição automática via `fileReplacements` em `angular.json`.

### ApiService

Cliente HTTP centralizado que prefixa todas as URLs com `environment.apiBaseUrl`:

```typescript
// Exemplo de uso interno
this.apiService.get('/health');
// → GET http://localhost:8080/api/v1/health
```

Métodos disponíveis: `get`, `post`, `put`, `patch`, `delete`.

### Interceptor de erros

O `apiErrorInterceptor` normaliza erros HTTP para o tipo `ApiErrorResponse`:

```typescript
interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
}
```

### Web — execução local

Via Docker (recomendado):

```bash
docker compose up -d web
# Acesse http://localhost:4200
```

Fora do Docker:

```bash
cd web
npm install
npm start
```

---

## Mobile (Expo)

### Mobile — estrutura

```text
mobile/src/
├── navigation/
│   ├── RootNavigator.tsx    # Stack Navigator
│   └── types.ts
├── screens/
│   ├── home/HomeScreen.tsx
│   └── health/HealthScreen.tsx
└── core/
    ├── api/
    │   ├── api-client.ts         # Cliente fetch singleton
    │   ├── health.service.ts
    │   └── api-response.types.ts
    └── config/
        └── env.ts                # apiBaseUrl dinâmico
```

### Rotas (Stack Navigator)

| Rota | Screen | Descrição |
| --- | --- | --- |
| `Home` | `HomeScreen` | Página inicial |
| `Health` | `HealthScreen` | Status da API |

### Mobile — configuração de ambiente

O arquivo `env.ts` detecta automaticamente o IP da máquina de desenvolvimento:

```typescript
export const env = {
  apiBaseUrl: `http://${localIp}:8080/api/v1`
};
```

- `localIp` derivado de `expo-constants` (`hostUri` ou `debuggerHost`).
- Fallback: `localhost`.
- Requisito: celular e computador na **mesma rede Wi-Fi**.

Existe `.env.production` com `EXPO_PUBLIC_API_BASE_URL`, mas `env.ts` ainda não o consome — ajuste previsto para builds de produção.

### apiClient

Singleton com métodos `get`, `post`, `put`, `delete` baseados em `fetch`:

- Header padrão: `Content-Type: application/json`.
- Erros de rede → `ApiError` com `status: 0`.
- Status 204 → retorna `undefined`.
- **Sem** header `Authorization` na Sprint 1.

### Mobile — execução local

```bash
cd mobile
npm install
npm start
# Escaneie o QR Code com Expo Go (Android) ou câmera (iOS)
```

Pré-requisito: backend rodando na porta 8080 (`docker compose up -d backend postgres-db`).

---

## Contrato compartilhado com a API

### Envelope de resposta (RNF09/RNF10)

`ApiService` (web) e `apiClient` (mobile) desembrulham automaticamente:

```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}
```

### Autenticação (Sprint 2)

Planejado para ambos os clientes:

1. Tela de login consumindo `POST /auth/login`.
2. Armazenamento do token (localStorage web / SecureStore mobile).
3. Injeção automática de `Authorization: Bearer <token>` nas requisições.
