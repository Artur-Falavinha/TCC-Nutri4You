import { StyleSheet } from 'react-native';

import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

export const recuperacaoSenhaStyles = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: colors.pageAlt },
  preencher: { flex: 1 },
  conteudo: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md
  },
  conteudoCompacto: { paddingHorizontal: spacing.sm },
  titulo: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 30, lineHeight: 38 },
  cabecalho: { gap: spacing.xs },
  campo: { gap: spacing.xxs },
  rotulo: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 14 },
  controle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: radius.md
  },
  entrada: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: spacing.xs,
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 16
  },
  acoes: { gap: spacing.xs },
  enviando: { backgroundColor: colors.brandDark }
});
