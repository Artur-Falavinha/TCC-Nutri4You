import { StyleSheet, Text } from 'react-native';

import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

export function rotuloNotificacoes(quantidade: number): string {
  if (quantidade === 0) return 'Notificações';
  if (quantidade === 1) return 'Notificações, 1 não lida';
  return 'Notificações, ' + quantidade + ' não lidas';
}

export function BadgeNotificacoes({ quantidade }: { quantidade: number }) {
  return quantidade > 0 ? (
    <Text style={styles.badge} aria-hidden>
      {quantidade > 99 ? '99+' : quantidade}
    </Text>
  ) : null;
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerText,
    color: colors.white,
    fontFamily: fontFamily.extrabold,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: spacing.xxs,
    paddingVertical: 2
  }
});
