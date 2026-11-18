const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/render';
const DURACAO_CONSULTA_MINUTOS = 45;

export interface EventoConsulta {
  dataHora: string;
  pacienteNome: string;
}

export function criarLinkGoogleAgenda(consulta: EventoConsulta): string {
  const inicio = dataFlutuante(consulta.dataHora);
  const fim = new Date(inicio.getTime() + DURACAO_CONSULTA_MINUTOS * 60_000);
  const parametros = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Consulta de Nutrição — ${consulta.pacienteNome}`,
    dates: `${formatarDataFlutuante(inicio)}/${formatarDataFlutuante(fim)}`,
    ctz: 'America/Sao_Paulo',
    details: `Consulta com ${consulta.pacienteNome}. Evento gerado pelo Nutri4You.`
  });
  return `${GOOGLE_CALENDAR_URL}?${parametros.toString()}`;
}

function dataFlutuante(valor: string): Date {
  const [parteData, parteHora = '00:00:00'] = valor.split('T');
  const [ano, mes, dia] = parteData.split('-').map(Number);
  const [hora, minuto, segundo = 0] = parteHora.split(':').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, hora, minuto, segundo));
}

function formatarDataFlutuante(data: Date): string {
  const dois = (valor: number) => String(valor).padStart(2, '0');
  return `${data.getUTCFullYear()}${dois(data.getUTCMonth() + 1)}${dois(data.getUTCDate())}`
    + `T${dois(data.getUTCHours())}${dois(data.getUTCMinutes())}${dois(data.getUTCSeconds())}`;
}
