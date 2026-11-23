# Privacidade e retenção no Nutri4You

## Implantação

Antes de tratar dados reais, a organização responsável precisa identificar os controladores e operadores de cada tratamento, definir as bases legais e nomear quem atende aos titulares. Revise o aviso público junto com esses responsáveis e publique nova versão sempre que o texto ou as condições de tratamento mudarem. Os termos de uso são aceitos separadamente do ato de pedir ou aceitar um vínculo clínico. Use a tutela da saúde como base apenas nos tratamentos que efetivamente atendam aos requisitos legais dessa hipótese. Registre a base legal das outras finalidades separadamente.

## Operação dos direitos do titular

A área **Privacidade** permite abrir o PDF e consultar a versão e a data do aceite registrado no cadastro. Para solicitações sobre seus dados pessoais, o sistema orienta o contato com a informática da UFPR pelo e-mail [suporte@ufpr.br](mailto:suporte@ufpr.br) e encaminha às [orientações de direitos do titular](https://ufpr.br/lgpd/direitos-do-titular/). O sistema não recebe, armazena ou apresenta solicitações e protocolos; esse processo é tratado pelos canais externos da UFPR. A tabela legada `pedido_privacidade`, criada pela V24 mas nunca integrada ao fluxo da aplicação, é removida pela V30. O registro de aceite dos termos permanece em `aceite_termo`. Essa tabela usa `(tipo, titular_id)` como referência polimórfica a paciente ou nutricionista: não há uma FK física única que possa apontar condicionalmente para duas tabelas, e o serviço valida o tipo e o titular antes da gravação.

Para eliminação, o responsável pelo atendimento externo deve identificar o conjunto exato de registros e seus vínculos no banco, arquivos clínicos e cópias de segurança. Classifique os dados conforme a finalidade e as obrigações legais de guarda. Informe ao titular o que puder ser eliminado e o que precisar ficar protegido, com a justificativa. Se houver dados elegíveis, valide a exclusão ou anonimização primeiro em ambiente isolado, verifique o encadeamento das referências e execute em transação aprovada. Concilie arquivos e backups com a política do controlador, inclusive após restaurações. Confira que os dados conservados continuam inacessíveis a usuários sem escopo. Não há exclusão física automática nem tarefa de descarte por idade nesta versão.

A guarda de prontuário segue a classificação e as obrigações aplicáveis à operação. A Lei 13.787/2018 e a Resolução CFN 594/2017 usam 20 anos do último registro como referência para eventual descarte dos prontuários abrangidos. A data de término do vínculo não inicia esse prazo. Aplique o art. 16 da LGPD quando houver obrigação de conservação e restrinja o uso desses dados à finalidade que justifica a guarda.

## Referências oficiais

- [LGPD, arts. 9º, 11, 15 a 19 e 46](https://www.gov.br/saude/pt-br/acesso-a-informacao/lgpd/legislacao/lei-no-13-709-18)
- [ANPD — Direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares)
- [Lei 13.787/2018, art. 6º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm)
- [Resolução CFN 594/2017](https://www.cfn.org.br/wp-content/uploads/resolucoes/DOU_594.pdf)
