# Nutri4You — Web (Angular)

Aplicação web do Nutri4You (TCC), consumida pelo nutricionista. Gerada com Angular CLI 19 (standalone components, sem NgModules).

## Requisitos

- Node.js 20 LTS ou 22 (definir a versão final da equipe em `docs/onboarding/README.md`)
- npm 10+

## Instalação

```bash
npm install
```

## Ambientes

A URL base da API vive em `src/environments/`:

| Arquivo | Usado por | apiBaseUrl padrão |
|---|---|---|
| `environment.development.ts` | `ng serve` / build `development` | `http://localhost:8080/api/v1` |
| `environment.ts` | `ng build` (produção) | ajustar para a URL real implantada |

Não é preciso editar código para trocar de ambiente — o Angular CLI já troca o arquivo pelo `fileReplacements` do `angular.json`.

## Rodando localmente

```bash
npm start          # ng serve, http://localhost:4200
```

Com a API Spring Boot rodando em `localhost:8080` (Sprint 1), acesse `http://localhost:4200/health` para conferir o fluxo cliente -> API.

## Scripts

```bash
npm run build       # build de produção em dist/web
npm run watch       # build contínuo em modo development
npm test            # testes unitários (Karma + Jasmine, precisa de Chrome/Chromium)
npx ng lint         # ESLint (angular-eslint)
```

## Estrutura

```
src/app/
├── core/
│   ├── services/        # ApiService (cliente HTTP genérico) e serviços por domínio
│   ├── interceptors/     # normalização de erro, futura injeção de token JWT
│   └── models/            # contratos de resposta da API
├── features/
│   ├── home/              # placeholder — vira dashboard do nutricionista na Sprint 2+
│   ├── health/            # tela de status da API (critério de aceite da Sprint 1)
│   └── not-found/
├── app.routes.ts
└── app.config.ts
```

Cada novo módulo de negócio (autenticação, pacientes, anamnese, prescrição, agenda, exames) deve entrar como uma pasta própria em `features/`, com suas próprias rotas.

## Referências

- Roadmap do TCC — Sprint 1: fundação técnica e primeiro fluxo integrado
- [Tokens de design](../docs/figma/tokens%20-%20documentação/README.md)
