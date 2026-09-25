# Anamnese: cadastro único por paciente

## Fluxo

- Sem cadastro: a tela mostra o estado vazio e **+ Nova Anamnese**.
- O formulário aparece apenas ao criar, editar ou continuar um rascunho.
- **Salvar rascunho** aceita respostas incompletas, mas valida os valores informados.
- **Finalizar anamnese** exige todos os campos visíveis e aplicáveis. Identificação é somente leitura, obtida de Paciente.
- **Cancelar** descarta apenas as alterações locais, após confirmação quando necessário. Não modifica a API.
- **Descartar rascunho** remove explicitamente o rascunho persistido; a última versão finalizada permanece.
- Editar um cadastro finalizado e salvar rascunho não substitui suas respostas publicadas. Finalizar a edição atualiza o mesmo cadastro.
- Um conflito de versão retorna HTTP 409. A tela preserva os valores locais e oferece recarregar os dados.
- O paciente selecionado fica na URL; recarregar não abre automaticamente o formulário.
- Escalas não têm resposta implícita: o usuário deve selecionar o valor.

## Persistência

A modelagem de perguntas e respostas do `database/init.sql` foi mantida:

- `Pergunta_Anamnese.codigo`: identificador estável de cada campo do formulário.
- `Resposta_Anamnese`: respostas finalizadas, com unicidade em `(id_paciente, id_pergunta)`. Cada `texto_resposta` de pergunta codificada contém um valor JSON: texto, número ou lista.
- `Anamnese`: uma linha por paciente (chave primária `id_paciente`), versão, rascunho JSON em TEXT, horários UTC e nutricionista responsável pela última alteração.
- Perguntas/respostas legadas sem código não são removidas nem reinterpretadas automaticamente.
- Não são criadas anamneses por consulta nem versões históricas de respostas.

Gravações são transacionais. O bloqueio pessimista da linha de Paciente serializa inclusive a primeira criação, e a versão otimista impede que uma edição antiga sobrescreva outra. As respostas condicionais que deixaram de se aplicar são removidas ao finalizar. Dados desativados também são removidos do rascunho recebido.

O catálogo em `backend/src/main/resources/anamnese-fields.json` define os 57 campos, suas opções, tipos, limites e dependências. A API serve o mesmo catálogo usado pela tela. Alterações em códigos ou novas perguntas exigem uma nova migração correspondente.

## API

Todos os endpoints abaixo exigem JWT de nutricionista. O acesso ao paciente segue a política já existente no projeto: relação clínica ativa ou consulta associada ao nutricionista.

| Método | Caminho relativo a /api/v1 | Operação |
| --- | --- | --- |
| GET | /gestao-pacientes/anamnese/campos | Catálogo do formulário |
| GET | /gestao-pacientes/{id}/anamnese | Identificação, respostas publicadas, rascunho e versão |
| PUT | /gestao-pacientes/{id}/anamnese/rascunho | Salvar rascunho |
| PUT | /gestao-pacientes/{id}/anamnese | Finalizar ou atualizar |
| DELETE | /gestao-pacientes/{id}/anamnese/rascunho?versao=0 | Descartar rascunho |

Exemplo de rascunho inicial:

```json
{
  "versao": null,
  "respostas": {
    "profession": "Professor",
    "height": 1.78,
    "allergy": "Sim",
    "allergyDetails": "Amendoim"
  }
}
```

Após cada gravação, enviar a versão retornada pela API. Uma resposta incompleta na finalização, opção inválida, tipo incorreto ou valor fora dos limites retorna 422 com `fields`, um mapa de código do campo para mensagem. Sem autenticação: 401. Sem permissão: 403. Paciente inexistente: 404. Versão desatualizada: 409.

Exemplos de regras:

- Altura: 0,30 a 2,70 m, precisão de 0,01; peso: 1 a 500 kg, precisão de 0,1.
- Refeições: inteiro de 1 a 20; escalas: inteiro de 1 a 10.
- Número/WhatsApp: DDD e telefone de 10 ou 11 dígitos formatados.
- `Sim` em alergias exige descrição; `Outro` em exames exige nome, mas apenas se há exames recentes.
- Atividade física exige tipo, frequência e intensidade somente para `Sim`.
- `Nenhum diagnóstico` é incompatível com outros diagnósticos.
- Textos são limitados a 80, 120, 160 ou 500 caracteres conforme o campo.

## Migrações

O backend aplica migrações Flyway na inicialização, conforme o [suporte oficial do Spring Boot](https://docs.spring.io/spring-boot/4.0/appendix/auto-configuration-classes/spring-boot-flyway.html).

- V1: modelo inicial para banco vazio.
- V1.1: compatibilidade com bancos anteriores à autenticação. Cria tabelas ausentes e copia vínculos antigos sem excluir a tabela original.
- V2: estrutura da anamnese e catálogo de perguntas.
- V3: horários da anamnese com fuso horário.

Em bancos existentes sem histórico Flyway, a configuração faz baseline em V1 e aplica as migrações seguintes. Não usar `docker compose down -v`: não é necessário recriar o volume.

Se um banco legado tiver respostas duplicadas para paciente/pergunta, o índice único interromperá a migração. Revisar essas duplicidades antes de tentar novamente; não há exclusão automática de dados clínicos.

## Executar e testar localmente

Na raiz:

```powershell
docker compose up -d --build postgres-db backend
cd web
npm start -- --port 4200
```

A API usa http://localhost:8080/api/v1 e o frontend http://localhost:4200/anamnese.

Em outro terminal, na raiz, executar opcionalmente:

```powershell
./scripts/seed-anamnese.ps1
```

O script cria apenas contas fictícias dedicadas, prepara rascunho/finalizada pela API e não substitui anamneses já preenchidas.

- Nutricionista: `anamnese@nutri4you.test`
- Senha: `NutriTeste@123`
- Amanda: cadastro inicialmente vazio.
- Bruno: rascunho parcial.
- Carla: cadastro finalizado.

As contas e senhas acima são exclusivamente para desenvolvimento. Não executar o seed em produção. Os IDs são obtidos do banco, sem depender de numeração fixa.

## Verificações

Backend:

```powershell
cd backend
./mvnw.cmd test
```

Frontend:

```powershell
cd web
npm run build
npm run lint
npm test -- --watch=false --browsers=ChromeHeadless
```

Os testes cobrem permissões, finalização, campos condicionais, valores inválidos, unicidade, conflitos, descarte de rascunho, cancelamento local e preservação dos dados após erro de rede. Os testes Java usam H2; também foi verificado o fluxo integrado no PostgreSQL local.
