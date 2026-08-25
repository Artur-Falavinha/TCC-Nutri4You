# Onboarding

Este espaço será ampliado com os pré-requisitos, a instalação e a execução de
cada aplicação quando o projeto ganhar código.

## Integração contínua

O CI atual estabelece a primeira camada de qualidade do repositório:

- valida os arquivos Markdown;
- procura segredos no histórico e nos commits enviados ao GitHub;
- consolida as validações obrigatórias no check `CI / Gate`.

### Expansão pendente

Os jobs de build, lint e testes da API, da aplicação web, do aplicativo móvel
e do banco de dados ainda não foram adicionados porque essas frentes não
possuem código ou contratos de build versionados no repositório.

Adicionar esses jobs agora exigiria presumir caminhos, versões e ferramentas
que ainda não foram decididos. Jobs ignorados por falta de arquivos também
produziriam um pipeline verde sem executar os testes esperados.

O CI deve ser ampliado quando cada frente registrar:

- o diretório definitivo da aplicação;
- as versões de Java e Node.js utilizadas;
- o wrapper do Maven ou Gradle escolhido para a API;
- o gerenciador de pacotes e o arquivo de lock da web e do mobile;
- os comandos reais de build, lint, testes e verificação de tipos;
- a versão do MySQL e a ferramenta responsável pelas migrações.

Depois dessas definições, os novos jobs deverão integrar o `CI / Gate`, que
somente poderá concluir com sucesso quando todas as frentes existentes forem
validadas.
