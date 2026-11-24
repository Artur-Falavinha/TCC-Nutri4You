import { toast } from '../../components/feedback/toast';
import { Feather } from '@expo/vector-icons';
import { SectionCardHeader, sectionCardStyles } from '../../components/layout/SectionCardHeader';
import { colors, spacing } from '../../theme/tokens';
import { perfilStyles } from './perfil.styles';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AvatarFoto } from '../../components/layout/AvatarFoto';
import { carregarFotoPerfil, removerFotoPerfil, selecionarEEnviarFotoPerfil } from '../../core/perfil/foto-perfil.service';

export function FotoPerfil() {
  const [foto, setFoto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [falhaCarga, setFalhaCarga] = useState(false);

  useEffect(() => {
    let ativo = true;
    void carregarFotoPerfil()
      .then(imagem => { if (ativo) setFoto(imagem); })
      .catch(() => { if (ativo) setFalhaCarga(true); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [tentativa]);

  const alterar = async (remover: boolean) => {
    if (ocupado || carregando) return;
    setOcupado(true);
    try {
      if (remover) {
        await removerFotoPerfil();
        setFoto(null);
        toast.sucesso('Foto de perfil removida.');
      } else {
        const imagem = await selecionarEEnviarFotoPerfil();
        if (!imagem) return;
        setFoto(imagem);
        setFalhaCarga(false);
        toast.sucesso('Foto de perfil salva.');
      }
    } catch (falha) {
      toast.erro(falha instanceof Error ? falha.message : 'Não foi possível alterar a foto. Tente novamente.');
    } finally {
      setOcupado(false);
    }
  };

  const bloqueado = carregando || ocupado;
  return (
    <View style={sectionCardStyles.superficie}>
      <View style={styles.identidade}>
        <SectionCardHeader titulo="Foto de perfil" icone="user" avatar={<AvatarFoto foto={foto} tamanho={64} />} />
        {Platform.OS === 'web' && <Text style={perfilStyles.descricao}>JPEG ou PNG de até 5 MB.</Text>}
      </View>
      <View style={styles.acoes}>
        <Pressable
          style={({ pressed }) => [
            perfilStyles.botao, perfilStyles.secundario, (pressed || bloqueado) && perfilStyles.pressionado
          ]}
          disabled={bloqueado}
          accessibilityRole="button"
          onPress={() => void alterar(false)}
        >
          <Feather name="camera" size={18} color={colors.brandDark} aria-hidden />
          <Text style={perfilStyles.rotuloBotao}>{foto ? 'Trocar foto' : 'Adicionar foto'}</Text>
        </Pressable>
        {foto && (
          <Pressable
            style={({ pressed }) => [
              perfilStyles.botao, perfilStyles.perigoSuave, (pressed || bloqueado) && perfilStyles.pressionado
            ]}
            disabled={bloqueado}
            accessibilityRole="button"
            onPress={() => void alterar(true)}
          >
            <Feather name="trash-2" size={18} color={colors.dangerText} aria-hidden />
            <Text style={perfilStyles.rotuloPerigo}>Remover foto</Text>
          </Pressable>
        )}
      </View>
      {bloqueado ? <ActivityIndicator accessibilityLabel="Carregando foto" color={colors.brand} /> : null}
      {falhaCarga && (
        <View style={styles.erroCarga}>
          <Text style={perfilStyles.erro} accessibilityRole="alert">Não foi possível carregar sua foto.</Text>
          <Pressable
            style={({ pressed }) => [perfilStyles.botao, perfilStyles.secundario, pressed && perfilStyles.pressionado]}
            disabled={bloqueado}
            accessibilityRole="button"
            onPress={() => {
              setFalhaCarga(false);
              setCarregando(true);
              setTentativa(atual => atual + 1);
            }}
          >
            <Text style={perfilStyles.rotuloBotao}>Tentar carregar a foto</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  identidade: { gap: spacing.xs },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  erroCarga: { gap: spacing.xs }
});
