import { Feather } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AvaliacaoHistorico, calcularVariacao } from '../../../core/evolucao/evolucao.service';
import { colors, fontFamily, radius, shadows, spacing } from '../../../theme/tokens';
import { useCarrosselEvolucao } from './useCarrosselEvolucao';

interface Props {
  avaliacoes: AvaliacaoHistorico[];
}

interface MedidaCardItem {
  id: string;
  titulo: string;
  valor: string;
  variacaoTexto?: string;
  direcao?: 'queda' | 'alta' | 'estavel';
}

export function MedidasGridCarousel({ avaliacoes }: Props) {
  const { fontScale = 1 } = useWindowDimensions();

  const atual = avaliacoes[0];
  const anterior = avaliacoes.length > 1 ? avaliacoes[1] : undefined;

  const extrairMedida = (
    titulo: string,
    valAtual: number | null | undefined,
    valAnterior: number | null | undefined,
    unidade: string,
    decimais = 1
  ): MedidaCardItem => {
    if (valAtual == null) {
      return {
        id: titulo,
        titulo,
        valor: '—'
      };
    }
    const variacao = anterior && valAnterior != null
      ? calcularVariacao(valAtual, valAnterior, unidade, decimais)
      : null;

    const valorFormatado = decimais === 0
      ? `${Math.round(valAtual)} ${unidade}`.trim()
      : `${valAtual.toFixed(decimais).replace('.', ',')} ${unidade}`.trim();

    return {
      id: titulo,
      titulo,
      valor: valorFormatado,
      variacaoTexto: variacao?.texto,
      direcao: variacao?.direcao
    };
  };

  // Montamos os grupos de 4 medidas por slide (grade 2x2)
  const slides: MedidaCardItem[][] = [
    // Slide 1: Principais Circunferências e RCQ
    [
      extrairMedida('Cintura', atual?.circunferenciaCintura, anterior?.circunferenciaCintura, 'cm'),
      extrairMedida('Quadril', atual?.circunferenciaQuadril, anterior?.circunferenciaQuadril, 'cm'),
      extrairMedida('Braço', atual?.circunferenciaBraco, anterior?.circunferenciaBraco, 'cm'),
      extrairMedida('Relação Cintura/Quadril', atual?.razaoCinturaQuadril, anterior?.razaoCinturaQuadril, '', 2)
    ],
    // Slide 2: Composição corporal calculada
    [
      extrairMedida('Massa Magra', atual?.massaMagraKg, anterior?.massaMagraKg, 'kg'),
      extrairMedida('Massa Gorda', atual?.massaGordaKg, anterior?.massaGordaKg, 'kg'),
      extrairMedida('Massa Muscular', atual?.massaMuscularKg, anterior?.massaMuscularKg, 'kg'),
      extrairMedida('Soma das 7 pregas', atual?.somaSetePregas, anterior?.somaSetePregas, 'mm')
    ],
    // Slide 3: Primeiras quatro pregas de Jackson-Pollock
    [
      extrairMedida('Prega Peitoral', atual?.pregaPeitoral, anterior?.pregaPeitoral, 'mm'),
      extrairMedida('Prega Axilar média', atual?.pregaAxilarMedia, anterior?.pregaAxilarMedia, 'mm'),
      extrairMedida('Prega Tricipital', atual?.pregaTricipital, anterior?.pregaTricipital, 'mm'),
      extrairMedida('Prega Subescapular', atual?.pregaSubescapular, anterior?.pregaSubescapular, 'mm'),
    ],
    // Slide 4: Demais pregas e medidas gerais
    [
      extrairMedida('Prega Abdominal', atual?.pregaAbdominal, anterior?.pregaAbdominal, 'mm'),
      extrairMedida('Prega Supra-ilíaca', atual?.pregaSuprailiaca, anterior?.pregaSuprailiaca, 'mm'),
      extrairMedida('Prega da Coxa', atual?.pregaCoxa, anterior?.pregaCoxa, 'mm'),
      extrairMedida('Prega Bicipital', atual?.pregaBicipital, anterior?.pregaBicipital, 'mm')
    ],
    // Slide 5: Altura, peso e IMC
    [
      extrairMedida('Altura', atual?.altura ? (atual.altura > 3 ? atual.altura : atual.altura * 100) : null, undefined, 'cm', 0),
      extrairMedida('Peso', atual?.peso, anterior?.peso, 'kg'),
      extrairMedida('IMC', atual?.imc, anterior?.imc, '', 2),
      extrairMedida('Gordura Corporal', atual?.percentualGordura, anterior?.percentualGordura, '%')
    ]
  ];

  const { definirRef, pagina, largura, irPara, onLayout, aoRolar } = useCarrosselEvolucao(slides.length);
  const larguraCard = largura && fontScale < 1.45 ? (largura - spacing.xs) / 2 : '100%';
  const larguraBotao = Platform.OS === 'android' ? 48 : 44;
  return (
    <View style={styles.container} testID="medidas-grid-carousel">
      <View style={styles.headerRow}>
        <View style={styles.sectionIcon} aria-hidden>
          <Feather name="activity" size={20} color={colors.brand} />
        </View>
        <Text style={styles.secaoTitulo} accessibilityRole="header" aria-level={2}>Medidas corporais</Text>
        <Text style={styles.contadorPagina} aria-live="polite" accessibilityLiveRegion="polite">
          {pagina + 1} de {slides.length}
        </Text>
      </View>

      <ScrollView
        ref={definirRef}
        style={styles.carousel}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={onLayout}
        onMomentumScrollEnd={aoRolar}
        onScroll={Platform.OS === 'web' ? aoRolar : undefined}
        scrollEventThrottle={32}
      >
        {slides.map((slide, indice) => {
          const ativo = indice === pagina;
          return (
            <View
              key={slide[0].id}
              style={[styles.grid, { width: largura || '100%' }]}
              aria-hidden={!ativo}
              accessibilityElementsHidden={!ativo}
              importantForAccessibility={ativo ? 'auto' : 'no-hide-descendants'}
            >
              {slide.map(item => (
                <View key={item.id} style={[styles.card, { width: larguraCard }]}>
                  <Text style={styles.cardTitulo}>{item.titulo}</Text>
                  <Text style={styles.cardValor}>{item.valor}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardSub}>Última medição</Text>
                    {item.variacaoTexto && (
                      <Text style={[
                        styles.badgeTexto,
                        item.direcao === 'queda' && styles.badgeTextoQueda,
                        item.direcao === 'alta' && styles.badgeTextoAlta
                      ]}>
                        {item.variacaoTexto}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.pagesRow}>
        {slides.map((slide, indice) => {
          const ativo = indice === pagina;
          return (
            <Pressable
              key={slide[0].id}
              onPress={() => irPara(indice)}
              style={({ pressed }) => [
                styles.pageButton, { minWidth: larguraBotao },
                ativo && styles.pageButtonActive, pressed && styles.pressed
              ]}
              accessibilityRole="button"
              accessibilityLabel={'Slide ' + (indice + 1)}
              accessibilityState={{ selected: ativo }}
              {...(Platform.OS === 'web' && { 'aria-pressed': ativo })}
            >
              <Text style={[styles.pageNumber, ativo && styles.pageNumberActive]}>{indice + 1}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm, ...shadows.card
  },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  sectionIcon: {
    width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.confirmedBackground,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  secaoTitulo: { flexGrow: 1, flexShrink: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 20, lineHeight: 27 },
  contadorPagina: { color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 19, fontVariant: ['tabular-nums'] },
  carousel: { width: '100%', flexGrow: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', gap: spacing.xs },
  card: {
    backgroundColor: colors.page, borderRadius: radius.md, padding: spacing.sm,
    borderWidth: 1, borderColor: colors.border, gap: spacing.xxs
  },
  cardTitulo: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20 },
  cardValor: {
    color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 23, lineHeight: 30, fontVariant: ['tabular-nums']
  },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xxs },
  cardSub: { flexShrink: 1, color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 18 },
  badgeTexto: {
    flexShrink: 1, color: colors.text, fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 18,
    borderRadius: radius.sm, paddingHorizontal: spacing.xxs, backgroundColor: colors.subtle
  },
  badgeTextoQueda: { color: colors.brandDeep, backgroundColor: colors.confirmedBackground },
  badgeTextoAlta: { color: colors.dangerText, backgroundColor: colors.dangerButtonBackground },
  pagesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  pageButton: {
    minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs,
    backgroundColor: colors.page, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md
  },
  pageButtonActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  pageNumber: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20 },
  pageNumberActive: { color: colors.white },
  pressed: { opacity: 0.8 }
});
