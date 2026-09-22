# Nutri4You — Mobile (Expo / React Native)

App do **paciente** do Nutri4You (TCC). Gerado com Expo (managed workflow) + TypeScript.

## Requisitos

- Node.js 20 LTS ou 22
- npm 10+
- App **Expo Go** no celular (Android/iOS) ou emulador
- Backend Spring Boot em `http://<IP>:8080` (Docker Compose na raiz do monorepo)

## Instalação

```bash
npm install
```

## Ambientes

A URL base da API vem de `EXPO_PUBLIC_API_BASE_URL`. Sem a variável, o app usa o IP do Metro (`hostUri`) em `http://<ip>:8080/api/v1`.

| Arquivo | Uso |
|---|---|
| `.env.development` | `expo start` |
| `.env.local` | override local (não versionado) |

Em celular físico, `localhost` não funciona — use o IP da máquina na LAN.

## Auth (Sprint 2)

Fluxo do paciente:

1. **Login** — `POST /auth/login`; só `PACIENTE` entra (nutricionista é bloqueado).
2. **Criar conta** — `POST /pacientes/autocadastro` (nome, e-mail, senha ≥ 8; opcionais CPF/telefone/sexo/data ISO).
3. **Esqueci a senha** — `POST /auth/recuperar-senha` (mensagem genérica RNF02) → cole o UUID (log do console Docker) → `NovaSenha` → `POST /auth/redefinir-senha`.

Seed local: `arthur@email.com` / `password`.

Deep link: scheme `nutri4you` — ex. `nutri4you://redefinir-senha?token=<uuid>`.

JWT fica no SecureStore (`nutri4you.jwt`). Cold start com token válido abre `Home`.

## Rodando localmente

```bash
# na raiz do monorepo
docker compose up --build -d

cd mobile
npm start
```

## Scripts

```bash
npm test             # Jest
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Estrutura

```
src/
├── core/
│   ├── auth/               # token storage, auth.service, models
│   ├── config/env.ts
│   ├── api/                # apiClient (fetch + JWT + 401)
│   └── utils/              # UUID, deep-link
├── navigation/
└── screens/                # Login, CriarConta, TrocarSenha, NovaSenha, Home, Health
```
