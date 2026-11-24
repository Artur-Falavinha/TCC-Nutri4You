import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, Platform, ScrollView } from 'react-native';

export function useCarrosselEvolucao(total: number) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const paginaAtual = useRef(0);
  const definirRef = useCallback((scroll: ComponentRef<typeof ScrollView> | null) => {
    ref.current = scroll;
  }, []);
  const [pagina, setPagina] = useState(0);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    if (largura > 0) ref.current?.scrollTo({ x: paginaAtual.current * largura, animated: false });
  }, [largura]);

  const selecionar = (indice: number) => {
    paginaAtual.current = indice;
    setPagina(indice);
  };

  const irPara = (indice: number) => {
    selecionar(indice);
    ref.current?.scrollTo({ x: indice * largura, animated: false });
  };

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const medida = nativeEvent.layout.width;
    if (medida <= 0) return;
    if (medida === largura && paginaAtual.current > 0) {
      ref.current?.scrollTo({ x: paginaAtual.current * largura, animated: false });
    }
    setLargura(medida);
  };

  const aoRolar = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (largura === 0) return;
    const posicao = nativeEvent.contentOffset.x;
    const indice = Math.max(0, Math.min(total - 1, Math.round(posicao / largura)));
    if (Platform.OS !== 'web' || Math.abs(posicao - indice * largura) < 2) {
      selecionar(indice);
    }
  };

  return { definirRef, pagina, largura, irPara, onLayout, aoRolar };
}
