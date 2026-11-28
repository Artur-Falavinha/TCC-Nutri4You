import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';

type Props = {
  icone: ComponentProps<typeof Feather>['name'];
  titulo: string;
  avatar?: ReactNode;
};

export function SectionCardHeader({ icone, titulo, avatar }: Props) {
  return (
    <View style={estilos.cabecalho}>
      {avatar ?? (
        <View style={estilos.marca} aria-hidden>
          <Feather name={icone} size={20} color={colors.brandDark} />
        </View>
      )}
      <Text style={estilos.titulo} accessibilityRole="header">{titulo}</Text>
    </View>
  );
}

export const sectionCardStyles = StyleSheet.create({
  superficie: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md
  }
});

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  marca: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titulo: { flex: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 25 }
});
