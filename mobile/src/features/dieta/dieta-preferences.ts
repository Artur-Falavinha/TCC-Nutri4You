import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const keyForPlan = (planId: number) => `nutri4you.meal-swaps.${planId}`;

async function secureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function parsePreferences(raw: string | null): Record<number, string> {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, option]) => Number.isInteger(Number(key)) && typeof option === 'string')
        .map(([key, option]) => [Number(key), option as string])
    );
  } catch {
    return {};
  }
}

export async function loadMealSwapPreferences(planId: number): Promise<Record<number, string>> {
  const key = keyForPlan(planId);
  if (await secureStoreAvailable()) {
    return parsePreferences(await SecureStore.getItemAsync(key));
  }
  try {
    return parsePreferences(globalThis.localStorage?.getItem(key) ?? null);
  } catch {
    return {};
  }
}

export async function saveMealSwapPreferences(
  planId: number,
  preferences: Record<number, string>
): Promise<void> {
  const key = keyForPlan(planId);
  const value = JSON.stringify(preferences);
  if (await secureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // O estado da tela continua funcional quando o armazenamento estiver indisponível.
  }
}
