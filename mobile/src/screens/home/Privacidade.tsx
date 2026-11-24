import { Feather } from '@expo/vector-icons';
import { SectionCardHeader, sectionCardStyles } from '../../components/layout/SectionCardHeader';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';
import { perfilStyles } from './perfil.styles';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Aceite, URL_TERMOS, formatarDataAceite, formatarVersaoTermos, lerAceite } from '../../core/perfil/privacidade';

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

  return (
    <View style={sectionCardStyles.superficie}>
      <SectionCardHeader titulo="Privacidade" icone="lock" />
      <Text style={perfilStyles.descricao}>Consulte os termos e veja como exercer seus direitos.</Text>
      <Pressable
        style={({ pressed }) => [styles.link, (pressed || ocupado) && perfilStyles.pressionado]}
        accessibilityRole="link"
        disabled={ocupado}
        onPress={() => void executar(() => Linking.openURL(URL_TERMOS))}
      >
        <Feather name="file-text" size={18} color={colors.brandDark} aria-hidden />
        <Text style={perfilStyles.rotuloBotao}>Ler termos e aviso de privacidade (PDF)</Text>
      </Pressable>
      <Text style={perfilStyles.descricao}>
        Para solicitações sobre seus dados pessoais, entre em contato com a informática da UFPR pelo e-mail{' '}
        <Text
          style={styles.email}
          accessibilityRole="link"
          onPress={() => void executar(() => Linking.openURL('mailto:suporte@ufpr.br'))}
        >
          suporte@ufpr.br
        </Text>.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.link, pressed && perfilStyles.pressionado]}
        accessibilityRole="link"
        onPress={() => void executar(() => Linking.openURL('https://ufpr.br/lgpd/direitos-do-titular/'))}
      >
        <Feather name="external-link" size={18} color={colors.brandDark} aria-hidden />
        <Text style={perfilStyles.rotuloBotao}>Como exercer seus direitos na UFPR</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          perfilStyles.botao, perfilStyles.secundario, (pressed || ocupado) && perfilStyles.pressionado
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: Boolean(aceite), disabled: ocupado }}
        disabled={ocupado}
        onPress={() => {
          if (aceite) { setAceite(null); setMensagem(''); return; }
          void executar(async () => setAceite(await lerAceite()));
        }}
      >
        <Feather name={aceite ? 'chevron-up' : 'chevron-down'} size={18} color={colors.brandDark} aria-hidden />
        <Text style={perfilStyles.rotuloBotao}>{aceite ? 'Ocultar aceite dos termos' : 'Consultar aceite dos termos'}</Text>
      </Pressable>
      {aceite && (
        <View style={styles.aceite} accessibilityLiveRegion="polite">
          <Text style={styles.registro}>{aceite.aceito ? 'Termos aceitos - versão ' + formatarVersaoTermos(aceite.versao) + '.' : 'Nenhum aceite registrado.'}</Text>
          {aceite.aceito && aceite.aceitoEm && formatarDataAceite(aceite.aceitoEm) ? (
            <Text style={perfilStyles.descricao}>{'Aceito em ' + formatarDataAceite(aceite.aceitoEm) + '.'}</Text>
          ) : null}
        </View>
      )}
      {mensagem ? <Text style={perfilStyles.erro} accessibilityLiveRegion="polite">{mensagem}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 },
  email: { color: colors.brandDark, fontFamily: fontFamily.bold, textDecorationLine: 'underline' },
  aceite: { padding: spacing.sm, gap: spacing.xxs, backgroundColor: colors.page, borderRadius: radius.md },
  registro: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 14 }
});
