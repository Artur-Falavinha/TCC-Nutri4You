# Agenda do nutricionista

Base `/api/v1`. JWT de nutricionista obrigatório. Horários civis da clínica em `America/Sao_Paulo`; duração mantida em 45 minutos.

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/agenda-nutricionista/horarios` | Lista semanal do próprio profissional |
| PUT | `/agenda-nutricionista/horarios` | Substitui a lista semanal inteira e retorna a lista ordenada |

```json
[
  { "diaSemana": 1, "horario": "08:00" },
  { "diaSemana": 1, "horario": "09:00" },
  { "diaSemana": 7, "horario": "14:00" }
]
```

Dias ISO: segunda = 1, domingo = 7. Horários têm precisão de minutos, até 23:15. Até 224 alternativas semanais, sem duplicatas. Alternativas podem se sobrepor: a reserva de uma consulta de 45 minutos oculta todas as alternativas conflitantes.

Lista vazia fecha a agenda. Alterar disponibilidade não cancela nem desloca reservas existentes. Novos profissionais começam sem horários. V9 preserva os horários antigos para profissionais existentes na migração. A tela `/agenda` permite cadastrar e remover horários e avisa ao sair com alterações não salvas.

Edição de disponibilidade e solicitação/reagendamento usam o mesmo bloqueio do nutricionista. Solicitações exigem vínculo ativo, horário futuro cadastrado e ausência de sobreposição. A API retorna 409 para horário ocupado ou versão antiga.

Aprovar, cancelar e iniciar são ações da listagem de consultas de cada paciente; veja [consultas](consultas.md). O mobile consulta automaticamente a disponibilidade configurada. Esta entrega cobre recorrência semanal, sem exceções por data, feriados ou duração variável.
