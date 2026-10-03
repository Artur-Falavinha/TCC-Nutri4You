# Ciclo do plano alimentar — Sprint 4

Base: `/api/v1`. Todas as respostas usam o envelope `ApiResponse`.

## Regras

- O nutricionista pode criar e alterar apenas rascunhos de pacientes aos quais tem acesso clínico (relação ativa ou consulta). Um plano pertence ao nutricionista autor; outro profissional não lê seu rascunho nem seu histórico.
- `idConsulta` é opcional. Quando informado, a consulta deve ser do mesmo paciente e nutricionista e não pode já estar associada a outro plano.
- O rascunho pode ter vigência incompleta. A publicação exige `vigenciaInicio` igual ou posterior à data atual em `America/Sao_Paulo`; `vigenciaFim` é inclusiva e opcional.
- A publicação é atômica por paciente. Existe no máximo um plano publicado vigente em uma data. Um novo plano encerra a vigência anterior na véspera do início; se ambos começarem no mesmo dia, o anterior passa a `SUBSTITUIDO`. Um plano futuro já publicado com vigência sobreposta gera `409`.
- Planos publicados são imutáveis. Uma revisão deve ser criada como novo rascunho. A versão enviada ao editar ou publicar impede que uma aba antiga sobrescreva mudanças recentes.
- O paciente só consulta seu próprio plano publicado e vigente. Antes do início, após o fim ou sem publicação, `data` é `null` com HTTP `200`.
- Esta etapa cobre o ciclo e as metas do plano. Refeições, alimentos, cálculo nutricional e lista de compras são entregas separadas da Sprint 4; o retorno da dieta ativa ainda não inclui esses itens.

## Endpoints

| Método | Rota | Perfil | Uso |
| --- | --- | --- | --- |
| `POST` | `/gestao-pacientes/{pacienteId}/planos` | Nutricionista | Cria rascunho (`201`) |
| `GET` | `/gestao-pacientes/{pacienteId}/planos` | Nutricionista | Lista somente seus planos, recentes primeiro |
| `GET` | `/gestao-pacientes/{pacienteId}/planos/{planoId}` | Nutricionista | Detalha plano próprio |
| `PUT` | `/gestao-pacientes/{pacienteId}/planos/{planoId}` | Nutricionista | Altera rascunho |
| `POST` | `/gestao-pacientes/{pacienteId}/planos/{planoId}/publicacao` | Nutricionista | Publica rascunho |
| `GET` | `/usuarios/me/dieta-ativa` | Paciente | Consulta plano vigente próprio |

Corpo de criação e edição:

```json
{
  "idConsulta": null,
  "vigenciaInicio": "2026-10-08",
  "vigenciaFim": "2026-11-07",
  "metaKcal": 1800,
  "metaCarboidratos": 210,
  "metaGordura": 60,
  "metaProteina": 120,
  "versao": 0
}
```

Na criação, `versao` é ignorada. Na edição, é obrigatória e deve corresponder à última resposta. Os campos opcionais omitidos assumem `null`. Os valores de metas aceitam de `0` a `9999,99`. A edição substitui os metadados do rascunho inteiro.

Publicação:

```json
{ "versao": 0 }
```

Resposta de plano (`data`):

```json
{
  "id": 1,
  "idPaciente": 2,
  "idNutricionista": 1,
  "idConsulta": null,
  "status": "PUBLICADO",
  "vigenciaInicio": "2026-10-08",
  "vigenciaFim": "2026-11-07",
  "metaKcal": 1800.00,
  "metaCarboidratos": 210.00,
  "metaGordura": 60.00,
  "metaProteina": 120.00,
  "criadoEm": "2026-10-02T12:00:00Z",
  "publicadoEm": "2026-10-08T12:00:00Z",
  "versao": 1
}
```

Erros principais: `400` para dados/vigência inválidos, `403` para paciente sem relação clínica ou perfil incorreto, `404` para plano inexistente ou de outro nutricionista, `409` para versão antiga, plano já publicado, consulta usada ou vigência futura sobreposta.
