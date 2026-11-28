import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function chaveArmazenamento(usuarioId: number): string {
  return 'nutri4you.mobile.notificacoes.vistas.' + usuarioId;
}

let filaGravacao = Promise.resolve();

export async function lerVistas(usuarioId: number): Promise<Set<string>> {
  try {
    await filaGravacao;
    const chave = chaveArmazenamento(usuarioId);
    const conteudo = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(chave)
      : await SecureStore.getItemAsync(chave);
    const valor: unknown = JSON.parse(conteudo ?? '[]');
    return new Set(Array.isArray(valor) ? valor.filter(chave => typeof chave === 'string') : []);
  } catch {
    return new Set();
  }
}

export function gravarVistas(usuarioId: number, vistas: Set<string>): void {
  const chave = chaveArmazenamento(usuarioId);
  const conteudo = JSON.stringify([...vistas]);
  filaGravacao = filaGravacao.then(async () => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(chave, conteudo);
    } else {
      await SecureStore.setItemAsync(chave, conteudo);
    }
  }).catch(() => undefined);
}
