import { StyleSheet, Text, View } from 'react-native';

import { nutrientEntries } from '../../../features/dieta/dieta.formatters';
import { MacroDistribution, Nutrients } from '../../../features/dieta/dieta.models';
import { colors, fontFamily, radius, shadows, spacing } from '../../../theme/tokens';

interface NutrientSummaryCardProps {
  title: string;
  nutrients: Nutrients;
  goals?: Nutrients | null;
  distribution?: MacroDistribution | null;
  subtitle?: string;
}

interface ProgressSpec {
  label: string;
  key: string;
  current: number | null;
  target: number | null;
}

function buildProgressSpecs(nutrients: Nutrients, goals?: Nutrients | null): ProgressSpec[] {
  return [
    { label: 'Energia', key: 'kcal', current: nutrients.kcal, target: goals?.kcal ?? null },
    { label: 'Proteínas', key: 'proteinas', current: nutrients.proteinas, target: goals?.proteinas ?? null },
    {
      label: 'Carboidratos',
      key: 'carboidratos',
      current: nutrients.carboidratos,
      target: goals?.carboidratos ?? null
    },
    { label: 'Gorduras', key: 'gorduras', current: nutrients.gorduras, target: goals?.gorduras ?? null },
    { label: 'Fibras', key: 'fibras', current: nutrients.fibras, target: goals?.fibras ?? null }
  ];
}

export function NutrientSummaryCard({
  title,
  nutrients,
  goals,
  distribution,
  subtitle
}: NutrientSummaryCardProps) {
  const entries = nutrientEntries(nutrients);
  const specs = buildProgressSpecs(nutrients, goals);

  return (
    <View style={styles.card}>
      <View style={styles.headerBlock}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.grid}>
        {entries.map((entry, idx) => {
          const spec = specs[idx];
          const hasGoal =
            goals != null &&
            spec?.current != null &&
            spec?.target != null &&
            spec.target > 0;
          const rawRatio = hasGoal ? (spec.current as number) / (spec.target as number) : 0;
          const percentage = hasGoal ? Math.round(rawRatio * 100) : null;
          const clampedPercent = hasGoal ? Math.min(Math.max(rawRatio * 100, 0), 100) : 0;
          const exceeded = hasGoal && (spec.current as number) > (spec.target as number);
          const macroPercent = spec.key === 'proteinas' ? distribution?.proteinas
            : spec.key === 'carboidratos' ? distribution?.carboidratos
              : spec.key === 'gorduras' ? distribution?.gorduras : null;

          return (
            <View key={entry.label} style={[styles.cell, hasGoal && styles.cellFullWidth]}>
              <View style={styles.cellHeader}>
                <Text style={styles.label}>{entry.label}</Text>
                {percentage != null ? (
                  <Text
                    style={[styles.percentBadge, exceeded && styles.percentBadgeExceeded]}
                    testID={`nutrient-progress-percent-${spec.key}`}
                  >
                    {percentage}% da meta
                  </Text>
                ) : null}
              </View>
              <Text style={styles.value}>{entry.value}{macroPercent != null ? ` · ${macroPercent}%` : ''}</Text>
              {hasGoal ? (
                <View style={styles.progressSection}>
                  <View
                    style={styles.progressTrack}
                    testID={`nutrient-progress-bar-${spec.key}`}
                    accessibilityRole="progressbar"
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${clampedPercent}%` },
                        exceeded && styles.progressFillExceeded
                      ]}
                    />
                  </View>
                  {exceeded ? (
                    <Text
                      style={styles.exceededText}
                      testID={`nutrient-progress-exceeded-${spec.key}`}
                    >
                      Acima da meta diária (referência)
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card
  },
  headerBlock: {
    gap: 2
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 16
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 17
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: colors.pageAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 6
  },
  cellFullWidth: {
    flexBasis: '100%'
  },
  cellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
    fontSize: 12
  },
  percentBadge: {
    color: colors.brandDeep,
    fontFamily: fontFamily.bold,
    fontSize: 11
  },
  percentBadgeExceeded: {
    color: '#b45309'
  },
  value: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 15
  },
  progressSection: {
    gap: 4,
    marginTop: 2
  },
  progressTrack: {
    height: 8,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: radius.pill,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: radius.pill
  },
  progressFillExceeded: {
    backgroundColor: '#d97706'
  },
  exceededText: {
    color: '#b45309',
    fontFamily: fontFamily.semibold,
    fontSize: 11
  }
});
