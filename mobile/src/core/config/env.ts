/**
 * Configuração de ambiente do app mobile.
 *
 * O Expo carrega automaticamente `.env.development` / `.env.production`
 * (ou `.env.local` para overrides pessoais, não versionado) e expõe no bundle
 * apenas variáveis com prefixo `EXPO_PUBLIC_`. Nenhum segredo deve usar esse
 * prefixo — só valores que já seriam públicos no app instalado (ex.: URL da API).
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não definida. Confira .env.development / .env.production.`
    );
  }
  return value;
}

export const env = {
  apiBaseUrl: requireEnv('EXPO_PUBLIC_API_BASE_URL', process.env.EXPO_PUBLIC_API_BASE_URL)
};
