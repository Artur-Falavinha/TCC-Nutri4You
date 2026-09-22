const CPF_DIGIT_COUNT = 11;

export function extractCpfDigits(value: string): string {
  if (!value) {
    return '';
  }
  return value.replace(/\D/g, '').slice(0, CPF_DIGIT_COUNT);
}

/** Formato exibido no input, alinhado ao placeholder: 000.000.000-00 */
export function formatCpfDisplay(value: string): string {
  const digits = extractCpfDigits(value);
  if (digits.length === 0) {
    return '';
  }
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Formato persistido no banco/seed: 111.222.333-44 */
export function normalizeCpf(value: string): string | undefined {
  const digits = extractCpfDigits(value);
  if (digits.length === 0) {
    return undefined;
  }
  if (digits.length !== CPF_DIGIT_COUNT) {
    return formatCpfDisplay(digits);
  }
  return formatCpfDisplay(digits);
}

export function isCpfComplete(value: string): boolean {
  return extractCpfDigits(value).length === CPF_DIGIT_COUNT;
}
