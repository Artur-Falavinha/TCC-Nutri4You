# Plano alimentar e refeições semanais

Base `/api/v1`, envelope `ApiResponse`, JWT obrigatório. O nutricionista acessa seus próprios planos; o paciente acessa apenas sua dieta publicada e vigente.

| Método | Rota | Uso |
| --- | --- | --- |
| POST | `/gestao-pacientes/{pacienteId}/planos` | Criar rascunho; 201 |
| GET | `/gestao-pacientes/{pacienteId}/planos` | Listar planos do autor |
| GET | `/gestao-pacientes/{pacienteId}/planos/{planoId}` | Detalhar, incluindo refeições |
| PUT | `/gestao-pacientes/{pacienteId}/planos/{planoId}` | Editar metadados do rascunho |
| POST | `/gestao-pacientes/{pacienteId}/planos/{planoId}/publicacao` | Publicar com `{ "versao": 0 }` |
| GET | `/usuarios/me/dieta-ativa` | Plano vigente; `data: null` quando ausente |
| GET | `/alimentos?q=arroz` | Busca por nome, sem distinguir maiúsculas; 2 a 150 caracteres, até 30 resultados |

Criação/edição:

```json
{
  "idConsulta": null,
  "vigenciaInicio": "2030-01-01",
  "vigenciaFim": null,
  "metaKcal": 2000,
  "metaProteina": 100,
  "metaCarboidratos": 250,
  "metaGordura": 65,
  "versao": 0
}
```

Versão obrigatória na edição, ignorada na criação. Metas diárias comuns aos sete dias, opcionais, de 0 a 9999,99. Fim da vigência inclusivo. Publicação exige início hoje ou no futuro no fuso da clínica. Rascunhos podem ter vigência incompleta. A consulta vinculada é opcional, deve pertencer ao mesmo atendimento e não pode ter outro plano.

A publicação serializa pelo paciente: encerra o plano anterior na véspera, ou o substitui quando os inícios são iguais; rejeita sobreposição com plano futuro. Publicados são imutáveis. Revisões exigem novo rascunho. O dashboard também ignora rascunhos e planos expirados.

## Refeições

Base `R = /gestao-pacientes/{pacienteId}/planos/{planoId}/refeicoes`.

| Método | Rota | Uso |
| --- | --- | --- |
| POST | R | Adicionar refeição |
| PUT | R + `/{id}` | Substituir dados e alimentos |
| DELETE | R + `/{id}?versaoPlano=3` | Excluir refeição e itens |
| POST | R + `/{id}/replicacao` | Copiar para outros dias |

```json
{
  "nome": "Almoço",
  "horario": "12:00",
  "diaSemana": 1,
  "itens": [{ "alimentoId": 1, "quantidadeGramas": 150 }],
  "versaoPlano": 3
}
```

Replicação: `{ "dias": [2, 4, 7], "versaoPlano": 4 }`. Cópias independentes, sem sobrescrever refeições existentes; destinos distintos entre si e do dia de origem. Cada alteração retorna o plano completo com nova versão. Alterações somente nos alimentos também invalidam a versão anterior. Em 409, recarregar antes de reenviar.

Dias ISO de 1 a 7; até 140 refeições por plano e 50 alimentos distintos por refeição. Quantidades de 0,01 a 9999,99 gramas, com até duas casas decimais. O servidor calcula nutrientes usando valor por 100 g × quantidade / 100, arredondado a duas casas; não aceita totais fornecidos pelo cliente.

Cada refeição/item retorna `kcal`, `proteina`, `carboidratos`, `gordura`. Nutrientes ausentes são `null`, inclusive no total, sem conversão em zero. V11 adiciona gordura sem inventar dados para o catálogo existente. O catálogo precisa ser completado com uma fonte revisada.

A web soma apenas refeições do dia selecionado. Exceder metas não bloqueia inclusão/publicação. O percentual pode superar 100%; a barra é limitada visualmente. Esse progresso representa planejamento prescrito, não consumo. Exclusão pede confirmação; busca cancela respostas antigas durante a digitação.

Não inclui consumo por refeição, metas diferentes para cada dia nem cópia integral de plano publicado. Refeições anteriores à V11 recebem segunda-feira; revisar registros legados na integração.

Erros: 400 validação, 403 perfil/acesso, 404 plano/refeição inexistente ou de outro autor, 409 versão/publicação/vigência.
