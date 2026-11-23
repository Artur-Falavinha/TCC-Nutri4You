import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';
import { AgendaNutritionist } from '../appointments.models';

interface NutritionistCatalogProps {
  nutritionists: AgendaNutritionist[];
  selected?: AgendaNutritionist;
  onSelect: (id: number | null) => void;
}

export function NutritionistCatalog({ nutritionists, selected, onSelect }: NutritionistCatalogProps) {
  const [search, setSearch] = useState('');
  const hasLinkedNutritionist = nutritionists.some((nutritionist) => nutritionist.vinculado);
  const filteredNutritionists = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return nutritionists;
    return nutritionists.filter((nutritionist) =>
      nutritionist.nome.toLocaleLowerCase('pt-BR').includes(term)
    );
  }, [nutritionists, search]);

  const select = (id: number | null) => {
    setSearch('');
    onSelect(id);
  };

  return (
    <View style={styles.catalog}>
      <Text style={styles.title} accessibilityRole="header">
        {hasLinkedNutritionist ? 'Nutricionista vinculado' : 'Encontre um nutricionista'}
      </Text>
      {selected ? (
        <>
          <View style={styles.option}>
            <Text style={styles.name}>{selected.nome}</Text>
            <Text style={styles.description}>{selected.vinculado ? 'Em acompanhamento' : 'Disponível para agendamento'}</Text>
          </View>
          {!selected.vinculado && <Text style={styles.description}>
            O vínculo será criado automaticamente quando o nutricionista aceitar o agendamento.
          </Text>}
          {nutritionists.length > 1 && (
            <Pressable
              style={styles.change}
              accessibilityRole="button"
              onPress={() => select(null)}
            >
              <Text style={styles.name}>Trocar nutricionista</Text>
            </Pressable>
          )}
        </>
      ) : nutritionists.length > 0 ? (
        <>
          <Text style={styles.description}>
            Pesquise e selecione um profissional para consultar a agenda disponível.
          </Text>
          <View style={styles.searchField}>
            <Feather name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Pesquisar por nome"
              placeholderTextColor={colors.textSubtle}
              accessibilityLabel="Pesquisar nutricionistas disponíveis"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={150}
            />
          </View>
          {filteredNutritionists.map((nutritionist) => (
            <Pressable
              key={nutritionist.id}
              style={styles.option}
              accessibilityRole="button"
              accessibilityLabel={'Selecionar ' + nutritionist.nome}
              onPress={() => select(nutritionist.id)}
            >
              <Text style={styles.name}>{nutritionist.nome}</Text>
              <Text style={styles.description}>
                {nutritionist.vinculado ? 'Em acompanhamento' : 'Disponível para primeira consulta'}
              </Text>
            </Pressable>
          ))}
          {filteredNutritionists.length === 0 && (
            <Text style={styles.description}>Nenhum nutricionista disponível com esse nome.</Text>
          )}
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
  searchField: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.white
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 14
  },
  change: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm
  }
});
