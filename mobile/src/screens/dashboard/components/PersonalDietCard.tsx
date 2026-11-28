import { Feather } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionCardHeader, sectionCardStyles } from '../../../components/layout/SectionCardHeader';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';

export function PersonalDietCard({ abrirDieta }: { abrirDieta: () => void }) {
  return (
    <View style={sectionCardStyles.superficie} testID="dashboard-dieta-card">
      <SectionCardHeader titulo="Sua dieta personalizada" icone="book-open" />

      <View style={estilos.resumo}>
        <Text style={estilos.descricao}>
          Confira o plano de refeições atualizado pela sua nutricionista para hoje.
        </Text>
        <View style={estilos.recorte} aria-hidden>
          <Image
            source={require('../../../../assets/diet-card-bg.png')}
            style={estilos.foto}
            resizeMode="cover"
            accessible={false}
          />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [estilos.botao, pressed && estilos.botaoPressionado]}
        onPress={abrirDieta}
        accessibilityRole="button"
        testID="dashboard-acessar-dieta-btn"
      >
        <Text style={estilos.textoBotao}>Acessar Dieta</Text>
        <View aria-hidden>
          <Feather name="arrow-right" size={18} color={colors.white} />
        </View>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  resumo: {
    minHeight: 104,
    backgroundColor: colors.confirmedBackground,
    borderRadius: radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center'
  },
  descricao: {
    flex: 1,
    padding: spacing.sm,
    color: colors.brandDeep,
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 21
  },
  recorte: {
    width: '35%',
    maxWidth: 144,
    alignSelf: 'stretch',
    overflow: 'hidden'
  },
  foto: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 264,
    height: '100%',
    minHeight: 122
  },
  botao: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  botaoPressionado: { backgroundColor: colors.brandDark },
  textoBotao: { flexShrink: 1, color: colors.white, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20 }
});
