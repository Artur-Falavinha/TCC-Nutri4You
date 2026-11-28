import { StyleSheet } from 'react-native';

import { colors, fontFamily, radius } from '../../theme/tokens';

export const authFormStyles = StyleSheet.create({
  etapa: { color: colors.brandDark, fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 20 },
  somenteLeitura: { backgroundColor: colors.page, borderColor: colors.border },
  valorSomenteLeitura: { minWidth: 0, flexShrink: 1, color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24, paddingVertical: 12 },
  controleComVisibilidade: { paddingRight: 0 },
  visibilidade: {
    minWidth: 48,
    minHeight: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md
  },
  erroCampo: { color: colors.dangerText, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21 }
});
