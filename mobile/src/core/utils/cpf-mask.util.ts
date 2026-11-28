const CPF_DIGIT_COUNT = 11;

export function extractCpfDigits(value: string): string {
  if (!value) {
    return '';
  }
  return value.replace(/\D/g, '').slice(0, CPF_DIGIT_COUNT);
}

/** Formato exibido no input, alinhado ao placeholder: 000.000.000-00 */
export function formatCpfDisplay(value: string): string {
  const candidate = value.trim();
  const digits = candidate.replace(/\D/g, '');
  if (/[^\d.-]/.test(candidate) || digits.length > CPF_DIGIT_COUNT || (candidate && !digits)) {
    return value;
  }
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

/** Formato usado no envio do CPF preenchido. */
export function normalizeCpf(value: string): string | undefined {
  const digits = extractCpfDigits(value);
  return digits ? formatCpfDisplay(digits) : undefined;
}

function cpfCheckDigit(digits: string, length: number): number {
  let sum = 0;
  for (let index = 0; index < length; index += 1) {
    sum += Number(digits[index]) * (length + 1 - index);
  }
  const digit = 11 - (sum % 11);
  return digit >= 10 ? 0 : digit;
}

export function isCpfValid(value: string): boolean {
  if (!/^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(value.trim())) {
    return false;
  }

  const digits = extractCpfDigits(value);
  return !/^(\d)\1{10}$/.test(digits)
    && cpfCheckDigit(digits, 9) === Number(digits[9])
    && cpfCheckDigit(digits, 10) === Number(digits[10]);
}
