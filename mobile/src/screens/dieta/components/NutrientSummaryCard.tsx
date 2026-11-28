import { StyleSheet, Text, View } from 'react-native';

import { formatGrams, formatNutrientAmount, nutrientEntries } from '../../../features/dieta/dieta.formatters';
import { MacroDistribution, Nutrients } from '../../../features/dieta/dieta.models';
import { colors, fontFamily, radius, shadows, spacing } from '../../../theme/tokens';

interface NutrientSummaryCardProps {
  title: string;
  nutrients: Nutrients;
  goals?: Nutrients | null;
  distribution?: MacroDistribution | null;
  subtitle?: string;
  /** `goals` exibe o percentual energético em destaque e as gramas como valor secundário. */
  mode?: 'summary' | 'goals';
}

interface GoalRow {
  key: string;
  label: string;
  primary: string;
  secondary?: string;
}

function percentOfEnergy(grams: number, kcal: number, factor: number): number {
  return kcal > 0 ? Math.round(((grams * factor) / kcal) * 100 * 100) / 100 : 0;
}

export function buildGoalRows(nutrients: Nutrients, distribution?: MacroDistribution | null): GoalRow[] {
  const rows: GoalRow[] = [
    { key: 'kcal', label: 'Calorias', primary: `${formatGrams(nutrients.kcal)} kcal` }
  ];
  const macros = [
    { key: 'carboidratos', label: 'Carboidratos', grams: nutrients.carboidratos, factor: 4, informed: distribution?.carboidratos },
    { key: 'proteinas', label: 'Proteínas', grams: nutrients.proteinas, factor: 4, informed: distribution?.proteinas },
    { key: 'gorduras', label: 'Gorduras', grams: nutrients.gorduras, factor: 9, informed: distribution?.gorduras }
  ];
  macros.forEach((macro) => {
    const percent = macro.informed ?? percentOfEnergy(macro.grams, nutrients.kcal, macro.factor);
    rows.push({
      key: macro.key,
      label: macro.label,
      primary: `${formatGrams(percent)}%`,
      secondary: `${formatGrams(macro.grams)} g`
    });
  });
  if (nutrients.fibras != null) {
    rows.push({ key: 'fibras', label: 'Fibras', primary: formatNutrientAmount(nutrients.fibras) });
  }
  return rows;
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
  subtitle,
  mode = 'summary'
}: NutrientSummaryCardProps) {
  if (mode === 'goals') {
    return (
      <View style={styles.card} testID="nutrient-goals-card">
        <View style={styles.headerBlock}>
          <Text style={styles.title} accessibilityRole="header" aria-level={2}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View>
          {buildGoalRows(nutrients, distribution).map((row, index, all) => (
            <View
              key={row.key}
              style={[styles.goalRow, index === all.length - 1 && styles.goalRowLast]}
              testID={`nutrient-goal-row-${row.key}`}
            >
              <Text style={styles.goalLabel}>
                {row.label}
                {row.secondary ? (
                  <Text style={styles.goalSecondary} testID={`nutrient-goal-secondary-${row.key}`}>
                    {` ${row.secondary}`}
                  </Text>
                ) : null}
              </Text>
              <Text style={styles.goalPrimary} testID={`nutrient-goal-primary-${row.key}`}>
                {row.primary}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const entries = nutrientEntries(nutrients);
  const specs = buildProgressSpecs(nutrients, goals);

  return (
    <View style={styles.card}>
      <View style={styles.headerBlock}>
        <Text style={styles.title} accessibilityRole="header" aria-level={2}>
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
                    accessibilityLabel={entry.label}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(clampedPercent)}
                    aria-valuetext={`${percentage}% da meta`}
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
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card
  },
  headerBlock: {
    gap: 2
  },
  title: {
    color: colors.brandDeep,
    fontFamily: fontFamily.extrabold,
    fontSize: 18,
    lineHeight: 25
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19
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
    backgroundColor: colors.page,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 6
  },
  cellFullWidth: {
    flexBasis: '100%'
  },
  cellHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs
  },
  label: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
    fontSize: 13
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
    fontSize: 16,
    fontVariant: ['tabular-nums']
  },
  progressSection: {
    gap: 4,
    marginTop: 2
  },
  progressTrack: {
    height: 8,
    width: '100%',
    backgroundColor: colors.border,
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
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  goalRowLast: {
    borderBottomWidth: 0
  },
  goalLabel: {
    flexShrink: 1,
    color: colors.text,
    fontFamily: fontFamily.semibold,
    fontSize: 14
  },
  goalSecondary: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 13
  },
  goalPrimary: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontVariant: ['tabular-nums']
  }
});
