import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Nome do item no SecureStore (nao e credencial). */
const JWT_STORAGE_ITEM = 'nutri4you.jwt';

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function readWebToken(): string | null {
  try {
    return globalThis.localStorage?.getItem(JWT_STORAGE_ITEM) ?? null;
  } catch {
    return null;
  }
}

function writeWebToken(token: string): void {
  try {
    globalThis.localStorage?.setItem(JWT_STORAGE_ITEM, token);
  } catch {
    // web sem storage: sessao so em memoria desta pagina
  }
}

function clearWebToken(): void {
  try {
    globalThis.localStorage?.removeItem(JWT_STORAGE_ITEM);
  } catch {
    // ignore
  }
}

export async function getToken(): Promise<string | null> {
  if (await canUseSecureStore()) {
    return SecureStore.getItemAsync(JWT_STORAGE_ITEM);
  }
  return readWebToken();
}

export async function setToken(token: string): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(JWT_STORAGE_ITEM, token);
    return;
  }
  writeWebToken(token);
}

export async function clearToken(): Promise<void> {
  // Sempre limpa o fallback web para nao deixar JWT residual entre plataformas.
  clearWebToken();
  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(JWT_STORAGE_ITEM);
  }
}
