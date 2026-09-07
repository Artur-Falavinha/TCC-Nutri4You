# TCC — I Need a Nutri

Repositório do projeto **I Need a Nutri** (TCC).

* **Repositório remoto:** [github.com/Artur-Falavinha/TCC-I-Need-A-Nutri](https://github.com/Artur-Falavinha/TCC-I-Need-A-Nutri)

## Documentação

| Área | Caminho |
| --- | --- |
| Índice geral | [`docs/README.md`](https://www.google.com/search?q=docs/README.md) |
| Figma (tokens e guias) | [`docs/figma/`](https://www.google.com/search?q=docs/figma/) |
| Tokens — documentação | [`docs/figma/tokens - documentação/README.md`](https://www.google.com/search?q=docs/figma/tokens%2520-%2520documenta%C3%A7%C3%A3o/README.md) |
| Arquitetura / API / Onboarding | Pastas-reserva em [`docs/`](https://www.google.com/search?q=docs/) (READMEs internos) |

## Como Rodar o Ambiente (Docker)

Certifique-se de que o **Docker Desktop** está aberto e rodando na sua máquina. Na raiz do projeto, execute o comando para subir os contêineres do banco de dados, backend e frontend:

```bash
docker compose up -d --build

```

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