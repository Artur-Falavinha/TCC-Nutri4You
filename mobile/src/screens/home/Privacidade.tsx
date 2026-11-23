import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Aceite, URL_TERMOS, formatarDataAceite, formatarVersaoTermos, lerAceite } from '../../core/perfil/privacidade';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

export function Privacidade() {
  const [aceite, setAceite] = useState<Aceite | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function executar(acao: () => Promise<void>) {
    setOcupado(true);
    setMensagem('');
    try { await acao(); }
    catch { setMensagem('Não foi possível concluir agora. Tente novamente.'); }
    finally { setOcupado(false); }
  }

  return <View style={styles.section}>
    <Text style={styles.title} accessibilityRole="header">Privacidade</Text>
    <Text style={styles.description}>Consulte os termos e veja como exercer seus direitos.</Text>
    <Pressable style={styles.link} accessibilityRole="link" disabled={ocupado}
      onPress={() => void executar(() => Linking.openURL(URL_TERMOS))}>
      <Feather name="file-text" size={16} color={colors.brand} /><Text style={styles.linkText}>Ler termos e aviso de privacidade (PDF)</Text>
    </Pressable>
    <Text style={styles.description}>
      Para solicitações sobre seus dados pessoais, entre em contato com a informática da UFPR pelo e-mail{' '}
      <Text style={styles.linkText} accessibilityRole="link"
        onPress={() => void executar(() => Linking.openURL('mailto:suporte@ufpr.br'))}>suporte@ufpr.br</Text>.
    </Text>
    <Pressable style={styles.link} accessibilityRole="link"
      onPress={() => void executar(() => Linking.openURL('https://ufpr.br/lgpd/direitos-do-titular/'))}>
      <Feather name="external-link" size={16} color={colors.brand} /><Text style={styles.linkText}>Como exercer seus direitos na UFPR</Text>
    </Pressable>
    <Pressable style={[styles.secondary, ocupado && styles.disabled]} accessibilityRole="button" disabled={ocupado}
      onPress={() => {
        if (aceite) { setAceite(null); setMensagem(''); return; }
        void executar(async () => setAceite(await lerAceite()));
      }}>
      <Text style={styles.secondaryText}>{aceite ? 'Ocultar aceite dos termos' : 'Consultar aceite dos termos'}</Text>
    </Pressable>
    {aceite && <>
      <Text style={styles.description}>{aceite.aceito ? `Termos aceitos - versão ${formatarVersaoTermos(aceite.versao)}.` : 'Nenhum aceite registrado.'}</Text>
      {aceite.aceito && aceite.aceitoEm && formatarDataAceite(aceite.aceitoEm) ?
        <Text style={styles.description}>Aceito em {formatarDataAceite(aceite.aceitoEm)}.</Text> : null}
    </>}
    {mensagem ? <Text style={styles.description} accessibilityLiveRegion="polite">{mensagem}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.sm, gap: spacing.sm },
  title: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.text },
  description: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 40 },
  linkText: { flexShrink: 1, fontFamily: fontFamily.bold, color: colors.brand, fontSize: 14 },
  secondary: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.white },
  secondaryText: { color: colors.brand, fontFamily: fontFamily.bold },
  disabled: { opacity: 0.5 }
});
