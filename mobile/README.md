# Nutri4You — Mobile (Expo / React Native)

App do paciente do Nutri4You (TCC). Gerado com Expo (managed workflow) + TypeScript.

## Requisitos

- Node.js 20 LTS ou 22
- npm 10+
- App **Expo Go** no celular (Android/iOS) ou um emulador Android/simulador iOS
- Nenhuma pasta nativa (`android/`, `ios/`) é versionada — o Expo as gera sob demanda quando necessário (`expo prebuild`)

## Instalação

```bash
npm install
```

## Ambientes

A URL base da API vem de variáveis `EXPO_PUBLIC_*`, carregadas automaticamente pelo Expo:

| Arquivo | Usado por | EXPO_PUBLIC_API_BASE_URL |
|---|---|---|
| `.env.development` | `expo start` (modo padrão) | `http://localhost:8080/api/v1` |
| `.env.production` | `expo export` / EAS Build | ajustar para a URL real implantada |

Se for testar em um celular físico, `localhost` não funciona — troque por o IP da sua máquina na rede local (ex.: `http://192.168.0.10:8080/api/v1`) em `.env.development`, ou crie um `.env.local` (não versionado) com o override.

## Rodando localmente

```bash
npm start
```

Isso abre o Metro Bundler; escaneie o QR code com o app Expo Go, ou pressione `a` (Android) / `i` (iOS) se tiver um emulador configurado.

Com a API Spring Boot rodando (Sprint 1), abra a tela inicial e toque em "Ver status da API" para conferir o fluxo cliente -> API.

## Scripts

```bash
npm run lint         # ESLint (eslint-config-expo)
npm run typecheck    # tsc --noEmit
```

## Estrutura

```
src/
├── core/
│   ├── config/env.ts       # leitura das variáveis EXPO_PUBLIC_*
│   └── api/                # apiClient (fetch), tipos de resposta, healthService
├── navigation/
│   ├── RootNavigator.tsx    # stack principal (@react-navigation/native-stack)
│   └── types.ts             # RootStackParamList (navegação tipada)
└── screens/
    ├── home/                # placeholder — vira dieta ativa/consumo na Sprint 5
    └── health/              # tela de status da API (critério de aceite da Sprint 1)
App.tsx                       # host do NavigationContainer
```

A partir da Sprint 2, o `RootNavigator` deve ganhar um fluxo de autenticação (login, autocadastro, validação de e-mail) antes das telas atuais.

## Referências

- Roadmap do TCC — Sprint 1: fundação técnica e primeiro fluxo integrado
