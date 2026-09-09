# **ROADMAP DE DESENVOLVIMENTO \- NUTRI4YOU**

## Plano quinzenal de implementação do TCC

**Período geral:** 26/08/2026 a 30/11/2026

**Prazo interno de desenvolvimento:** 11/11/2026 — meta para ter o escopo funcional basicamente pronto. Não é a data de entrega acadêmica; a equipe reserva o período seguinte para montar a apresentação do TCC e manter margem para ajustes finais no sistema.

**Entrega acadêmica prevista:** 30/11/2026

**Cadência:** 7 sprints, sendo as cinco primeiras quinzenais, a Sprint 6 encurtada até 11/11 e a Sprint 7 dedicada à apresentação do TCC, ajustes finais e preparação para a banca.

Kickoff e Sprint Planning inicial com o orientador: 26/08/2026

**Equipe:** Artur Lachoman Falavinha, Arthur Henrique Deretti e Gabriel de Paula Brasil

**Orientação:** Prof. Dr. Alessandro Brawerman

**Solução:** Aplicação web em Angular, aplicativo móvel em React Native, API REST em Java/Spring Boot e banco de dados PostgreSQL

# **1\. Objetivo, escopo e premissas**

O roadmap organiza o desenvolvimento do Nutri4You em entregas quinzenais baseadas na especificação, nos protótipos e nos requisitos do TCC. A prioridade é integrar o trabalho do nutricionista à rotina do paciente. A API REST concentra as regras de negócio, a autenticação e a persistência usadas pelas aplicações web e mobile.

**Resultado esperado:** ao final da Sprint 6 (11/11), a equipe deverá ter o escopo funcional implementado e integrado. Entre 12/11 e 30/11, o foco principal passa a ser a apresentação do TCC, a estabilização da versão demonstrável, ajustes finais necessários e a consolidação da documentação e das evidências de teste.

**Escopo de implementação:** atender aos requisitos funcionais RF01 a RF16 e aplicar os requisitos não funcionais RNF01 a RNF10 ao longo do projeto. Hidratação, autocadastro e validação de e-mail também fazem parte da implementação.

* **Web:** autenticação, gestão de pacientes, anamnese, avaliações antropométricas, histórico, prescrição alimentar, agenda, exames e dashboards previstos no protótipo.  
* **Mobile:** autocadastro, validação de e-mail, autenticação, dados pessoais, dieta ativa, consumo diário, hidratação, lista de compras, evolução, agendamento e envio ou acompanhamento de exames.  
* **Backend e dados:** API REST versionada em /api/v1, JWT, autorização por perfil, PostgreSQL, regras de domínio, suporte aos fluxos de validação de e-mail e hidratação, integração com Tabela TACO e Google Calendar.  
* **Qualidade:** testes automatizados, revisão de código, CI, proteção de segredos, tratamento de erros, documentação da API e evidências de cada Sprint Review.

**Evolução do escopo e atualização da documentação:** o roadmap representa o planejamento inicial e pode ser ajustado ao longo do desenvolvimento, conforme a equipe identifica detalhes técnicos, necessidades de implementação ou oportunidades de melhoria. Hidratação, autocadastro e validação de e-mail fazem parte do planejamento atual. Seus requisitos, histórias, contratos da API e critérios de aceite devem ser refinados e atualizados no backlog conforme as decisões forem tomadas. Ajustes de escopo, prioridade ou prazo devem ser registrados e alinhados com o orientador quando afetarem a entrega acadêmica.

**Limite de conformidade:** o projeto implementará controles alinhados à LGPD, como finalidade, necessidade, segurança e restrição de acesso, sem declarar conformidade jurídica completa.

**Premissa sobre o código:** a Sprint 1 começa pela auditoria da estrutura existente do repositório; o roadmap não pressupõe a criação de vários repositórios nem a inexistência de código prévio.

# **2\. Modelo de execução e critérios de qualidade**

**Cerimônias:** Sprint Planning no primeiro dia, acompanhamento curto ao longo da quinzena, refinamento na metade da sprint, Sprint Review com demonstração e retrospectiva no último dia.

**Fluxo do quadro:** Backlog \-\> Pronto para desenvolvimento \-\> Em andamento \-\> Revisão \-\> Testes \-\> Concluído. Nenhum item entra em andamento sem responsável primário e critério de aceite.

**Justificativa do uso de DoR:** o projeto depende da integração entre backend, web e mobile. Quando uma tarefa começa sem regra de negócio, contrato de API, dependências ou critério de aceite definidos, a dúvida pode bloquear mais de uma frente e gerar retrabalho. O DoR estabelece o mínimo que a equipe precisa entender antes de iniciar o desenvolvimento.

**Definition of Ready (DoR):** uma história está pronta quando possui objetivo, perfil, requisito ou história relacionada, protótipo ou regra de interface aplicável, contrato de API, dependências e critérios de aceite compreendidos.

* A regra de negócio e o perfil autorizado estão definidos.  
* Os dados de entrada, saída e erros esperados estão identificados.  
* A dependência de outra história, serviço externo ou migração está explícita.  
* O tamanho permite conclusão e demonstração dentro da sprint.

**Justificativa do DoD:** terminar o código de uma funcionalidade não significa que ela esteja pronta para demonstração ou uso. O DoD aplica o mesmo padrão de conclusão às três frentes e exige revisão, testes, integração, documentação e evidências. Com isso, a equipe evita acumular pendências para o prazo interno de **11/11/2026** e consegue reservar a Sprint 7 para apresentação e ajustes finais.

**Definition of Done (DoD):** um item somente é concluído quando atende simultaneamente aos critérios abaixo.

* Código revisado e integrado à branch principal conforme o fluxo adotado pela equipe.  
* Build, lint e testes automatizados relacionados executados com sucesso no CI.  
* Migrações, contratos da API e variáveis de ambiente documentados quando aplicável.  
* Autorização por perfil e cenários de erro testados nas funcionalidades protegidas.  
* Interface compatível com o protótipo e com estados de carregamento, vazio, sucesso e erro.  
* Fluxo demonstrado na Sprint Review e evidência registrada no quadro do projeto.  
* Artigo, especificação ou documentação técnica atualizados quando a implementação alterar decisões registradas.

**Qualidade contínua:** testes e segurança fazem parte de cada sprint. Toda entrega deve incluir testes de unidade ou integração de acordo com o risco da funcionalidade. Até **11/11/2026**, cada módulo deve nascer testado e integrado; na Sprint 7, a equipe consolida testes ponta a ponta, de desempenho, segurança e regressão nos fluxos da banca.

# **3\. Marcos do projeto**

* Marco M0 \- Baseline executável: final da Sprint 1, com ambientes, banco, CI e fluxo técnico mínimo funcionando.  
* Marco M1 \- MVP clínico seguro: final da Sprint 3, com autenticação, pacientes, anamnese, medidas e histórico demonstráveis.  
* Marco M2 \- Experiência nutricional integrada: final da Sprint 5, com prescrição web e acompanhamento do paciente no mobile.  
* Marco M3 \- Escopo funcional completo: **11/11/2026** (final da Sprint 6), com agenda, Google Calendar e exames integrados aos módulos anteriores.  
* Marco M4 \- Apresentação estruturada: meados de nov/2026, com roteiro, slides e ensaio da demonstração definidos.  
* Marco M5 \- Validação final com o orientador: 25/11/2026.  
* Marco M6 \- Entrega acadêmica prevista: 30/11/2026, com versão candidata à banca, documentação e plano de contingência.

# **4\. Roadmap quinzenal**

## **Sprint 1 \- Fundação técnica e primeiro fluxo integrado**

**Período:** 27/08/2026 a 09/09/2026

**Objetivo:** estabelecer uma base reproduzível para API, web, mobile, banco de dados e integração contínua, reduzindo riscos técnicos antes dos módulos de negócio.

**Requisitos relacionados:** RNF09 e RNF10, além da base necessária para RNF01 a RNF08.

**Entregáveis:** 

* Criar o repositório e registrar sua estrutura na documentação inicial.  
* Inicializar ou consolidar a API Spring Boot com versionamento /api/v1, tratamento padrão de respostas e endpoint de saúde.  
* Criar as migrações iniciais do PostgreSQL a partir do DER, incluindo chaves, relacionamentos, restrições e dados mínimos de desenvolvimento.  
* Inicializar ou consolidar Angular e React Native com ambientes, rotas ou navegação base e cliente de API.  
* Configurar CI para build, lint e testes das frentes existentes, com secrets fora do repositório.  
* Executar provas de viabilidade de Tabela TACO, autenticação do Google Calendar, armazenamento de arquivos e ambiente de implantação.

**Critérios de aceite:** 

* Uma instalação limpa consegue iniciar API, web, mobile e banco seguindo instruções documentadas.  
* As migrações recriam o banco do zero sem intervenção manual e preservam integridade referencial.  
* Web e mobile consultam o endpoint de saúde da API em ambiente de desenvolvimento.  
* O pipeline executa automaticamente e termina sem falhas para a baseline aprovada.  
* Decisões arquiteturais e riscos dos serviços externos ficam registrados para as próximas sprints.

**Dependências e riscos:** acesso ao código, versões das ferramentas, credenciais de serviços externos e aderência do DER ao domínio atual.

**Marco da Sprint Review:** demonstrar o fluxo técnico cliente \-\> API \-\> PostgreSQL	 e apresentar a baseline de CI.

## **Sprint 2 \- Autenticação, usuários e gestão de pacientes**

**Período:** 10/09/2026 a 23/09/2026

**Objetivo:** entregar os fluxos de autocadastro, validação de e-mail e acesso seguro para nutricionista e paciente, além da gestão de pacientes pelo nutricionista.

**Requisitos e histórias:** RF01 a RF04; HU001, HU017, HU002, HU018, HU003, parte cadastral da HU004 e HU019; autocadastro e validação de e-mail, ainda pendentes de formalização na especificação; RNF01, RNF02 e RNF04.

**Entregáveis:** 

* Implementar autocadastro do paciente, validação de e-mail, login, validação de token, recuperação e redefinição de senha, expiração e perfis NUTRICIONISTA e PACIENTE.  
* Implementar /usuarios/me e os endpoints de pacientes para listar, buscar, cadastrar, editar, inativar e reativar.  
* Construir no Angular as telas de autocadastro, validação de e-mail, login, recuperação de senha e gestão de pacientes, incluindo filtros e estados de vazio, erro e confirmação.  
* Construir no React Native login, recuperação de senha e edição dos dados pessoais permitidos.  
* Padronizar validações, mensagens genéricas de autenticação e tratamento de usuário inativo, token expirado e acesso proibido.

**Critérios de aceite:** 

* Paciente conclui o autocadastro, valida o e-mail e acessa a conta com o perfil correto. Credenciais inválidas, usuário inativo e token expirado são rejeitados conforme a regra definida.  
* Nutricionista executa o ciclo completo de cadastro, busca, edição, inativação e reativação de paciente.  
* Paciente altera somente os próprios dados permitidos e não acessa rotas exclusivas do nutricionista.  
* Testes automatizados cobrem autocadastro, validação de e-mail, autenticação, perfis, validações e principais códigos HTTP.  
* Logs e respostas não expõem senha, hash, token temporário ou dados sensíveis desnecessários.

**Dependências e riscos:** serviço de e-mail, definição das regras de autocadastro e validação, política de senha, vínculo nutricional e consistência entre usuários e pacientes. Os requisitos e endpoints ainda ausentes devem ser incluídos na especificação durante a sprint.

**Marco da Sprint Review:** demonstrar autocadastro, validação de e-mail e login, além da gestão completa de pacientes pela aplicação web.

## **Sprint 3 \- Núcleo clínico, antropometria e histórico**

**Período:** 24/09/2026 a 07/10/2026

**Objetivo:** centralizar os principais registros clínicos do atendimento e disponibilizar evolução cronológica ao nutricionista.

**Requisitos e histórias:** RF05 e RF08; HU004 e HU015; preparação de dados para RF09 e HU024; RNF05, RNF09 e RNF10.

**Entregáveis:** 

* Implementar perguntas e respostas de anamnese por categoria, com validação, data de atualização e histórico coerente com o modelo adotado.  
* Implementar avaliações antropométricas e cálculos na entidade de domínio AvaliacaoAntropometrica, incluindo IMC e indicadores definidos pela equipe.  
* Construir as telas web de dados do paciente, anamnese, registro de medidas, histórico e estados sem consulta ou sem dados.  
* Disponibilizar endpoints de histórico para consultas e medidas em ordem cronológica.  
* Implementar uma versão inicial do dashboard web utilizando apenas dados já persistidos, sem inventar indicadores clínicos.  
* Adicionar testes de autorização para impedir que um nutricionista consulte pacientes fora de seu acompanhamento.

**Critérios de aceite:** 

* Nutricionista registra e atualiza anamnese válida sem perda indevida dos dados anteriores.  
* Peso, altura e demais medidas válidas geram cálculos determinísticos e cobertos por testes de unidade.  
* Histórico exibe registros em ordem cronológica e apresenta estado vazio quando não há dados.  
* A API retorna 403 para acesso a paciente sem vínculo e 404 para identificador inexistente.  
* Uma nova medida registrada aparece no histórico após atualização da tela.

**Dependências e riscos:** validação das fórmulas, unidades de medida, decisão sobre versionamento da anamnese e consistência entre consulta e avaliação.

**Marco da Sprint Review:** demonstrar cadastro clínico de um paciente e visualização de sua evolução na aplicação web.

## **Sprint 4 \- Prescrição alimentar, TACO e lista de compras**

**Período:** 08/10/2026 a 21/10/2026

**Objetivo:** permitir ao nutricionista montar e publicar um plano alimentar e gerar a lista de compras derivada.

**Requisitos e histórias:** RF10 a RF14; HU012 e HU021; RNF05 e RNF09.

**Entregáveis:** 

* Importar ou integrar a base TACO validada e disponibilizar busca paginada por nome ou categoria.  
* Implementar ciclo do plano alimentar com vigência, rascunho, publicação e consulta da dieta ativa.  
* Implementar refeições, alimentos, gramagens, inclusão, alteração, remoção e recálculo dos totais nutricionais.  
* Construir no Angular a prescrição alimentar conforme o protótipo, incluindo validações e estados de edição.  
* Implementar geração da lista de compras com agrupamento de alimentos e quantidades.  
* Construir no mobile a primeira versão da dieta ativa e da lista de compras com marcação de itens.

**Critérios de aceite:** 

* Nutricionista cria plano, adiciona refeições e alimentos, altera quantidades e remove itens sem inconsistência nos totais.  
* A publicação torna a dieta disponível apenas ao paciente vinculado e ao nutricionista responsável.  
* Busca de alimentos retorna dados nutricionais da fonte escolhida e trata ausência de resultados.  
* Lista de compras agrega itens repetidos, mantém quantidades coerentes e recalcula pendências ao marcar uma compra.  
* Testes cobrem recálculo nutricional, integridade do plano e autorização dos endpoints.

**Dependências e riscos:** qualidade e formato da TACO, regras de arredondamento, unidade dos alimentos e definição clara do estado ativo do plano.

**Marco da Sprint Review:** criar e publicar uma dieta na web e visualizá-la com sua lista de compras no mobile.

## **Sprint 5 \- Experiência mobile e acompanhamento diário**

**Período:** 22/10/2026 a 04/11/2026

**Objetivo:** reunir no aplicativo do paciente o acompanhamento da dieta, do consumo diário, da hidratação e da evolução.

**Requisitos e histórias:** RF09 e RF15, com integração dos RF13 e RF14; HU020 e HU024; funcionalidade de hidratação a ser formalizada na especificação; RNF05 e RNF07.

**Entregáveis:** 

* Implementar endpoints de consumo diário, remoção de registro e progresso de calorias e macronutrientes por data.  
* Consolidar a tela inicial mobile com dieta ativa, consultas, metas e atalhos definidos no protótipo.  
* Finalizar os fluxos mobile de dieta, registro de consumo e lista de compras.  
* Implementar dashboard de evolução com dados antropométricos e de consumo, incluindo estado sem dados suficientes.  
* Garantir estados de carregamento, erro, vazio, atualização e compatibilidade mínima em Android.  
* Implementar o registro e o acompanhamento diário de hidratação no mobile, com persistência dos dados pela API.

**Critérios de aceite:** 

* Paciente registra e remove consumo, registra a hidratação e visualiza os totais do dia recalculados pela API.  
* Nova medida registrada pelo nutricionista aparece no dashboard do paciente em ordem cronológica.  
* Ausência de dieta ou histórico produz orientação clara, sem tela quebrada ou valores fictícios.  
* O fluxo web prescreve dieta \-\> mobile consulta \-\> paciente registra consumo e hidratação funciona ponta a ponta.  
* Acesso a consumo, dieta e evolução de outro paciente é bloqueado.

**Dependências e riscos:** disponibilidade de dados para os gráficos, sincronização entre clientes, desempenho em dispositivos e definição das regras de hidratação na especificação.

**Marco da Sprint Review:** demonstrar o acompanhamento diário do paciente, incluindo dieta publicada, consumo e hidratação.

## **Sprint 6 \- Agenda, Google Calendar e exames**

**Período:** 05/11/2026 a 11/11/2026 *(sprint encurtada — prazo interno de desenvolvimento)*

**Objetivo:** concluir até 11/11 a organização de consultas e o intercâmbio de exames, fechando o escopo funcional previsto para o sistema, sem comprometer os dados internos quando serviços externos falharem.

**Requisitos e histórias:** RF06, RF07 e RF16; HU008, HU025 e fluxos de exames associados às HU004 e HU015; RNF08.

**Entregáveis:** 

* Implementar disponibilidade, agenda, solicitação, confirmação e cancelamento com os status padronizados da especificação.  
* Construir a agenda web mensal e semanal, gestão de disponibilidade e ações de confirmação ou cancelamento.  
* Construir no mobile consulta de horários, solicitação e cancelamento de agendamento.  
* Implementar autorização e sincronização com Google Calendar usando apenas dados mínimos e não clínicos.  
* Implementar solicitação, upload, listagem e atualização de status de exames, com validação de tipo e tamanho de arquivo.  
* Construir os fluxos web e mobile de exames e cobrir falhas de armazenamento, autorização expirada e conflito de agenda.

**Critérios de aceite:** 

* Horário ocupado ou conflito impede confirmação duplicada e retorna resposta compatível com 409\.  
* Cancelamento altera o status interno e libera o horário conforme a regra de negócio.  
* Falha no Google Calendar mantém a consulta registrada internamente e sinaliza a pendência de sincronização.  
* Nenhum dado clínico, exame, medida ou detalhe da dieta é enviado ao calendário externo.  
* Nutricionista solicita exame, paciente envia arquivo válido e ambos visualizam o status conforme suas permissões.

**Dependências e riscos:** OAuth do Google, conflitos de fuso horário, armazenamento seguro, limites de arquivo e tratamento assíncrono de falhas.

**Marco da Sprint Review:** demonstrar agendamento e exame nos dois clientes, incluindo um cenário controlado de falha externa, e registrar o encerramento do desenvolvimento funcional previsto para 11/11.

## **Sprint 7 \- Apresentação, ajustes finais e entrega do TCC**

**Período:** 12/11/2026 a 30/11/2026

**Objetivo:** priorizar a construção da apresentação do TCC e reservar margem para ajustes finais no sistema, estabilização da versão demonstrável e preparação para a banca. O feature freeze entra em vigor no início desta sprint; novas funcionalidades obrigatórias não entram após 11/11.

**Requisitos relacionados:** validação integrada de RF01 a RF16, RNF01 a RNF10 e das funcionalidades incorporadas ao escopo por atualização documental.

**Entregáveis:** 

* **Apresentação do TCC:** estruturar slides, roteiro da demonstração, divisão de falas, vídeo ou plano alternativo e ensaios com tempo controlado.  
* **Ajustes finais do sistema:** corrigir apenas defeitos críticos e pendências que impactem a demonstração; refinar responsividade, acessibilidade básica, mensagens, estados de interface e consistência com o Figma quando couber na margem disponível.  
* Executar testes ponta a ponta, regressão, smoke de desempenho e revisão de segurança e autorização nos fluxos escolhidos para a banca.  
* Implantar API, banco e clientes necessários à demonstração, com variáveis seguras, migrações, dados fictícios e procedimento de rollback.  
* Atualizar artigo e especificação com resultados reais, decisões alteradas, limitações e capturas do sistema funcionando.  
* Consolidar manual de execução, documentação da API, evidências de teste e lista de limitações conhecidas.

**Critérios de aceite:** 

* Pipeline final está verde e não existem defeitos críticos abertos nos fluxos escolhidos para a banca.  
* Ambiente de demonstração pode ser recriado, possui dados fictícios e não contém segredos ou dados reais de pacientes.  
* Os fluxos de autocadastro, validação de e-mail, nutricionista \-\> paciente e paciente \-\> nutricionista são executados ponta a ponta sem intervenção manual no banco.  
* Controles de perfil, HTTPS em produção, integridade referencial e tolerância à falha externa foram verificados.  
* Documentação acadêmica e técnica corresponde ao comportamento efetivamente demonstrado.  
* Equipe possui plano de contingência para indisponibilidade de internet ou serviço externo.

**Dependências e riscos:** tempo de correção, estabilidade do provedor de nuvem, divergência entre documentação e código e mudanças tardias de escopo.

**Marco da Sprint Review:** apresentar a versão candidata à banca, executar a demonstração completa e registrar o aceite interno.

# **5\. Rastreabilidade entre requisitos e sprints**

* Sprint 1: RNF09 e RNF10; fundamentos técnicos para todos os demais requisitos não funcionais.  
* Sprint 2: RF01 a RF04; HU001, HU017, HU002, HU018, HU003, parte cadastral da HU004 e HU019; autocadastro e validação de e-mail a serem formalizados na especificação.  
* Sprint 3: RF05 e RF08; HU004 e HU015; preparação dos dados utilizados por RF09 e HU024.  
* Sprint 4: RF10 a RF14; HU012 e HU021.  
* Sprint 5: RF09 e RF15; HU020 e HU024; validação integrada dos RF13 e RF14; hidratação a ser formalizada na especificação.  
* Sprint 6: RF06, RF07 e RF16; HU008, HU025 e fluxos de exames associados às HU004 e HU015.  
* Sprint 7: regressão dos RF01 a RF16, verificação integrada dos RNF01 a RNF10, apresentação do TCC e ajustes finais do sistema.

**Regra de rastreabilidade:** cada cartão do quadro deve referenciar ao menos um RF, RNF, HU, decisão técnica ou obrigação acadêmica. Quando uma funcionalidade prevista ainda não possui RF ou HU, o cartão também deve incluir a tarefa de atualizar a especificação.

# **6\. Caminho crítico e dependências**

1. Fundação técnica, migrações e CI habilitam todos os demais módulos.  
2. Autenticação, perfis e vínculo nutricional antecedem qualquer acesso a dados clínicos.  
3. Cadastro do paciente antecede anamnese, medidas, histórico, dieta, agenda e exames.  
4. Anamnese e medidas geram os dados necessários aos históricos e dashboards.  
5. Prescrição e publicação da dieta antecedem consumo diário e lista de compras no mobile.  
6. Agenda interna deve funcionar antes da sincronização com Google Calendar; falha externa nunca apaga o registro interno.  
7. Implantação depende de pipeline estável, migrações reproduzíveis, segredos configurados e dados fictícios de demonstração.

# **7\. Riscos, contingência e controle de mudanças**

* **Escopo e prazo: acompanhar a capacidade da equipe a cada Sprint Planning e Sprint Review. Se houver desvio ou surgirem necessidades identificadas durante a implementação, a equipe deve registrar o replanejamento, avaliar dependências e preservar os fluxos ponta a ponta mais relevantes para a entrega. Hidratação, autocadastro e validação de e-mail fazem parte do planejamento atual e podem ser refinados ou reordenados conforme a evolução do projeto.**  
* **Integrações externas:** validar cedo OAuth, TACO, e-mail, armazenamento e nuvem; manter adaptadores e comportamento interno independente.  
* **Segurança:** não usar dados reais de pacientes, manter segredos fora do código e testar autorização negativa em todas as rotas sensíveis.  
* **Qualidade dos dados:** validar unidades, arredondamentos, status e relacionamentos antes de construir dashboards ou relatórios.  
* **Dependência entre frentes:** publicar contratos de API e dados de exemplo antes de bloquear web ou mobile.  
* **Prazo acadêmico:** encerrar o desenvolvimento funcional em **11/11/2026**; reservar a Sprint 7 (12/11 a 30/11) principalmente para apresentação do TCC, ajustes finais e documentação, sem aceitar novas funcionalidades obrigatórias após o feature freeze.

**Controle de mudança: mudanças em RF, prazo, prioridade ou escopo devem ser registradas no backlog e avaliadas quanto às dependências, ao impacto na entrega e à capacidade da equipe. Funcionalidades previstas no artigo ou no Figma, mas ausentes da especificação, devem ser incorporadas à documentação de acordo com as decisões de implementação. Alterações que afetem a entrega acadêmica devem ser alinhadas com o orientador.**

**Ordem de contingência: primeiro reduzir refinamentos cosméticos e simplificar visualizações avançadas sem remover dados essenciais. Quando for necessário replanejar funcionalidades, a equipe deve priorizar o impacto nos fluxos ponta a ponta, registrar a decisão no backlog e alinhar mudanças relevantes com o orientador.**

# **8\. Evidências, acompanhamento e aceite final**

**Evidências mínimas por Sprint Review:** 

* Quadro atualizado com responsáveis, status, impedimentos e itens movidos para a próxima sprint com justificativa.  
* Referência da versão demonstrada no Git, resultado do CI e relatório dos testes relevantes.  
* Lista de endpoints, migrações e decisões técnicas adicionadas ou alteradas.  
* Capturas, gravação curta ou roteiro reproduzível do fluxo apresentado.  
* Defeitos conhecidos, riscos atualizados e decisões tomadas na retrospectiva.

**Fluxos obrigatórios para o aceite final:** 

* Paciente realiza o autocadastro, valida o e-mail e acessa a conta. O nutricionista cadastra o paciente, registra anamnese e medidas, publica a dieta e acompanha o histórico. No mobile, o paciente consulta a dieta, registra consumo e hidratação e visualiza sua evolução.  
* Paciente solicita consulta; nutricionista visualiza, confirma ou cancela; a sincronização externa funciona ou falha sem perda do dado interno.  
* Nutricionista solicita exame; paciente envia arquivo válido; ambos visualizam o andamento respeitando as permissões.  
* Ambiente implantado, documentação e apresentação reproduzem os mesmos fluxos e registram limitações reais.

**Base de planejamento:** artigo do TCC, especificação técnica, protótipos web e mobile no Figma e auditoria do repositório prevista na Sprint 1\.

