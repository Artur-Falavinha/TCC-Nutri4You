# Agenda do nutricionista

Base `/api/v1`. JWT de nutricionista obrigatório. Horários civis da clínica em `America/Sao_Paulo`; duração mantida em 45 minutos.

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/agenda-nutricionista/horarios` | Lista semanal do próprio profissional |
| PUT | `/agenda-nutricionista/horarios` | Substitui a lista semanal inteira e retorna a lista ordenada |
| GET e PUT | `/agenda-nutricionista/preferencias` | Consulta ou altera `aceitaConsultasAvulsas` |
| GET | `/agenda-nutricionista/solicitacoes-avulsas` | Lista os pedidos avulsos futuros do próprio profissional |
| POST | `/agenda-nutricionista/solicitacoes-avulsas/{id}/decisao` | Confirma ou recusa com `{ "aceitar": true, "versao": 0 }` |
| GET | `/agenda-nutricionista/notificacoes` | Lista todas as solicitações futuras pendentes, vinculadas ou avulsas |
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

A edição de disponibilidade, a preferência de consultas avulsas e a reserva usam o mesmo bloqueio do nutricionista. Solicitações exigem horário futuro cadastrado e ausência de sobreposição. A API retorna 409 para horário ocupado ou versão antiga.

A preferência começa desabilitada. Com a preferência ativa e horários cadastrados, o profissional aparece no catálogo de pacientes sem vínculo. A fila de avulsas pendentes retorna `id`, `pacienteNome`, `dataHora` e `versao`. O pedido pendente não concede acesso à ficha clínica. Confirmar marca a consulta avulsa. Recusar cancela e libera o horário.

A central web `/notificacoes` usa a fila unificada e o sino atualiza a contagem a cada 30 segundos. Assim, uma solicitação feita pelo paciente aparece para o nutricionista sem depender da abertura prévia da ficha do paciente. Consultas confirmadas oferecem um link local do Google Agenda com duração de 45 minutos e fuso `America/Sao_Paulo`; esse fluxo não usa OAuth nem armazena credenciais do Google.

O acompanhamento e o início da consulta continuam na listagem de cada paciente. Veja [consultas](consultas.md). O mobile consulta automaticamente a disponibilidade configurada. Esta entrega cobre recorrência semanal, sem exceções por data, feriados ou duração variável.
