import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Aceite, URL_TERMOS, aceitarTermos, formatarDataAceite, formatarVersaoTermos, lerAceite } from '../../core/perfil/privacidade';
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
    <Text style={styles.description}>O canal de privacidade do Nutri4U está sendo definido.</Text>
    <Pressable style={styles.link} accessibilityRole="link" onPress={() => void executar(() => Linking.openURL('https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares'))}>
      <Feather name="external-link" size={16} color={colors.brand} /><Text style={styles.linkText}>Orientações da ANPD para titulares</Text>
    </Pressable>
    <Pressable style={[styles.secondary, ocupado && styles.disabled]} accessibilityRole="button" disabled={ocupado}
      onPress={() => {
        if (aceite) { setAceite(null); setMensagem(''); return; }
        void executar(async () => setAceite(await lerAceite()));
      }}>
      <Text style={styles.secondaryText}>{aceite ? 'Ocultar aceite dos termos' : 'Consultar aceite dos termos'}</Text>
    </Pressable>
    {aceite && <>
      <Text style={styles.description}>{aceite.aceito ? `Termos aceitos - versão ${formatarVersaoTermos(aceite.versao)}.` : 'Após ler os termos, registre seu aceite.'}</Text>
      {aceite.aceito && aceite.aceitoEm && formatarDataAceite(aceite.aceitoEm) ?
        <Text style={styles.description}>Aceito em {formatarDataAceite(aceite.aceitoEm)}.</Text> : null}
      {!aceite.aceito && <Pressable style={styles.primary} accessibilityRole="button" disabled={ocupado}
        onPress={() => void executar(async () => {
          setAceite(await aceitarTermos(aceite.versao));
        })}><Text style={styles.primaryText}>Li e aceito os termos</Text></Pressable>}
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
  primary: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.brand },
  primaryText: { color: colors.white, fontFamily: fontFamily.bold },
  disabled: { opacity: 0.5 }
});
