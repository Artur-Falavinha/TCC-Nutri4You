import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AvaliacaoHistorico, calcularVariacao } from '../../../core/evolucao/evolucao.service';

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
  const [pagina, setPagina] = useState(0);
  const [containerWidth, setContainerWidth] = useState(
    Dimensions.get('window').width - 32
  );
  const scrollRef = useRef<ScrollView>(null);

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
      ? calcularVariacao(valAtual, valAnterior, unidade)
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
    // Slide 2: Composição e Dobras Principais
    [
      extrairMedida('Massa Muscular', atual?.massaMuscularKg, anterior?.massaMuscularKg, 'kg'),
      extrairMedida('IMC', atual?.imc, anterior?.imc, '', 2),
      extrairMedida('Prega Tricipital', atual?.pregaTricipital, anterior?.pregaTricipital, 'mm'),
      extrairMedida('Prega Supra-ilíaca', atual?.pregaSuprailiaca, anterior?.pregaSuprailiaca, 'mm')
    ],
    // Slide 3: Dobras Complementares e Altura
    [
      extrairMedida('Prega Bicipital', atual?.pregaBicipital, anterior?.pregaBicipital, 'mm'),
      extrairMedida('Prega Subescapular', atual?.pregaSubescapular, anterior?.pregaSubescapular, 'mm'),
      extrairMedida('Altura', atual?.altura ? (atual.altura > 3 ? atual.altura : atual.altura * 100) : null, undefined, 'cm', 0),
      extrairMedida('Peso', atual?.peso, anterior?.peso, 'kg')
    ]
  ];

  return (
    <View
      style={styles.container}
      testID="medidas-grid-carousel"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) {
          setContainerWidth(w);
        }
      }}
    >
      <View style={styles.headerRow}>
        <Text style={styles.secaoTitulo}>Medidas corporais</Text>
        <Text style={styles.contadorPagina}>
          {pagina + 1} de {slides.length}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          if (containerWidth > 0) {
            const nextIdx = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
            setPagina(Math.max(0, Math.min(nextIdx, slides.length - 1)));
          }
        }}
      >
        {slides.map((slide, slideIdx) => (
          <View
            key={`slide-grid-${slideIdx}`}
            style={[styles.grid, { width: containerWidth }]}
          >
            {slide.map((item) => {
              const temVariacao = !!item.variacaoTexto;
              const isQueda = item.direcao === 'queda';
              const isAlta = item.direcao === 'alta';

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitulo} numberOfLines={1}>
                      {item.titulo}
                    </Text>
                    {temVariacao && (
                      <View
                        style={[
                          styles.badge,
                          isQueda && styles.badgeQueda,
                          isAlta && styles.badgeAlta
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeTexto,
                            isQueda && styles.badgeTextoQueda,
                            isAlta && styles.badgeTextoAlta
                          ]}
                        >
                          {item.variacaoTexto}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardValor} numberOfLines={1}>
                    {item.valor}
                  </Text>

                  <Text style={styles.cardSub}>ÚLTIMA MEDIÇÃO</Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, idx) => (
          <Pressable
            key={`dot-${idx}`}
            onPress={() => {
              setPagina(idx);
              scrollRef.current?.scrollTo?.({ x: idx * containerWidth, animated: true });
            }}
            style={[styles.dot, idx === pagina && styles.dotAtivo]}
            accessibilityRole="button"
            accessibilityLabel={`Slide ${idx + 1}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  contadorPagina: {
    fontSize: 12,
    color: '#64748b'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 4
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#f1f5f9'
  },
  badgeQueda: {
    backgroundColor: '#e8f5e9'
  },
  badgeAlta: {
    backgroundColor: '#fef3f2'
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },
  badgeTextoQueda: {
    color: '#006f1e'
  },
  badgeTextoAlta: {
    color: '#b42318'
  },
  cardValor: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 4
  },
  cardSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1'
  },
  dotAtivo: {
    width: 22,
    backgroundColor: '#006f1e'
  }
});

