import { useEffect, useState } from 'react';
import { AvatarFoto } from '../../../components/layout/AvatarFoto';
import { carregarFotoNutricionistaNaAgenda } from '../../../core/perfil/foto-perfil.service';

export function useFotoNutricionistaNaAgenda(id: number | null): string | null {
  const [resultado, setResultado] = useState<{ id: number; foto: string | null }>();

  useEffect(() => {
    if (id === null) return;
    let ativo = true;
    void carregarFotoNutricionistaNaAgenda(id)
      .catch(() => null)
      .then(foto => { if (ativo) setResultado({ id, foto }); });
    return () => { ativo = false; };
  }, [id]);

  return resultado?.id === id ? resultado.foto : null;
}

export function AvatarNutricionistaAgenda({ id, tamanho = 36 }: { id: number; tamanho?: number }) {
  const foto = useFotoNutricionistaNaAgenda(id);
  return <AvatarFoto foto={foto} tamanho={tamanho} />;
}
