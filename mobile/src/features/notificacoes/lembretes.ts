import { FUSO_HORARIO_CLINICA } from '../../core/utils/date-mask.util';
import type { Appointment } from '../appointments/appointments.models';

const relogioDaClinica = new Intl.DateTimeFormat('en', {
  timeZone: FUSO_HORARIO_CLINICA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

export function selecionarLembretes(consultas: Appointment[], agora: Date): Appointment[] {
  const agoraNaClinica = horarioCivilDaClinica(agora);
  return consultas
    .filter((item) => item.status === 'RECUSADA'
      || (['AGUARDANDO_CONFIRMACAO', 'CONFIRMADA'].includes(item.status)
        && horarioCivilEmMilissegundos(item.dataHora) >= agoraNaClinica))
    .sort((a, b) => a.status === 'RECUSADA' && b.status !== 'RECUSADA' ? -1
      : b.status === 'RECUSADA' && a.status !== 'RECUSADA' ? 1
        : a.dataHora.localeCompare(b.dataHora));
}

export function chaveLembrete({ id, status, versao }: Appointment): string {
  return id + ':' + status + ':' + versao;
}

// A API envia horário civil da clínica sem offset. A escala UTC mantém esses campos
// na comparação e na exibição, independentemente do fuso do dispositivo.
function horarioCivilEmMilissegundos(dataHora: string): number {
  return Date.parse(dataHora + 'Z');
}

function horarioCivilDaClinica(agora: Date): number {
  const { year, month, day, hour, minute, second } = Object.fromEntries(
    relogioDaClinica.formatToParts(agora).map(({ type, value }) => [type, value])
  );
  return Date.UTC(
    Number(year), Number(month) - 1, Number(day),
    Number(hour), Number(minute), Number(second), agora.getUTCMilliseconds()
  );
}
