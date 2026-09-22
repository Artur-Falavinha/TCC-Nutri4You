import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const CRN_DIGIT_COUNT = 6;

/** Extrai região (1 dígito) + inscrição (5 dígitos) a partir de qualquer representação parcial. */
export function extractCrnDigits(value: string): string {
  if (!value) {
    return '';
  }

  const canonical = value.match(/^CRN(\d)-(\d*)$/i);
  if (canonical) {
    return (canonical[1] + canonical[2]).slice(0, CRN_DIGIT_COUNT);
  }

  const display = value.match(/^CRN-(\d)(?:\s(\d*))?$/i);
  if (display) {
    return (display[1] + (display[2] ?? '')).slice(0, CRN_DIGIT_COUNT);
  }

  return value.replace(/\D/g, '').slice(0, CRN_DIGIT_COUNT);
}

/** Formato exibido no input, alinhado ao placeholder do Figma: CRN-8 12345 */
export function formatCrnDisplay(value: string): string {
  const digits = extractCrnDigits(value);
  if (digits.length === 0) {
    return '';
  }

  const region = digits[0];
  const number = digits.slice(1);
  if (number.length === 0) {
    return `CRN-${region}`;
  }

  return `CRN-${region} ${number}`;
}

/** Formato persistido/API, alinhado ao backend e seed: CRN8-12345 */
export function normalizeCrnForApi(value: string): string {
  const digits = extractCrnDigits(value);
  if (digits.length !== CRN_DIGIT_COUNT) {
    return value.trim();
  }

  return `CRN${digits[0]}-${digits.slice(1)}`;
}

export function isCrnComplete(value: string): boolean {
  return extractCrnDigits(value).length === CRN_DIGIT_COUNT;
}

export function crnValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) {
      return null;
    }

    return isCrnComplete(value) ? null : { crn: true };
  };
}
