import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';
import { AgendaNutritionist } from '../appointments.models';

interface NutritionistCatalogProps {
  nutritionists: AgendaNutritionist[];
  selected?: AgendaNutritionist;
  onSelect: (id: number | null) => void;
}

export function NutritionistCatalog({ nutritionists, selected, onSelect }: NutritionistCatalogProps) {
  return (
    <View style={styles.catalog}>
      <Text style={styles.title} accessibilityRole="header">Nutricionistas</Text>
      {selected ? (
        <>
          <View style={styles.option}>
            <Text style={styles.name}>{selected.nome}</Text>
            <Text style={styles.description}>{selected.vinculado ? 'Em acompanhamento' : 'Consulta avulsa'}</Text>
          </View>
          {nutritionists.length > 1 && (
            <Pressable
              style={styles.change}
              accessibilityRole="button"
              onPress={() => onSelect(null)}
            >
              <Text style={styles.name}>Trocar nutricionista</Text>
            </Pressable>
          )}
        </>
      ) : nutritionists.length > 0 ? (
        <>
          <Text style={styles.description}>Escolha um profissional para ver os horários livres.</Text>
          {nutritionists.map((nutritionist) => (
            <Pressable
              key={nutritionist.id}
              style={styles.option}
              accessibilityRole="button"
              accessibilityLabel={'Selecionar ' + nutritionist.nome}
              onPress={() => onSelect(nutritionist.id)}
            >
              <Text style={styles.name}>{nutritionist.nome}</Text>
              <Text style={styles.description}>
                {nutritionist.vinculado ? 'Em acompanhamento' : 'Consulta avulsa'}
              </Text>
            </Pressable>
          ))}
        </>
      ) : (
        <Text style={styles.description}>Nenhum nutricionista disponível para agendamento.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 18
  },
  option: {
    backgroundColor: colors.subtle,
    borderRadius: radius.sm,
    gap: spacing.xxs,
    padding: spacing.md
  },
  name: {
    color: colors.brandDark,
    fontFamily: fontFamily.bold,
    fontSize: 14
  },
  description: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 13
  },
  change: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm
  }
});
