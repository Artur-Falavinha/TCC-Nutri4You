/**
 * Extrai o token de recuperacao de URLs do app ou do link web do e-mail.
 * Exemplos:
 * - nutri4you://redefinir-senha?token=<uuid>
 * - http://localhost:4200/redefinir-senha?token=<uuid>
 */
export function extractResetTokenFromUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    return token?.trim() || null;
  } catch {
    const match = /[?&]token=([^&#]+)/i.exec(url);
    return match?.[1] ? decodeURIComponent(match[1]).trim() : null;
  }
}
