import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { AvatarFoto } from '../../components/layout/AvatarFoto';
import { carregarFotoNutricionista } from '../../core/perfil/foto-perfil.service';

export function AvatarNutricionista({ id }: { id: number }) {
  const [foto, setFoto] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let ativo = true;
    void carregarFotoNutricionista(id)
      .then(imagem => { if (ativo) setFoto(imagem); })
      .catch(() => { if (ativo) setFoto(null); });
    return () => {
      ativo = false;
      setFoto(null);
    };
  }, [id]));

  return <AvatarFoto foto={foto} tamanho={40} />;
}
