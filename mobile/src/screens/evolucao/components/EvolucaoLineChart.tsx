import { useState } from 'react';
import { type LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Path, Polyline } from 'react-native-svg';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';

export interface ChartDataPoint {
  label: string;
  dataFormatada?: string;
  value: number;
  formatted?: string;
}

interface Props {
  data: ChartDataPoint[];
  unidade?: string;
  cor?: string;
  height?: number;
  interativo?: boolean;
}

export function EvolucaoLineChart({
  data,
  unidade = '',
  cor = colors.brand,
  height = 160,
  interativo = true
}: Props) {
  const { fontScale = 1 } = useWindowDimensions();
  const [largura, setLargura] = useState(300);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const onLayout = (event: LayoutChangeEvent) => {
    const medida = event.nativeEvent.layout.width;
    if (medida > 0) setLargura(medida);
  };

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { minHeight: height }]}>
        <Text style={styles.emptyText}>Sem dados suficientes para o gráfico.</Text>
      </View>
    );
  }

  const indiceAtivo = selecionado !== null && selecionado < data.length ? selecionado : data.length - 1;
  const rotuloLargura = Math.min(48 * Math.max(1, fontScale), largura / 2);
  const alvo = Platform.OS === 'android' ? 48 : 44;
  const margem = Math.max(alvo / 2, rotuloLargura / 2);
  const areaUtil = Math.max(1, largura - margem * 2);
  const topo = alvo / 2;
  const base = height - alvo / 2;

  const valores = data.map((ponto) => ponto.value);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const intervalo = maximo - minimo;
  const amplitude = intervalo === 0 ? Math.max(maximo * 0.2, 1) : intervalo * 1.3;
  const origem = minimo - (intervalo === 0 ? amplitude / 2 : intervalo * 0.15);
  const distancia = data.length > 1 ? areaUtil / (data.length - 1) : areaUtil;
  const passoRotulos = Math.max(1, Math.ceil(rotuloLargura / distancia));

  const pontos = data.map((item, indice) => ({
    x: data.length === 1 ? largura / 2 : margem + indice * distancia,
    y: base - Math.max(0, Math.min(1, (item.value - origem) / amplitude)) * (base - topo),
    item
  }));
  const pontoAtivo = pontos[indiceAtivo];
  const coordenadas = pontos.map(({ x, y }) => x + ',' + y).join(' ');
  const contorno = 'M ' + coordenadas + ' L ' + pontos[pontos.length - 1].x + ',' + base + ' L ' + pontos[0].x + ',' + base + ' Z';
  const larguraAlvo = Math.min(alvo, data.length > 1 ? distancia : largura);
  const formatarPonto = (ponto: ChartDataPoint) => ponto.formatted || (ponto.value + ' ' + unidade).trim();

  return (
    <View style={styles.container} onLayout={onLayout} testID="evolucao-line-chart">
      <View style={styles.leitura} aria-live="polite" accessibilityLiveRegion="polite">
        {pontoAtivo.item.dataFormatada ? <Text style={styles.data}>{pontoAtivo.item.dataFormatada}</Text> : null}
        <Text style={[styles.valor, { color: cor }]}>{formatarPonto(pontoAtivo.item)}</Text>
      </View>
      <View style={styles.area}>
        <View style={{ height }}>
          <View style={styles.tracado} aria-hidden>
            <Svg width={largura} height={height}>
              {[topo, (topo + base) / 2, base].map((y) => (
                <Line key={y} x1={margem} x2={largura - margem} y1={y} y2={y} stroke={colors.border} strokeDasharray="4 4" />
              ))}
              <Line x1={pontoAtivo.x} x2={pontoAtivo.x} y1={topo} y2={base} stroke={cor} strokeOpacity={0.3} />
              {pontos.length > 1 && (
                <>
                  <Path d={contorno} fill={cor} fillOpacity={0.08} />
                  <Polyline points={coordenadas} fill="none" stroke={cor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                </>
              )}
            </Svg>
          </View>

          {pontos.map(({ x, y, item }, indice) => {
            const ativo = indice === indiceAtivo;
            return (
              <Pressable
                key={indice}
                onPress={() => setSelecionado(indice)}
                style={({ pressed }) => [
                  styles.alvo, { left: x - larguraAlvo / 2, top: y - alvo / 2, width: larguraAlvo, height: alvo },
                  pressed && styles.pressionado
                ]}
                tabIndex={interativo ? 0 : -1}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                {...(Platform.OS === 'web' && { 'aria-pressed': ativo })}
                accessibilityLabel={(item.dataFormatada || item.label) + ': ' + formatarPonto(item)}
              >
                <View style={[styles.ponto, { borderColor: cor }, ativo && [styles.pontoAtivo, { backgroundColor: cor }]]} aria-hidden>
                  {ativo && <View style={styles.centroPonto} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.rotulos, { height: 24 * Math.max(1, fontScale) }]} aria-hidden>
          {pontos.map(({ x, item }, indice) => {
            const ultimo = pontos.length - 1;
            const exibir = indice === ultimo || (indice % passoRotulos === 0 && (ultimo - indice) * distancia >= rotuloLargura);
            if (!exibir) return null;
            return (
              <Text
                key={indice}
                style={[styles.rotulo, { left: x - rotuloLargura / 2, width: rotuloLargura }, indice === indiceAtivo && { color: cor }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: spacing.xs },
  leitura: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: spacing.xs },
  data: { color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 19, fontVariant: ['tabular-nums'] },
  valor: { fontFamily: fontFamily.extrabold, fontSize: 15, lineHeight: 21, fontVariant: ['tabular-nums'] },
  area: { borderRadius: radius.md, backgroundColor: colors.page },
  tracado: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
  alvo: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pressionado: { opacity: 0.75 },
  ponto: {
    width: 10, height: 10, borderRadius: radius.pill, borderWidth: 2, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center'
  },
  pontoAtivo: { width: 16, height: 16 },
  centroPonto: { width: 5, height: 5, borderRadius: radius.pill, backgroundColor: colors.white },
  rotulos: { position: 'relative' },
  rotulo: {
    position: 'absolute', textAlign: 'center', color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 18
  },
  emptyContainer: { backgroundColor: colors.page, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  emptyText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' }
});
