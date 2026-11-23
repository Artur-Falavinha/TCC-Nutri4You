import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { carregarFotoPerfil, removerFotoPerfil, selecionarEEnviarFotoPerfil } from '../../core/perfil/foto-perfil.service';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

export function FotoPerfil() {
  const [foto, setFoto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

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
    setMensagem('');
    setErro('');
    setOcupado(true);
    try {
      if (remover) {
        await removerFotoPerfil();
        setFoto(null);
        setMensagem('Foto de perfil removida.');
      } else {
        const imagem = await selecionarEEnviarFotoPerfil();
        if (!imagem) return;
        setFoto(imagem);
        setFalhaCarga(false);
        setMensagem('Foto de perfil salva.');
      }
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível alterar a foto. Tente novamente.');
    } finally {
      setOcupado(false);
    }
  };

  const bloqueado = carregando || ocupado;
  return (
    <View style={styles.cartao}>
      <View style={styles.conteudo}>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {foto ? (
            <Image source={{ uri: foto }} style={styles.imagem} resizeMode="cover" />
          ) : (
            <Ionicons name="person-outline" size={32} color={colors.brand} />
          )}
        </View>
        <View style={styles.detalhes}>
          <Text style={styles.titulo} accessibilityRole="header">Foto de perfil</Text>
          {Platform.OS === 'web' ? <Text style={styles.legenda}>JPEG ou PNG de até 5 MB.</Text> : null}
          <View style={styles.acoes}>
            <Pressable style={[styles.botao, bloqueado && styles.bloqueado]} disabled={bloqueado}
              accessibilityRole="button" onPress={() => void alterar(false)}>
              <Text style={styles.rotulo}>{foto ? 'Trocar foto' : 'Adicionar foto'}</Text>
            </Pressable>
            {foto ? (
              <Pressable style={[styles.botao, bloqueado && styles.bloqueado]} disabled={bloqueado}
                accessibilityRole="button" onPress={() => void alterar(true)}>
                <Text style={styles.rotulo}>Remover foto</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      {bloqueado ? <ActivityIndicator accessibilityLabel="Carregando foto" color={colors.brand} /> : null}
      {falhaCarga ? (
        <View style={styles.erroCarga}>
          <Text style={styles.erro} accessibilityRole="alert">Não foi possível carregar sua foto.</Text>
          <Pressable style={styles.botao} disabled={bloqueado} accessibilityRole="button" onPress={() => {
            setFalhaCarga(false);
            setCarregando(true);
            setTentativa(atual => atual + 1);
          }}>
            <Text style={styles.rotulo}>Tentar carregar a foto</Text>
          </Pressable>
        </View>
      ) : null}
      {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
      {mensagem ? <Text style={styles.legenda} accessibilityLiveRegion="polite">{mensagem}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  conteudo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  imagem: { width: 64, height: 64 },
  detalhes: { flex: 1, minWidth: 136, gap: spacing.xxs },
  titulo: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.text },
  legenda: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  botao: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  bloqueado: { opacity: 0.5 },
  rotulo: { fontFamily: fontFamily.bold, color: colors.brandDark },
  erroCarga: { alignItems: 'flex-start', gap: spacing.xs },
  erro: { color: colors.dangerText, fontFamily: fontFamily.semibold }
});
