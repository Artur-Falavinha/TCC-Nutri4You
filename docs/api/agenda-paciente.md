# Agenda do paciente

Base: `/api/v1/agenda`. Todas as rotas exigem JWT de paciente. O
nutricionista informado precisa manter vínculo clínico ativo com o paciente.

## Rotas

| Método | Rota | Resultado |
| --- | --- | --- |
| `GET` | `/consultas` | Lista solicitações/consultas confirmadas futuras e consultas em andamento, em ordem cronológica |
| `GET` | `/disponibilidade?nutricionistaId={id}&data=YYYY-MM-DD` | Lista horários livres do dia |
| `POST` | `/consultas` | Cria solicitação com status `AGUARDANDO_CONFIRMACAO`; HTTP 201 |
| `PUT` | `/consultas/{id}/reagendamento` | Altera uma consulta confirmada e volta o status para aguardando confirmação |
| `POST` | `/consultas/{id}/cancelamento` | Cancela uma consulta confirmada e libera o horário |

## Solicitar consulta

```json
{
  "nutricionistaId": 1,
  "dataHora": "2026-10-19T10:15"
}
```

## Reagendar consulta

```json
{
  "dataHora": "2026-10-22T11:00",
  "versao": 0
}
```

## Cancelar consulta

```json
{
  "versao": 0
}
```

## Resposta de consulta

```json
{
  "id": 1,
  "nutricionistaId": 1,
  "nutricionistaNome": "Nutricionista",
  "dataHora": "2026-10-19T10:15:00",
  "status": "AGUARDANDO_CONFIRMACAO",
  "versao": 0
}
```

As respostas são envolvidas por `ApiResponse`. A disponibilidade informa
também a duração de 45 minutos. A lista semanal cadastrada pelo nutricionista define os dias, inclusive domingos, e horários. Dias sem configuração, horários passados e intervalos que se sobrepõem a consultas não canceladas não são retornados. Veja [configuração](agenda-nutricionista.md).

## Regras e erros

- Somente consultas `CONFIRMADA`, futuras e ainda não iniciadas podem ser reagendadas ou canceladas pelo paciente. A resposta inclui `iniciadaEm`; o card mobile oculta ações após o início.
- Consultas iniciadas continuam visíveis mesmo após o horário agendado, até sua conclusão pelo nutricionista.
- Reagendamento requer nova confirmação do nutricionista.
- `versao` é obrigatória nas alterações e protege contra edição concorrente.
- Horário ocupado ou versão desatualizada retorna `409 CONFLITO`.
- A criação usa bloqueio pessimista do nutricionista para impedir dupla reserva concorrente.
- Dados inválidos, horário passado ou vínculo inativo retornam `400`.
- Consulta inexistente ou pertencente a outro paciente retorna `404`.

## Google Agenda

Não existe integração OAuth no backend. Para consultas confirmadas, o aplicativo
mobile monta localmente um link de criação de evento e abre o Google Agenda com
título, data, horário, duração e nome do profissional preenchidos. O paciente
confirma o salvamento na própria conta.

Esse fluxo não usa Google Cloud, credenciais, tokens ou faturamento. Como o
Nutri4You não recebe acesso ao calendário, eventos já salvos precisam ser
atualizados ou removidos manualmente após reagendamento ou cancelamento.
