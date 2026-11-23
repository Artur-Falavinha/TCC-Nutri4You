import { Feather } from '@expo/vector-icons';
import { type ComponentRef, type ReactNode, useMemo, useRef, useState } from 'react';
import { Keyboard, type LayoutRectangle, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionCardHeader, sectionCardStyles } from '../../../components/layout/SectionCardHeader';
import { colors, fontFamily, radius, shadows, spacing } from '../../../theme/tokens';
import { AgendaNutritionist } from '../appointments.models';
import { AppointmentSteps } from './AppointmentSteps';

const LIMITE_SUGESTOES = 4;

interface NutritionistCatalogProps {
  nutritionists: AgendaNutritionist[];
  onSelect: (id: number) => void;
  children?: ReactNode;
}

function normalizarBusca(valor: string): string {
  return valor.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function NutritionistCatalog({ nutritionists, onSelect, children }: NutritionistCatalogProps) {
  const [busca, setBusca] = useState('');
  const [campoFocado, setCampoFocado] = useState(false);
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const [areaCampo, setAreaCampo] = useState<LayoutRectangle>();
  const campoBusca = useRef<ComponentRef<typeof TextInput>>(null);
  const vinculado = nutritionists.length === 1 && nutritionists[0].vinculado ? nutritionists[0] : undefined;
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
  const mostrarSugestoes = !!termo && sugestoesAbertas && !!areaCampo && !vinculado;
  const topoMenu = areaCampo ? areaCampo.y + areaCampo.height + spacing.xxs : 0;

  const selecionar = (id: number) => {
    Keyboard.dismiss();
    setBusca('');
    setCampoFocado(false);
    setSugestoesAbertas(false);
    onSelect(id);
  };

  return (
    <View style={styles.pagina}>
      <View style={sectionCardStyles.superficie} testID="agenda-marcar-consulta">
        <SectionCardHeader icone="user" titulo={vinculado ? 'Marcar consulta' : 'Marcar primeira consulta'} />
        <AppointmentSteps atual={1} />
        {vinculado ? (
          <Pressable
            style={({ pressed }) => [styles.vinculado, pressed && styles.pressionado]}
            accessibilityRole="button"
            onPress={() => selecionar(vinculado.id)}
          >
            <View style={styles.dados}>
              <Text style={styles.nome}>{vinculado.nome}</Text>
              <Text style={styles.descricao}>Escolher data e horário</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.brandDark} aria-hidden />
          </Pressable>
        ) : nutritionists.length > 0 ? (
          <>
            <Text style={styles.rotulo}>Encontre um nutricionista</Text>
            <View
              style={[styles.campo, campoFocado && styles.campoFocado]}
              onLayout={(evento) => setAreaCampo(evento.nativeEvent.layout)}
              testID="agenda-busca-campo"
            >
              <Feather name="search" size={18} color={colors.brandDeep} aria-hidden />
              <TextInput
                ref={campoBusca}
                style={styles.entrada}
                value={busca}
                onChangeText={(valor) => {
                  setBusca(valor);
                  setSugestoesAbertas(true);
                }}
                onFocus={() => {
                  setCampoFocado(true);
                  setSugestoesAbertas(true);
                }}
                onBlur={() => setCampoFocado(false)}
                onKeyPress={(evento) => {
                  if (evento.nativeEvent.key === 'Escape') setSugestoesAbertas(false);
                }}
                placeholder="Pesquisar por nome"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Pesquisar nutricionistas disponíveis"
                accessibilityHint="Digite um nome para ver as sugestões"
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
          </>
        ) : (
          <Text style={styles.descricao}>Nenhum nutricionista disponível para agendamento.</Text>
        )}
      </View>

      {mostrarSugestoes && (
        <>
          <Pressable
            style={[styles.fundoSugestoes, { top: topoMenu }]}
            onPress={() => {
              setSugestoesAbertas(false);
              Keyboard.dismiss();
            }}
            focusable={false}
            accessible={false}
            aria-hidden
          />
          <View
            style={[styles.painel, { top: topoMenu, left: areaCampo.x, width: areaCampo.width }]}
            testID="agenda-sugestoes"
          >
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.rolagemSugestoes}>
              {sugestoes.map(({ nutricionista }, posicao) => (
                <Pressable
                  key={nutricionista.id}
                  style={({ pressed }) => [
                    styles.sugestao,
                    posicao > 0 && styles.separador,
                    pressed && styles.pressionado
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={'Selecionar ' + nutricionista.nome}
                  accessibilityHint="Abre a escolha da data e do horário"
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
              {sugestoes.length === 0 && (
                <Text style={styles.retorno} aria-live="polite" accessibilityLiveRegion="polite">
                  Nenhum nutricionista encontrado. Tente outro nome.
                </Text>
              )}
              {encontrados.length > LIMITE_SUGESTOES && (
                <Text style={styles.retorno} aria-live="polite" accessibilityLiveRegion="polite">
                  Digite mais do nome para refinar a busca.
                </Text>
              )}
            </ScrollView>
          </View>
        </>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: { flexGrow: 1, gap: spacing.md, position: 'relative' },
  rotulo: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22 },
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
  fundoSugestoes: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1 },
  painel: {
    ...shadows.card,
    position: 'absolute',
    zIndex: 2,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md
  },
  rolagemSugestoes: { maxHeight: 228, borderRadius: radius.md },
  sugestao: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  separador: { borderTopWidth: 1, borderTopColor: colors.border },
  vinculado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.confirmedBackground,
    borderRadius: radius.md,
    padding: spacing.sm
  },
  dados: { flex: 1, minWidth: 0, gap: spacing.xxs },
  nome: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 21 },
  descricao: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
  retorno: {
    color: colors.text,
    backgroundColor: colors.subtle,
    padding: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21
  },
  pressionado: { backgroundColor: colors.brandSoft }
});
