const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const INVALID_TOKEN_MESSAGE =
  'Link inválido ou expirado. Solicite uma nova recuperação de senha.';

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}
