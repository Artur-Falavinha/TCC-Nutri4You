const DATE_DIGIT_COUNT = 8;

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
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

/** Converte DD/MM/AAAA (ou AAAA-MM-DD) para ISO YYYY-MM-DD. */
export function toIsoDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const year = Number(brMatch[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
      return undefined;
    }
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  return undefined;
}

/** Converte DD/MM/AAAA (ou AAAA-MM-DD) para Date local, ou null se incompleto/invalido. */
export function parseDisplayDate(value: string): Date | null {
  const iso = toIsoDate(value);
  if (!iso) {
    return null;
  }
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isDateComplete(value: string): boolean {
  return extractDateDigits(value).length === DATE_DIGIT_COUNT && Boolean(parseDisplayDate(value));
}
