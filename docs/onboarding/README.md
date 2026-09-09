# Onboarding — Ambiente de desenvolvimento

Guia para configurar e executar o Nutri4You localmente.

## Pré-requisitos

| Ferramenta | Versão recomendada | Uso |
| --- | --- | --- |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Banco, backend e web |
| [Node.js](https://nodejs.org/) | LTS (22.x) | Web (fora do Docker) e mobile |
| [Git](https://git-scm.com/) | Latest | Clone do repositório |
| [Expo Go](https://expo.dev/go) | Latest | App mobile no celular |

Para desenvolvimento e testes do backend fora do Docker:

- **JDK 21** (Eclipse Temurin recomendado)
- Maven incluso via `./mvnw` (não é necessário instalar Maven separadamente)

### Configurar Java 21 (Windows)

Instale o JDK e configure `JAVA_HOME`:

```powershell
winget install EclipseAdoptium.Temurin.21.JDK
```

Após a instalação, defina as variáveis de usuário (ajuste o caminho se a versão patch for diferente):

```powershell
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$javaHome\bin;$userPath", "User")
```

Reabra o terminal e valide:

```powershell
java -version
# openjdk version "21.x" ...
```

### Executar testes do backend

Na raiz do projeto:

```powershell
.\scripts\run-backend-tests.ps1
```

Ou diretamente na pasta `backend/`:

```powershell
cd backend
.\mvnw.cmd -B test
```

O script `scripts/resolve-java-home.ps1` detecta automaticamente o Temurin 21 em `C:\Program Files\Eclipse Adoptium\` quando `JAVA_HOME` não estiver definido.

## Clone do repositório

```bash
git clone https://github.com/Artur-Falavinha/TCC-Nutri4You.git
cd TCC-Nutri4You
```

## Subir o ambiente (Docker)

Na raiz do projeto, com o Docker Desktop em execução:

```bash
docker compose up -d --build
```

Isso sobe três serviços:

| Serviço | URL / Porta | Container |
| --- | --- | --- |
| PostgreSQL | `localhost:5432` | `nutri4you-db` |
| Backend (API) | `http://localhost:8080` | `nutri4you-backend` |
| Web (Angular) | `http://localhost:4200` | `nutri4you-web` |

Verifique o health check:

```bash
curl http://localhost:8080/api/v1/health
```

Resposta esperada: `API is running and connected!`

### Credenciais do banco

| Parâmetro | Valor |
| --- | --- |
| Host | `127.0.0.1` |
| Porta | `5432` |
| Usuário | `springuser` |
| Senha | `password` |
| Database | `nutri4you_db` |

### Parar o ambiente

```bash
docker compose down
```

Para recriar o banco do zero (aplica `init.sql` novamente):

```bash
docker compose down -v
docker compose up -d --build
```

## Executar o mobile (Expo)

O mobile **não** roda em container. Requer backend ativo na porta 8080.

```bash
cd mobile
npm install
npm start
```

1. Um QR Code aparecerá no terminal.
2. **Android:** abra o Expo Go e escaneie o QR Code.
3. **iOS:** use a câmera nativa para abrir no Expo Go.
4. Celular e computador devem estar na **mesma rede Wi-Fi**.

O app detecta automaticamente o IP da máquina via `expo-constants`.

## Executar a web fora do Docker (opcional)

```bash
cd web
npm install
npm start
# http://localhost:4200
```

Certifique-se de que o backend está acessível em `http://localhost:8080`.

## Executar o backend fora do Docker (opcional)

Requer PostgreSQL rodando (via Docker ou instalação local):

```bash
cd backend
./mvnw spring-boot:run
```

Variáveis de ambiente necessárias:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/nutri4you_db
SPRING_DATASOURCE_USERNAME=springuser
SPRING_DATASOURCE_PASSWORD=password
SPRING_JPA_HIBERNATE_DDL_AUTO=none
JWT_SECRET=dev-only-change-this-secret-nutri4you
```

## Estrutura do monorepo

```text
TCC-Nutri4You/
├── backend/           # API Spring Boot (Java 21)
├── web/               # SPA Angular 19
├── mobile/            # App Expo 57
├── database/          # init.sql (DDL + seed)
├── docs/              # Documentação
├── docker-compose.yaml
└── .github/workflows/ # CI
```

## Integração contínua

O pipeline em `.github/workflows/ci.yml` executa:

| Job | Comando |
| --- | --- |
| Validação de Markdown | markdownlint-cli2 |
| Detecção de segredos | gitleaks |
| Backend — testes | `./mvnw -B test` |
| Web — lint e build | `npm run lint` + `npm run build` |
| Mobile — lint e typecheck | `npm run lint` + `npm run typecheck` |
| Gate | Consolida todos os jobs acima |

## Próximos passos

- Consulte a [documentação da API](../api/README.md) para endpoints disponíveis.
- Veja a [arquitetura](../arquitetura/README.md) para entender as camadas do sistema.
- Leia [clientes](../clientes/README.md) para detalhes de web e mobile.
