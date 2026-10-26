import { StyleSheet, Text, View } from 'react-native';

import { Nutrients } from '../../../features/dieta/dieta.models';
import { nutrientEntries } from '../../../features/dieta/dieta.formatters';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';

interface NutrientSummaryCardProps {
  title: string;
  nutrients: Nutrients;
}

export function NutrientSummaryCard({ title, nutrients }: NutrientSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.grid}>
        {nutrientEntries(nutrients).map((entry) => (
          <View key={entry.label} style={styles.cell}>
            <Text style={styles.label}>{entry.label}</Text>
            <Text style={styles.value}>{entry.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 16
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
    gap: 4
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 12
  },
  value: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 15
  }
});
