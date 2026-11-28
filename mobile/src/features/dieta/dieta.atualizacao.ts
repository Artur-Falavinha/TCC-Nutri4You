import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { dataIsoDaClinica } from '../../core/utils/date-mask.util';

export function useAtualizacaoDieta(recarregar: () => void) {
  useFocusEffect(useCallback(() => {
    let dia = dataIsoDaClinica();
    recarregar();

    const retomada = AppState.addEventListener('change', estado => {
      if (estado !== 'active') return;
      dia = dataIsoDaClinica();
      recarregar();
    });
    const virada = setInterval(() => {
      const atual = dataIsoDaClinica();
      if (atual === dia || (AppState.currentState && AppState.currentState !== 'active')) return;
      dia = atual;
      recarregar();
    }, 5000);

    return () => {
      retomada.remove();
      clearInterval(virada);
    };
  }, [recarregar]));
}

export function useCargaVigente() {
  const pendente = useRef<{ chave: string; promessa: Promise<void> } | null>(null);

  const invalidar = useCallback(() => { pendente.current = null; }, []);
  useEffect(() => invalidar, [invalidar]);

  const executar = useCallback((chave: string, tarefa: (atual: () => boolean) => Promise<void>) => {
    if (pendente.current?.chave === chave) return pendente.current.promessa;
    const atual = () => pendente.current?.promessa === promessa;
    const promessa = Promise.resolve().then(() => {
      if (atual()) return tarefa(atual);
    }).finally(() => { if (atual()) pendente.current = null; });
    pendente.current = { chave, promessa };
    return promessa;
  }, []);

  return { executar, invalidar };
}
