/**
 * Configuracao de ambiente do app mobile.
 * Expo expoe apenas variaveis com prefixo EXPO_PUBLIC_.
 */
import Constants from 'expo-constants';

const hostUri =
  Constants.expoConfig?.hostUri ||
  (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
const localIp = hostUri ? hostUri.split(':')[0] : 'localhost';

export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
    `http://${localIp}:8080/api/v1`
};
