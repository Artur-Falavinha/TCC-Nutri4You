# Agenda do nutricionista

Base `/api/v1`. JWT de nutricionista obrigatório. Horários civis da clínica em `America/Sao_Paulo`; duração mantida em 45 minutos.

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/agenda-nutricionista/horarios` | Lista semanal do próprio profissional |
| PUT | `/agenda-nutricionista/horarios` | Substitui a lista semanal inteira e retorna a lista ordenada |
| GET | `/agenda-nutricionista/notificacoes` | Lista todas as solicitações futuras pendentes, de primeira consulta ou acompanhamento |
| POST | `/agenda-nutricionista/notificacoes/{id}/decisao` | Confirma ou recusa uma solicitação exibida na central |

```json
[
  { "diaSemana": 1, "horario": "08:00" },
  { "diaSemana": 1, "horario": "09:00" },
  { "diaSemana": 7, "horario": "14:00" }
]
```

Dias ISO: segunda = 1, domingo = 7. Horários têm precisão de minutos, até 23:15. Até 224 alternativas semanais, sem duplicatas. Alternativas podem se sobrepor: a reserva de uma consulta de 45 minutos oculta todas as alternativas conflitantes.

Lista vazia fecha a agenda. Alterar disponibilidade não cancela nem desloca reservas existentes. Novos profissionais começam sem horários. V12 preserva os horários antigos para profissionais existentes na migração. A tela `/agenda` permite cadastrar e remover horários e avisa ao sair com alterações não salvas.

A edição de disponibilidade e a reserva usam o mesmo bloqueio do nutricionista. Solicitações exigem horário futuro cadastrado e ausência de sobreposição. A API retorna 409 para horário ocupado ou versão antiga.

A primeira consulta é solicitada pela mesma agenda do paciente. O pedido pendente não concede acesso à ficha; a confirmação ativa o vínculo e integra o agendamento às consultas do paciente. O fluxo separado de atendimento avulso, suas rotas e a preferência de aceite foram removidos. O campo legado `avulsa` permanece como indicação de vínculo pendente nas primeiras solicitações, sem permitir atendimento separado.

A central web `/notificacoes` usa a fila unificada e o sino atualiza a contagem a cada 30 segundos. Assim, uma solicitação feita pelo paciente aparece para o nutricionista sem depender da abertura prévia da ficha do paciente. Consultas confirmadas oferecem um link local do Google Agenda com duração de 45 minutos e fuso `America/Sao_Paulo`; esse fluxo não usa OAuth nem armazena credenciais do Google.

O acompanhamento e o início da consulta continuam na listagem de cada paciente. Veja [consultas](consultas.md). O mobile consulta automaticamente a disponibilidade configurada. Esta entrega cobre recorrência semanal, sem exceções por data, feriados ou duração variável.
