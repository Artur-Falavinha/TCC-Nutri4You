import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import DietIcon from '../../../assets/appointments/nav-diet.svg';
import { formatarNumeroMilhar } from '../../../core/evolucao/evolucao.service';
import { colors, fontFamily, radius, shadows, spacing } from '../../../theme/tokens';

type MedidaConsumo = { valor: number; percentual: number };

type Props = {
  calorias: MedidaConsumo & { meta: number };
  proteinas: MedidaConsumo;
  carboidratos: MedidaConsumo;
};

const TAMANHO_ANEL = 80;
const ESPESSURA_ANEL = 6;
const CENTRO_ANEL = TAMANHO_ANEL / 2;
const RAIO_ANEL = (TAMANHO_ANEL - ESPESSURA_ANEL) / 2;
const CIRCUNFERENCIA_ANEL = 2 * Math.PI * RAIO_ANEL;

export function DailyIntakeCard({ calorias, proteinas, carboidratos }: Props) {
  const progressoCalorias = Math.min(calorias.percentual, 100) / 100;

  return (
    <View style={styles.card} testID="dashboard-consumo-card">
      <View style={styles.cabecalho}>
        <View style={styles.marca} aria-hidden>
          <Feather name="activity" size={20} color={colors.brandDark} />
        </View>
        <Text style={styles.titulo} accessibilityRole="header">Consumo diário</Text>
      </View>

      <View style={styles.resumo}>
        <View style={styles.calorias}>
          <Text style={styles.valorCalorias}>
            {formatarNumeroMilhar(calorias.valor)}<Text style={styles.unidade}> kcal</Text>
          </Text>
          <Text style={styles.meta}>
            {calorias.meta > 0
              ? `Meta: ${formatarNumeroMilhar(calorias.meta)} kcal`
              : 'Meta calórica ainda não definida'}
          </Text>
        </View>

        <View style={styles.anel}>
          <View aria-hidden>
            <Svg width={TAMANHO_ANEL} height={TAMANHO_ANEL}>
              <Circle cx={CENTRO_ANEL} cy={CENTRO_ANEL} r={RAIO_ANEL}
                stroke={colors.white} strokeWidth={ESPESSURA_ANEL} fill="none" />
              {progressoCalorias > 0 && (
                <Circle
                  cx={CENTRO_ANEL}
                  cy={CENTRO_ANEL}
                  r={RAIO_ANEL}
                  stroke={colors.brand}
                  strokeWidth={ESPESSURA_ANEL}
                  strokeDasharray={[CIRCUNFERENCIA_ANEL, CIRCUNFERENCIA_ANEL]}
                  strokeDashoffset={CIRCUNFERENCIA_ANEL * (1 - progressoCalorias)}
                  strokeLinecap="round"
                  fill="none"
                  rotation={-90}
                  originX={CENTRO_ANEL}
                  originY={CENTRO_ANEL}
                />
              )}
            </Svg>
          </View>
          <View style={styles.centroAnel}>
            <Text
              style={styles.percentualCalorias}
              maxFontSizeMultiplier={1.5}
              accessibilityLabel={`${calorias.percentual}% da meta calórica`}
              testID="dashboard-kcal-percent"
            >
              {calorias.percentual}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.macros}>
        <MacroConsumo rotulo="Proteínas" medida={proteinas} />
        <MacroConsumo rotulo="Carbos" medida={carboidratos} />
      </View>
    </View>
  );
}

function MacroConsumo({ rotulo, medida }: { rotulo: 'Proteínas' | 'Carbos'; medida: MedidaConsumo }) {
  return (
    <View style={styles.macro}>
      <View style={styles.rotuloMacro}>
        <View aria-hidden>
          {rotulo === 'Proteínas'
            ? <DietIcon color={colors.brandDark} width={14} height={14} />
            : <Feather name="zap" size={14} color={colors.brandDark} />}
        </View>
        <Text style={styles.nomeMacro}>{rotulo}</Text>
      </View>
      <View style={styles.valoresMacro}>
        <Text style={styles.gramas}>{Math.round(medida.valor)} g</Text>
        <Text style={styles.percentualMacro}>{medida.percentual}%</Text>
      </View>
      <View style={styles.trilho} aria-hidden>
        <View style={[styles.barra, { width: `${Math.min(medida.percentual, 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  marca: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titulo: { flex: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 25 },
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.confirmedBackground
  },
  calorias: { flex: 1, minWidth: 0, gap: spacing.xxs },
  valorCalorias: {
    color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 32, fontVariant: ['tabular-nums']
  },
  unidade: { color: colors.brandDeep, fontFamily: fontFamily.semibold, fontSize: 14 },
  meta: { color: colors.brandDeep, fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 19 },
  anel: { width: TAMANHO_ANEL, height: TAMANHO_ANEL },
  centroAnel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  percentualCalorias: {
    color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 16, fontVariant: ['tabular-nums']
  },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  macro: {
    flexBasis: 108,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md
  },
  rotuloMacro: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  nomeMacro: { flexShrink: 1, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 13 },
  valoresMacro: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.xxs
  },
  gramas: { color: colors.text, fontFamily: fontFamily.extrabold, fontSize: 17, fontVariant: ['tabular-nums'] },
  percentualMacro: {
    color: colors.textSecondary, fontFamily: fontFamily.bold, fontSize: 13, fontVariant: ['tabular-nums']
  },
  trilho: { height: 5, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  barra: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.pill }
});
