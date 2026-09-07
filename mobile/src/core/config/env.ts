/**
 * Configuração de ambiente do app mobile.
 *
 * O Expo carrega automaticamente `.env.development` / `.env.production`
 * (ou `.env.local` para overrides pessoais, não versionado) e expõe no bundle
 * apenas variáveis com prefixo `EXPO_PUBLIC_`. Nenhum segredo deve usar esse
 * prefixo — só valores que já seriam públicos no app instalado (ex.: URL da API).
 */
import Constants from 'expo-constants';

const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = hostUri ? hostUri.split(':')[0] : 'localhost';

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não definida. Confira .env.development / .env.production.`
    );
  }
  return value;
}

export const env = {
  apiBaseUrl: `http://${localIp}:8080/api/v1`
};