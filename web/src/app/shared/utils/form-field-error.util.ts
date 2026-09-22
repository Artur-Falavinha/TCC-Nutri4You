import { AbstractControl, FormGroup } from '@angular/forms';

export const REQUIRED_FIELD_MESSAGE = 'Campo obrigatório.';

export type FieldErrorMessages = Record<string, string>;

export function resolveFieldError(
  control: AbstractControl,
  submitted: boolean,
  messages: FieldErrorMessages = {}
): string {
  if (!control.errors) {
    return '';
  }

  const isRequiredError = control.errors['required'] || control.errors['requiredTrue'];
  if (isRequiredError) {
    return submitted ? (messages['required'] ?? REQUIRED_FIELD_MESSAGE) : '';
  }

  if (!submitted) {
    return '';
  }

  for (const [key, message] of Object.entries(messages)) {
    if (key === 'required' || !control.errors[key]) {
      continue;
    }

    return message;
  }

  return '';
}

export function resolveGroupFieldError(
  form: FormGroup,
  submitted: boolean,
  errorKey: string,
  message: string,
  fieldNames: string[] = []
): string {
  if (!submitted || !form.errors?.[errorKey]) {
    return '';
  }

  if (fieldNames.length > 0) {
    const allFilled = fieldNames.every((name) => {
      const value = form.get(name)?.value;
      return value !== '' && value !== null && value !== false;
    });

    if (!allFilled) {
      return '';
    }
  }

  return message;
}
