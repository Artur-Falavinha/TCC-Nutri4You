import { StyleSheet } from 'react-native';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

export const perfilStyles = StyleSheet.create({
  descricao: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  estadoVazio: {
    color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21,
    padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.page
  },
  botao: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: spacing.xs
  },
  primario: { backgroundColor: colors.brand },
  secundario: { backgroundColor: colors.page, borderColor: colors.border },
  perigoSuave: { backgroundColor: colors.dangerButtonBackground },
  pressionado: { opacity: 0.65 },
  rotuloBotao: { flexShrink: 1, color: colors.brandDark, fontFamily: fontFamily.bold, fontSize: 14 },
  rotuloPrimario: { flexShrink: 1, color: colors.white, fontFamily: fontFamily.bold, fontSize: 14 },
  rotuloPerigo: { flexShrink: 1, color: colors.dangerText, fontFamily: fontFamily.bold, fontSize: 14 },
  aviso: {
    color: colors.brandDark, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21,
    backgroundColor: colors.confirmedBackground, padding: spacing.sm, borderRadius: radius.md
  },
  erro: {
    color: colors.dangerText, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21,
    backgroundColor: colors.dangerButtonBackground, padding: spacing.sm, borderRadius: radius.md
  }
});
