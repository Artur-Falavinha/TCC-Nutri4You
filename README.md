# TCC — I Need a Nutri

Repositório do projeto **I Need a Nutri** (TCC).

* **Repositório remoto:** [github.com/Artur-Falavinha/TCC-I-Need-A-Nutri](https://github.com/Artur-Falavinha/TCC-I-Need-A-Nutri)

## Documentação

| Área | Caminho |
| --- | --- |
| Índice geral | [`docs/README.md`](docs/README.md) |
| Figma (tokens e guias) | [`docs/figma/`](docs/figma/) |
| Tokens — documentação | [`docs/figma/tokens - documentação/README.md`](docs/figma/tokens%20-%20documentação/README.md) |
| Arquitetura / API / Onboarding | Pastas-reserva em [`docs/`](docs/) (READMEs internos) |

## Como Rodar o Ambiente (Docker)

**Pré-requisito:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto e em execução (ícone da baleia ativo na bandeja).

Na **raiz do projeto**, um único comando sobe Postgres, backend (8080) e web (4200) — **não é necessário** abrir terminais separados com `mvnw` e `npm start`:

```bash
docker compose up --build
```

*(Modo detached: `docker compose up --build -d`)*

### Testar auth web (Sprint 2)

| Passo | Ação |
| --- | --- |
| 1 | Aguarde logs de `nutri4you-backend` com `Started BackendApplication` |
| 2 | Aguarde `nutri4you-web` com `Compiled successfully` / `Application bundle generation complete` |
| 3 | Abra **[http://localhost:4200/login](http://localhost:4200/login)** |
| 4 | Login nutricionista seed: `nutri@nutri4you.com` / senha `password` |
| 4b | Autocadastro nutri: **[http://localhost:4200/cadastro](http://localhost:4200/cadastro)** → senha → login |
| 5 | Após login → redirect para **/dashboard** |

Health check da API: **[http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)**

### Solução de problemas

| Sintoma | Comando / ação |
| --- | --- |
| Erro de schema / tabela inexistente (Postgres antigo) | `docker compose down -v` e `docker compose up --build` *(recria volume + aplica `database/init.sql`)* |
| Frontend não acha pacote novo (`@phosphor-icons/web`, etc.) | `docker compose up --build web` *(entrypoint roda `npm install` ao iniciar)* |
| Porta 8080 ou 4200 ocupada | Pare o processo local ou ajuste as portas no `docker-compose.yaml` |
| Backend sobe antes do Postgres | Resolvido: `depends_on` + healthcheck no compose |
| Ver logs | `docker compose logs -f backend web` |

### Desenvolvimento sem Docker *(opcional)*

Use dois terminais só se preferir debug nativo (breakpoint Java na porta **5005**) ou iterar sem rebuild de imagem. Para demo e teste do fluxo auth, **Docker basta**.

## Executando o Aplicativo Mobile (React Native / Expo)

O aplicativo mobile utiliza **Expo** e foi configurado para detectar automaticamente o IP da sua máquina na rede local através do `expo-constants`, dispensando a necessidade de configurar manualmente arquivos `.env` locais para o desenvolvimento.

### Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

* [Node.js](https://nodejs.org/) (versão LTS recomendada)
* Gerenciador de pacotes `npm` ou `yarn`
* O aplicativo **Expo Go** instalado no seu celular (disponível na App Store ou Google Play)
* O **Docker** rodando com o backend do Spring Boot inicializado.

### Passo a Passo para Execução

1. **Abra o terminal e acesse a pasta do mobile:**

   ```bash
   cd mobile
   ```

1. **Instale as dependências do projeto:**

   ```bash
   npm install
   ```

1. **Garanta que o Backend está rodando:**

   Certifique-se de que os contêineres do Docker (Backend e Banco de Dados) estão ativos na porta `8080`. Na raiz do projeto, você pode executar:

   ```bash
   docker compose up -d
   ```

1. **Inicie o servidor de desenvolvimento (Metro Bundler):**

   ```bash
   npm start
   ```

   *(Caso precise limpar o cache de desenvolvimento do Expo em algum momento, utilize: `npx expo start --clear`)*

1. **Conecte pelo celular:**

   * Um **QR Code** será exibido no seu terminal.
   * **No Android:** Abra o aplicativo **Expo Go** e selecione a opção de escanear o QR Code.
   * **No iOS:** Utilize a câmera nativa do iPhone para ler o QR Code, que abrirá automaticamente o Expo Go.
   * *Importante:* O seu celular e o seu computador precisam estar conectados exatamente à **mesma rede Wi-Fi** para que o app consiga se comunicar com a API local.

### Credenciais e Conexão com o Banco de Dados

Para visualizar e gerenciar as tabelas e dados do PostgreSQL conteinerizado (através de extensões como o Database Client no VS Code), utilize os seguintes parâmetros de conexão:

* **Host:** `127.0.0.1` ou `localhost`
* **Port:** `5432`
* **Username:** `springuser`
* **Password:** `password`
* **Database:** `nutri4you_db`

*(Nota: Certifique-se de deixar o campo Group em branco ao configurar a conexão na sua ferramenta para evitar conflitos de cache).*

## Próximos passos

Desenvolvimento contínuo das features de backend, frontend e mobile do TCC.
