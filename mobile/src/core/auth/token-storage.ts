import * as SecureStore from 'expo-secure-store';

/** Nome do item no SecureStore (nao e credencial). */
const JWT_LS_ITEM = 'nutri4you.jwt';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(JWT_LS_ITEM);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(JWT_LS_ITEM, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(JWT_LS_ITEM);
}
