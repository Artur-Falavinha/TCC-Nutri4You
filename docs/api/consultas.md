# Consultas do nutricionista

## Autorizacao e rotas

Usa o JWT e o controle de acesso existentes. Todas as rotas exigem
nutricionista autenticado e acesso ao paciente. Uma consulta so pode ser lida
ou alterada pelo nutricionista que a registrou, mesmo se o paciente for compartilhado.

Base: `/api/v1/gestao-pacientes/{pacienteId}/consultas`.

| Metodo | Rota | Resultado |
| --- | --- | --- |
| GET | Base + `?pagina=0` | Pagina de 10 consultas, data e ID decrescentes |
| POST | Base | Cria consulta e avaliacao em uma transacao; HTTP 201 |
| GET | Base + `/{id}` | Consulta e avaliacao vinculada |
| PUT | Base + `/{id}` | Atualiza o mesmo registro; exige `versao` |

As respostas usam `ApiResponse`. Listagem retorna `itens`, `pagina`,
`totalPaginas` e `total`. Erros: 400 validacao, 401 sem autenticacao,
403 sem acesso ao paciente, 404 consulta inexistente ou de outro nutricionista,
409 versao desatualizada. Nao ha exclusao fisica: cancelamento usa o status.

## Corpo de gravacao

```json
{
  "dataHora": "2026-01-15T14:30",
  "status": "REALIZADA",
  "observacao": "Observacoes clinicas",
  "versao": 0,
  "avaliacao": {
    "peso": 68.5,
    "altura": 1.70,
    "percentualGordura": null,
    "massaMuscularKg": null,
    "pregaBicipital": null,
    "pregaTricipital": null,
    "pregaSubescapular": null,
    "pregaSuprailiaca": null,
    "circunferenciaCintura": null,
    "circunferenciaQuadril": null,
    "circunferenciaBraco": null
  }
}
```

`versao` e dispensavel na criacao. O IMC e calculado pelo servidor, nao recebido
do cliente. A tela mostra altura em centimetros inteiros; a API conserva metros
com ate duas casas decimais. Data/hora mantem a modelagem de horario civil da
clinica (`TIMESTAMP WITHOUT TIME ZONE`), interpretado em America/Sao_Paulo.

## Regras

- Data/hora e status obrigatorios; datas entre 1900 e 2100.
- Status: `AGUARDANDO_CONFIRMACAO`, `CONFIRMADA`, `REALIZADA`, `CANCELADA`.
  A tela apresenta `REALIZADA` como **Concluida**.
- Consulta futura nao pode ser concluida. Conclusao exige peso e altura.
- Agendamento/cancelamento sem avaliacao aceita `avaliacao: null`.
  Quando qualquer medida for enviada, peso e altura sao obrigatorios.
- Peso: 1 a 500 kg; altura: 0,30 a 2,70 m; gordura: 0 a 100%; massa muscular:
  0 a 300 kg; pregas: 0,1 a 100 mm; cintura/quadril: 0,1 a 300 cm;
  braco: 0,1 a 150 cm. Medidas aceitam ate duas casas decimais.
- Medidas opcionais nao coletadas permanecem nulas. Observacoes: ate 5.000 caracteres.
- Edicao atualiza a avaliacao vinculada, sem duplicar; nao apaga avaliacao
  existente ao receber `null`. A data da avaliacao acompanha a consulta.
- Bloqueio otimista protege tambem edicoes somente de medidas.
- Cancelar/Voltar nao persiste e solicita confirmacao quando ha alteracoes.

## Migracao e compatibilidade

V7 adiciona versao e instante de atualizacao, amplia observacoes para TEXT,
amplia a capacidade do IMC calculado e cria indice para a listagem.
Nenhuma migration anterior foi alterada.

A tela isolada de medidas foi removida. `/pacientes/{id}/medidas` redireciona
para `/pacientes/{id}/consultas`. Avaliacoes antigas, inclusive sem consulta,
permanecem no historico. Os endpoints legados de avaliacoes foram preservados.

Se a base local tiver divergencia de checksum, a validacao do Flyway deve
continuar ativa. O procedimento de reconciliacao deve ser revisado, respaldado
e restrito ao checksum conhecido; nao apagar volumes nem recalcular horarios.

## Verificacao

- `ConsultaControllerTest`: persistencia, edicao, versao, validacao, paginacao,
  autorizacao e isolamento por nutricionista (H2).
- `consulta-form.spec.ts`: obrigatoriedade, unidades, limites, edicao e IMC.
- `scripts/test-migrations.ps1`: SQL V1 a V7 em PostgreSQL 16 isolado,
  incluindo preservacao de consultas e unicidade de avaliacao.
  Este script nao verifica o mecanismo Flyway de checksum/baseline.
- Frontend: `npm run build`, `npm run lint` e testes em ChromeHeadless.
