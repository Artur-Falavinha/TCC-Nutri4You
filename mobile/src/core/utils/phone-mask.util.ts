const PHONE_DIGIT_COUNT = 11;

export function extractPhoneDigits(value: string): string {
  if (!value) {
    return '';
  }
  return value.replace(/\D/g, '').slice(0, PHONE_DIGIT_COUNT);
}

/**
 * Máscara BR alinhada ao placeholder do Figma: (00) 00000-0000
 * Com 10 dígitos: (00) 0000-0000
 */
export function formatPhoneDisplay(value: string): string {
  const digits = extractPhoneDigits(value);
  if (digits.length === 0) {
    return '';
  }
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Digitos para API (seed usa 41999999999). */
export function normalizePhone(value: string): string | undefined {
  const digits = extractPhoneDigits(value);
  return digits.length > 0 ? digits : undefined;
}
