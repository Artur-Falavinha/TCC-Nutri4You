# Exames

API backend para integração das telas web/mobile. Base `/api/v1`, JWT obrigatório. Listagens retornam `itens`, `pagina`, `totalPaginas`, `total`, com 20 itens por página. Downloads devolvem bytes, não JSON.

| Perfil | Método | Rota | Uso |
| --- | --- | --- | --- |
| Nutricionista | POST | `/gestao-pacientes/{pacienteId}/exames` | Solicitar; 201 |
| Nutricionista | GET | `/gestao-pacientes/{pacienteId}/exames?pagina=0` | Listar exames do próprio atendimento |
| Nutricionista | GET | `/gestao-pacientes/{pacienteId}/exames/{id}/arquivo` | Download autenticado |
| Nutricionista | POST | `/gestao-pacientes/{pacienteId}/exames/{id}/analise` | Registrar parecer |
| Paciente | GET | `/usuarios/me/exames?pagina=0` | Listar seus exames |
| Paciente | POST | `/usuarios/me/exames/{id}/arquivo` | Upload multipart |
| Paciente | GET | `/usuarios/me/exames/{id}/arquivo` | Download autenticado |

Solicitação: `{ "nome": "Hemograma", "descricao": "Anexar resultado para avaliação." }`. Nome obrigatório de até 150 caracteres, descrição opcional de até 5000. O servidor define autor e data.

Upload `multipart/form-data`: campos `arquivo` e `versao`. PDF, PNG ou JPEG não vazio de até 5 MiB. A API verifica assinatura inicial e correspondência ao MIME declarado; essa verificação não é antivírus nem análise estrutural completa. Bytes na coluna BYTEA existente. Nome de download gerado pelo servidor, sem caminhos fornecidos pelo cliente.

Parecer: `{ "parecer": "Resultado recebido e analisado.", "versao": 1 }`, obrigatório, até 5000 caracteres.

Estados implementados: `PENDENTE` → `ENVIADO` → `ANALISADO`. É possível substituir o arquivo enquanto ENVIADO, com versão atual. Após análise, a substituição é bloqueada para preservar o documento analisado. Não há exclusão nem análise automática de resultados.

Resposta: `id`, `pacienteId`, `nutricionistaId`, `nome`, `descricao`, `dataSolicitacao`, `dataEnvio`, `status`, `arquivoNome`, `arquivoTipo`, `arquivoTamanho`, `parecer`, `analisadoEm`, `versao`. Listagem usa projeção SQL sem carregar/serializar o binário.

Paciente só acessa seus exames. Nutricionista precisa de acesso clínico e ser o autor, mesmo em pacientes compartilhados. Download aplica as mesmas verificações, com attachment, `Cache-Control: no-store, private` e `X-Content-Type-Options: nosniff`. Arquivos legados sem MIME validado são entregues como `application/octet-stream`.

Erros: 400 validação/parâmetros; 401 sem autenticação; 403 perfil/acesso; 404 recurso alheio/inexistente; 409 versão; 413 limite multipart. O limite verificado dentro do serviço retorna 400; o limite barrado pelo servidor multipart retorna 413.

V12 preserva exames existentes e adiciona metadados, versão e parecer. As telas pertencem à frente de Deretti e a revisão visual à de Artur. Alinhar estados e limite de upload antes da integração final.
