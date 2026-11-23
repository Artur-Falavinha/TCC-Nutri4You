import { Feather } from '@expo/vector-icons';
import { type ComponentRef, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionCardHeader, sectionCardStyles } from '../../../components/layout/SectionCardHeader';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';
import { AgendaNutritionist } from '../appointments.models';

const LIMITE_SUGESTOES = 4;

interface NutritionistCatalogProps {
  nutritionists: AgendaNutritionist[];
  selected?: AgendaNutritionist;
  onSelect: (id: number | null) => void;
}

function normalizarBusca(valor: string): string {
  return valor.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function NutritionistCatalog({ nutritionists, selected, onSelect }: NutritionistCatalogProps) {
  const [busca, setBusca] = useState('');
  const [campoFocado, setCampoFocado] = useState(false);
  const [focarAoTrocar, setFocarAoTrocar] = useState(false);
  const campoBusca = useRef<ComponentRef<typeof TextInput>>(null);
  const temVinculo = nutritionists.some((nutricionista) => nutricionista.vinculado);
  const termo = normalizarBusca(busca);

  const indice = useMemo(
    () => nutritionists.map((nutricionista) => ({ nutricionista, nome: normalizarBusca(nutricionista.nome) })),
    [nutritionists]
  );
  const encontrados = termo
    ? indice.filter(({ nome }) => nome.includes(termo))
      .sort((primeiro, segundo) => Number(segundo.nome === termo) - Number(primeiro.nome === termo))
    : [];
  const sugestoes = encontrados.slice(0, LIMITE_SUGESTOES);
  const titulo = temVinculo
    ? 'Nutricionista vinculado'
    : selected ? 'Nutricionista selecionado' : 'Encontre um nutricionista';

  const selecionar = (id: number) => {
    Keyboard.dismiss();
    setBusca('');
    setCampoFocado(false);
    setFocarAoTrocar(false);
    onSelect(id);
  };

  return (
    <View style={sectionCardStyles.superficie}>
      <SectionCardHeader icone="user" titulo={titulo} />
      {selected ? (
        <>
          <View style={styles.selecionado}>
            <View style={styles.dados}>
              <Text style={styles.nome}>{selected.nome}</Text>
              <Text style={[styles.descricao, styles.descricaoSelecionada]}>
                {selected.vinculado ? 'Em acompanhamento' : 'Disponível para agendamento'}
              </Text>
            </View>
            <Feather name="check-circle" size={20} color={colors.brand} aria-hidden />
          </View>
          {!selected.vinculado && (
            <Text style={styles.descricao}>
              O vínculo será criado automaticamente quando o nutricionista aceitar o agendamento.
            </Text>
          )}
          {nutritionists.length > 1 && (
            <Pressable
              style={({ pressed }) => [styles.trocar, pressed && styles.pressionado]}
              accessibilityRole="button"
              onPress={() => {
                setFocarAoTrocar(true);
                onSelect(null);
              }}
            >
              <Feather name="repeat" size={16} color={colors.brandDark} aria-hidden />
              <Text style={styles.nome}>Trocar nutricionista</Text>
            </Pressable>
          )}
        </>
      ) : nutritionists.length > 0 ? (
        <View style={styles.busca}>
          <Text style={styles.descricao}>Digite o nome para consultar os horários disponíveis.</Text>
          <View style={[styles.campo, campoFocado && styles.campoFocado]}>
            <Feather name="search" size={18} color={colors.brandDeep} aria-hidden />
            <TextInput
              ref={campoBusca}
              style={styles.entrada}
              value={busca}
              onChangeText={setBusca}
              onFocus={() => setCampoFocado(true)}
              onBlur={() => setCampoFocado(false)}
              placeholder="Pesquisar por nome"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Pesquisar nutricionistas disponíveis"
              autoFocus={focarAoTrocar}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={150}
            />
            {busca.length > 0 && (
              <Pressable
                style={({ pressed }) => [styles.limpar, pressed && styles.pressionado]}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                onPress={() => {
                  setBusca('');
                  campoBusca.current?.focus();
                }}
              >
                <Feather name="x" size={18} color={colors.brandDeep} aria-hidden />
              </Pressable>
            )}
          </View>

          {sugestoes.length > 0 && (
            <View style={styles.painel}>
              {sugestoes.map(({ nutricionista }, posicao) => (
                <Pressable
                  key={nutricionista.id}
                  style={({ pressed }) => [
                    styles.sugestao,
                    posicao === 0 ? styles.primeiraSugestao : styles.separador,
                    posicao === sugestoes.length - 1 && styles.ultimaSugestao,
                    pressed && styles.pressionado
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={'Selecionar ' + nutricionista.nome}
                  accessibilityHint="Mostra o calendário de agendamento"
                  onPress={() => selecionar(nutricionista.id)}
                >
                  <View style={styles.dados}>
                    <Text style={styles.nome}>{nutricionista.nome}</Text>
                    <Text style={styles.descricao}>
                      {nutricionista.vinculado ? 'Em acompanhamento' : 'Disponível para primeira consulta'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.brandDark} aria-hidden />
                </Pressable>
              ))}
            </View>
          )}
          {termo && sugestoes.length === 0 && (
            <Text style={styles.retorno} aria-live="polite" accessibilityLiveRegion="polite">
              Nenhum nutricionista encontrado. Tente outro nome.
            </Text>
          )}
          {encontrados.length > LIMITE_SUGESTOES && (
            <Text style={styles.retorno} aria-live="polite" accessibilityLiveRegion="polite">
              Digite mais do nome para refinar a busca.
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.descricao}>Nenhum nutricionista disponível para agendamento.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  busca: { gap: spacing.xs },
  campo: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.page
  },
  campoFocado: { borderColor: colors.brand },
  entrada: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    outlineStyle: 'solid',
    outlineWidth: 0,
    paddingVertical: spacing.xs,
    color: colors.text,
    fontFamily: fontFamily.semibold,
    fontSize: 16
  },
  limpar: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  painel: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  sugestao: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm
  },
  primeiraSugestao: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  ultimaSugestao: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  separador: { borderTopWidth: 1, borderTopColor: colors.border },
  selecionado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.confirmedBackground,
    borderRadius: radius.md,
    padding: spacing.sm
  },
  dados: { flex: 1, minWidth: 0, gap: spacing.xxs },
  nome: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 21 },
  descricao: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  descricaoSelecionada: { color: colors.brandDeep },
  retorno: {
    color: colors.text,
    backgroundColor: colors.subtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21
  },
  trocar: {
    minHeight: 48,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  pressionado: { backgroundColor: colors.confirmedBackground }
});
