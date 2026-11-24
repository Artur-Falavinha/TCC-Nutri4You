import { Feather } from '@expo/vector-icons';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';
import { fecharToast, listarToasts, observarToasts, type MensagemToast } from './toast';

const variantes = {
  sucesso: { icone: 'check-circle', rotulo: 'Sucesso', cor: colors.brandDark, fundo: colors.confirmedBackground, duracao: 5000 },
  erro: { icone: 'alert-circle', rotulo: 'Erro', cor: colors.dangerText, fundo: colors.dangerButtonBackground, duracao: 8000 },
  aviso: { icone: 'alert-triangle', rotulo: 'Atenção', cor: '#8a4b00', fundo: '#faf0e5', duracao: 7000 },
  informacao: { icone: 'info', rotulo: 'Informação', cor: '#245287', fundo: '#ecf1f7', duracao: 5000 }
} as const;

export function ToastViewport() {
  const insets = useSafeAreaInsets();
  const mensagens = useSyncExternalStore(observarToasts, listarToasts, listarToasts);

  return (
    <View pointerEvents="box-none" style={[
      styles.viewport, { top: insets.top + spacing.sm, left: insets.left + spacing.sm, right: insets.right + spacing.sm }
    ]}>
      {mensagens.map(mensagem => <ToastCard key={mensagem.id} item={mensagem} />)}
    </View>
  );
}

function ToastCard({ item }: { item: MensagemToast }) {
  const variante = variantes[item.tipo];
  const [comFoco, setComFoco] = useState(false);
  const rotulo = variante.rotulo + '. ' + item.mensagem;

  useEffect(() => {
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(rotulo);
  }, [rotulo]);

  useEffect(() => {
    if (comFoco) return;
    const temporizador = setTimeout(() => fecharToast(item.id), variante.duracao);
    return () => clearTimeout(temporizador);
  }, [item.id, variante.duracao, comFoco]);

  return (
    <View testID={'toast-' + item.tipo} style={[styles.toast, { borderLeftColor: variante.cor }]}>
      <View style={[styles.icone, { backgroundColor: variante.fundo }]} aria-hidden>
        <Feather name={variante.icone} color={variante.cor} size={20} />
      </View>
      <Text style={styles.mensagem} accessibilityLabel={rotulo} aria-live="polite" accessibilityLiveRegion="polite">
        {item.mensagem}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar notificação"
        onFocus={() => setComFoco(true)}
        onBlur={() => setComFoco(false)}
        onPress={() => fecharToast(item.id)}
        style={({ pressed }) => [styles.fechar, (pressed || comFoco) && styles.fecharAtivo]}
      >
        <Feather name="x" color={colors.textSecondary} size={18} aria-hidden />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute', zIndex: 1000, alignItems: Platform.OS === 'web' ? 'flex-end' : 'center', gap: spacing.xs
  },
  toast: {
    ...shadows.card,
    width: '100%', maxWidth: 420, minHeight: 62,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.xs, paddingLeft: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderLeftWidth: 4, borderColor: colors.border, backgroundColor: colors.card
  },
  icone: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  mensagem: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 21 },
  fechar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  fecharAtivo: { backgroundColor: colors.page }
});
