const DATE_DIGIT_COUNT = 8;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const DATA_BR = /^(\d{2})\/(\d{2})\/(\d{4})$/;
export const FUSO_HORARIO_CLINICA = 'America/Sao_Paulo';
export const DATA_MINIMA_NASCIMENTO = '1900-01-01';

const calendarioClinica = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_HORARIO_CLINICA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export function extractDateDigits(value: string): string {
  if (!value) {
    return '';
  }
  return value.replace(/\D/g, '').slice(0, DATE_DIGIT_COUNT);
}

/** Máscara de exibição BR: DD/MM/AAAA */
export function formatDateDisplay(value: string): string {
  const digits = extractDateDigits(value);
  if (digits.length === 0) {
    return '';
  }
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Formata um Date local como DD/MM/AAAA. */
export function formatDateFromDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).padStart(4, '0');
  return `${day}/${month}/${year}`;
}

/** Converte DD/MM/AAAA (ou AAAA-MM-DD) para ISO YYYY-MM-DD. */
export function toIsoDate(value: string): string | undefined {
  const valor = value.trim();
  const partes = DATA_BR.exec(valor);
  const iso = partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : valor;
  if (!DATA_ISO.test(iso) || iso.startsWith('0000-')) {
    return undefined;
  }
  const data = new Date(`${iso}T00:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === iso ? iso : undefined;
}

export function dataNascimentoParaIso(valor: string): string | undefined {
  const iso = toIsoDate(valor);
  return iso && iso >= DATA_MINIMA_NASCIMENTO ? iso : undefined;
}

export function formatarDataCivil(valor?: string | null): string {
  const iso = toIsoDate(valor?.split('T', 1)[0] ?? '');
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHoraCivil(valor?: string | null): string {
  const [data, horario = ''] = valor?.split('T') ?? [];
  const dataFormatada = formatarDataCivil(data);
  const horarioValido = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(horario);
  return dataFormatada && horarioValido ? `${dataFormatada}, às ${horario.slice(0, 5)}` : '';
}

export function dataIsoDaClinica(agora = new Date()): string {
  const { year, month, day } = Object.fromEntries(
    calendarioClinica.formatToParts(agora).map(({ type, value }) => [type, value])
  );
  return `${year.padStart(4, '0')}-${month}-${day}`;
}

/** Converte DD/MM/AAAA (ou AAAA-MM-DD) para Date local, ou null se incompleto/invalido. */
export function parseDisplayDate(value: string): Date | null {
  const iso = toIsoDate(value);
  if (!iso) {
    return null;
  }
  const data = new Date(`${iso}T12:00:00`);
  return formatDateFromDate(data).split('/').reverse().join('-') === iso ? data : null;
}

export function isDateComplete(value: string): boolean {
  return extractDateDigits(value).length === DATE_DIGIT_COUNT && Boolean(parseDisplayDate(value));
}
