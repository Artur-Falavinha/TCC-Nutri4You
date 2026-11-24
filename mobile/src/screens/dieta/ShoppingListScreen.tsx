import { Feather } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/layout/AppHeader';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { ApiError } from '../../core/api/api-response.types';
import { logout } from '../../core/auth/auth.service';
import { formatGrams } from '../../features/dieta/dieta.formatters';
import { getShoppingListProgress, groupShoppingItemsByCategory } from '../../features/dieta/dieta.shopping-list';
import {
  DEFAULT_SHOPPING_DAYS,
  getShoppingList,
  MAX_SHOPPING_DAYS,
  MIN_SHOPPING_DAYS,
  updateShoppingItem
} from '../../features/dieta/dieta.service';
import { ShoppingList, ShoppingListItem } from '../../features/dieta/dieta.models';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Compras'>;

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível carregar ou salvar sua lista de compras. Tente novamente.';
}

interface ItemCompraProps {
  item: ShoppingListItem;
  salvando: boolean;
  desabilitado: boolean;
  alternar: (alimentoId: number, comprado: boolean) => void;
}

function ItemCompra({ item, salvando, desabilitado, alternar }: ItemCompraProps) {
  const quantidade = formatGrams(item.quantidadeGramas);
  const marcar = () => alternar(item.alimentoId, !item.comprado);
  return (
    <Pressable
      style={({ pressed }) => [styles.item, item.comprado && styles.itemBought, pressed && styles.pressed]}
      onPress={marcar}
      onKeyDown={Platform.OS === 'web' ? evento => {
        if (evento.nativeEvent.key !== ' ') return;
        evento.preventDefault();
        if (!desabilitado && !evento.nativeEvent.repeat) marcar();
      } : undefined}
      disabled={desabilitado}
      accessibilityRole="checkbox"
      aria-checked={item.comprado}
      aria-busy={salvando}
      accessibilityLabel={`${item.comprado ? 'Desmarcar' : 'Marcar'} ${item.nome} como comprado, ${quantidade} gramas`}
      accessibilityState={{ checked: item.comprado, disabled: desabilitado, busy: salvando }}
    >
      <View style={[styles.checkbox, item.comprado && styles.checkboxChecked]} aria-hidden>
        {salvando ? (
          <ActivityIndicator size="small" color={item.comprado ? colors.white : colors.brand} />
        ) : item.comprado ? (
          <Feather name="check" size={16} color={colors.white} />
        ) : null}
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, item.comprado && styles.itemNameBought]}>{item.nome}</Text>
          <Text style={styles.quantity}>{quantidade} g</Text>
        </View>
        <Text style={[styles.itemAction, item.comprado && styles.itemActionBought]}>
          {item.comprado ? 'Comprado' : 'Marcar'}
        </Text>
      </View>
    </Pressable>
  );
}

export function ShoppingListScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  const [menuVisible, setMenuVisible] = useState(false);
  const [days, setDays] = useState(DEFAULT_SHOPPING_DAYS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingFoodId, setSavingFoodId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [list, setList] = useState<ShoppingList | null>(null);
  const requestId = useRef(0);
  const itemGroups = list ? groupShoppingItemsByCategory(list.itens) : [];
  const progress = list ? getShoppingListProgress(list.itens) : null;

  const loadList = useCallback(async (requestedDays: number, refresh = false) => {
    const currentRequest = ++requestId.current;
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const response = await getShoppingList(requestedDays);
      if (currentRequest === requestId.current) {
        setList(response);
      }
    } catch (failure) {
      if (currentRequest === requestId.current) {
        setError(errorMessage(failure));
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const currentRequest = ++requestId.current;

    void getShoppingList(days)
      .then((response) => {
        if (active && currentRequest === requestId.current) {
          setList(response);
        }
      })
      .catch((failure: unknown) => {
        if (active && currentRequest === requestId.current) {
          setError(errorMessage(failure));
        }
      })
      .finally(() => {
        if (active && currentRequest === requestId.current) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (currentRequest === requestId.current) {
        requestId.current += 1;
      }
    };
  }, [days]);

  const changeDays = (nextDays: number) => {
    if (
      nextDays < MIN_SHOPPING_DAYS ||
      nextDays > MAX_SHOPPING_DAYS ||
      nextDays === days ||
      savingFoodId !== null
    ) {
      return;
    }
    setLoading(true);
    setError('');
    setList(null);
    setDays(nextDays);
  };

  const toggleItem = async (foodId: number, comprado: boolean) => {
    if (!list || savingFoodId !== null) {
      return;
    }

    const currentRequest = ++requestId.current;
    setSavingFoodId(foodId);
    setError('');
    try {
      const response = await updateShoppingItem(foodId, {
        planoId: list.planoId,
        dias: days,
        comprado
      });
      if (currentRequest === requestId.current) {
        setList(response);
      }
    } catch (failure) {
      if (currentRequest === requestId.current) {
        setError(errorMessage(failure));
      }
    } finally {
      if (currentRequest === requestId.current) {
        setSavingFoodId(null);
      }
    }
  };

  const signOut = async () => {
    await logout();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  const navigateFromMenu = async (destination: MenuDestination) => {
    setMenuVisible(false);
    switch (destination) {
      case 'home':
        navigation.navigate('Dashboard');
        return;
      case 'profile':
        navigation.navigate('DadosPessoais');
        return;
      case 'results':
        navigation.navigate('Evolucao');
        return;
      case 'appointments':
        navigation.navigate('Agenda');
        return;
      case 'diet':
        navigation.navigate('Dieta');
        return;
      case 'shopping':
        return;
      case 'password':
        navigation.navigate('TrocarSenha');
        return;
      case 'logout':
        await signOut();
        return;
      case 'exams':
        navigation.navigate('Exames');
        return;
    }
  };

  const listaOcupada = loading || refreshing || savingFoodId !== null;
  const diminuirDesabilitado = listaOcupada || days <= MIN_SHOPPING_DAYS;
  const aumentarDesabilitado = listaOcupada || days >= MAX_SHOPPING_DAYS;
  const changePeriod = (difference: number) => changeDays(days + difference);
  const retry = () => void loadList(days);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />
      <SideMenu
        visible={menuVisible}
        activeItem="shopping"
        userName="Paciente"
        onClose={() => setMenuVisible(false)}
        onNavigate={(destination) => void navigateFromMenu(destination)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, width < 420 && styles.contentCompact, { maxWidth: wide ? 760 : 560 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (savingFoodId === null) {
                void loadList(days, true);
              }
            }}
            tintColor={colors.brand}
          />
        }
      >
        <View style={styles.heading}>
          <View style={styles.headingTop}>
            <Text style={styles.title} accessibilityRole="header" aria-level={1}>Lista de compras</Text>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={() => navigation.navigate('Dieta')}
              accessibilityRole="button"
              accessibilityLabel="Voltar para dieta ativa"
            >
              <Feather name="arrow-left" size={16} color={colors.brandDeep} aria-hidden />
              <Text style={styles.secondaryButtonText}>Dieta</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Inclui apenas os alimentos principais; substituições opcionais não são somadas.
          </Text>
        </View>

        <View style={[styles.surface, styles.periodCard, wide && styles.periodCardWide]}>
          <View style={styles.periodIntro}>
            <View style={styles.sectionIcon} aria-hidden>
              <Feather name="calendar" size={18} color={colors.brand} />
            </View>
            <View style={styles.periodText}>
              <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>Período</Text>
              <Text style={styles.bodyText}>A lista considera dias consecutivos do plano diário.</Text>
            </View>
          </View>
          <View style={styles.stepper}>
            <Pressable
              style={({ pressed }) => [styles.stepButton, diminuirDesabilitado && styles.disabledButton, pressed && styles.pressed]}
              onPress={() => changePeriod(-1)}
              disabled={diminuirDesabilitado}
              accessibilityRole="button"
              accessibilityLabel="Diminuir período em um dia"
              accessibilityState={{ disabled: diminuirDesabilitado }}
            >
              <Feather name="minus" size={22} color={colors.brandDeep} aria-hidden />
            </Pressable>
            <Text style={styles.daysValue} aria-live="polite" accessibilityLiveRegion="polite">
              {days} {days === 1 ? 'dia' : 'dias'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.stepButton, aumentarDesabilitado && styles.disabledButton, pressed && styles.pressed]}
              onPress={() => changePeriod(1)}
              disabled={aumentarDesabilitado}
              accessibilityRole="button"
              accessibilityLabel="Aumentar período em um dia"
              accessibilityState={{ disabled: aumentarDesabilitado }}
            >
              <Feather name="plus" size={22} color={colors.brandDeep} aria-hidden />
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorTitle}>Não foi possível concluir a atualização</Text>
            <Text style={styles.errorText}>{error}</Text>
            {list === null ? (
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={retry}
                accessibilityRole="button"
                accessibilityLabel="Tentar carregar a lista novamente"
              >
                <Text style={styles.primaryButtonText}>Tentar novamente</Text>
              </Pressable>
            ) : (
              <Text style={styles.errorHint}>Sua marcação permanece como estava. Toque no item para tentar salvar novamente.</Text>
            )}
          </View>
        ) : null}

        {loading && !list ? (
          <View style={[styles.surface, styles.stateCard]} testID="shopping-list-loading" aria-live="polite">
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.bodyText}>Carregando lista de compras...</Text>
          </View>
        ) : error && !list ? null : list === null ? (
          <View style={[styles.surface, styles.stateCard]} testID="shopping-list-empty">
            <View style={styles.sectionIcon} aria-hidden><Feather name="shopping-bag" size={20} color={colors.brand} /></View>
            <Text style={styles.stateTitle} accessibilityRole="header" aria-level={2}>Nenhuma lista de compras disponível</Text>
            <Text style={[styles.bodyText, styles.centered]}>
              Uma lista será criada a partir da sua dieta ativa quando houver um plano vigente.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => navigation.navigate('Dieta')}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Ver dieta ativa</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listSection}>
            {loading || refreshing ? (
              <View style={styles.refreshingHint}>
                <ActivityIndicator size="small" color={colors.brand} />
                <Text style={styles.bodyText}>Atualizando...</Text>
              </View>
            ) : null}

            <View style={styles.surface}>
              <View style={styles.summaryHeader}>
                <View style={styles.sectionIcon} aria-hidden><Feather name="shopping-bag" size={18} color={colors.brand} /></View>
                <Text style={styles.summaryTitle} accessibilityRole="header" aria-level={2}>{list.planoTitulo}</Text>
              </View>
              {progress ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressCount} aria-live="polite" accessibilityLiveRegion="polite">
                      {progress.comprados} de {progress.total}{' '}
                      {progress.total === 1 ? 'item comprado' : 'itens comprados'}
                    </Text>
                    <Text style={styles.progressPercent} aria-hidden>{progress.percentual}%</Text>
                  </View>
                  <View
                    style={styles.progressTrack}
                    accessibilityRole="progressbar"
                    accessibilityLabel="Progresso das compras"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress.percentual}
                    aria-valuetext={`${progress.comprados} de ${progress.total} itens comprados, ${progress.percentual}%`}
                    accessibilityValue={{
                      min: 0,
                      max: 100,
                      now: progress.percentual,
                      text: `${progress.comprados} de ${progress.total} itens comprados, ${progress.percentual}%`
                    }}
                  >
                    <View style={[styles.progressFill, { width: `${progress.percentual}%` }]} />
                  </View>
                </View>
              ) : null}
              <View style={styles.countsRow}>
                <View style={styles.countBox}>
                  <Text style={styles.countNumber}>{list.itensPendentes}</Text>
                  <Text style={styles.countLabel}>pendentes</Text>
                </View>
                <View style={[styles.countBox, styles.countBoxBought]}>
                  <Text style={styles.countNumber}>{list.itensComprados}</Text>
                  <Text style={styles.countLabel}>comprados</Text>
                </View>
                <View style={styles.countBox}>
                  <Text style={styles.countNumber}>{list.totalItens}</Text>
                  <Text style={styles.countLabel}>itens</Text>
                </View>
              </View>
            </View>

            {list.itens.length === 0 ? (
              <View style={[styles.surface, styles.stateCard]}>
                <View style={styles.sectionIcon} aria-hidden><Feather name="shopping-bag" size={20} color={colors.brand} /></View>
                <Text style={styles.stateTitle} accessibilityRole="header" aria-level={2}>Nenhum alimento neste período</Text>
                <Text style={[styles.bodyText, styles.centered]}>
                  A dieta ativa não contém alimentos para os {days} {days === 1 ? 'dia' : 'dias'} selecionados.
                </Text>
              </View>
            ) : (
              itemGroups.map((group) => (
                <View key={group.categoria} style={[styles.surface, styles.categorySection]}>
                  <View style={styles.categoryHeader}>
                    <Feather name="tag" size={17} color={colors.brand} aria-hidden />
                    <Text style={styles.categoryHeading} accessibilityRole="header" aria-level={2}>{group.categoria}</Text>
                  </View>
                  <View style={styles.categoryItems}>
                    {group.itens.map((item) => (
                      <ItemCompra
                        key={item.alimentoId}
                        item={item}
                        salvando={savingFoodId === item.alimentoId}
                        desabilitado={listaOcupada}
                        alternar={toggleItem}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  contentCompact: { paddingHorizontal: spacing.sm },
  heading: { paddingTop: spacing.xs, gap: spacing.xxs },
  headingTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  title: {
    flexGrow: 1, flexShrink: 1, flexBasis: 175,
    color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 30, lineHeight: 38
  },
  subtitle: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 23 },
  secondaryButton: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxs,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.confirmedBackground, borderRadius: radius.md
  },
  secondaryButtonText: { flexShrink: 1, color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20 },
  surface: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm, ...shadows.card
  },
  periodCard: { gap: spacing.sm },
  periodCardWide: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  periodIntro: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, flexGrow: 1, flexShrink: 1 },
  periodText: { flex: 1, minWidth: 0, gap: spacing.xxs },
  sectionIcon: {
    width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.confirmedBackground,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  sectionTitle: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 25 },
  bodyText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 23 },
  centered: { textAlign: 'center' },
  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs,
    backgroundColor: colors.page, borderRadius: radius.lg, padding: spacing.xxs
  },
  stepButton: {
    width: 48, minHeight: 48, flexShrink: 0, borderRadius: radius.md, backgroundColor: colors.confirmedBackground,
    alignItems: 'center', justifyContent: 'center'
  },
  disabledButton: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  daysValue: {
    minWidth: 76, flexShrink: 1, textAlign: 'center', color: colors.brandDeep,
    fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 25, fontVariant: ['tabular-nums']
  },
  listSection: { gap: spacing.md },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryTitle: { flex: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 20, lineHeight: 27 },
  progressSection: { gap: spacing.xs },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  progressCount: { flexShrink: 1, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  progressPercent: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 16, lineHeight: 23, fontVariant: ['tabular-nums'] },
  progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.pill },
  countsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  countBox: {
    flexBasis: 76, flexGrow: 1, alignItems: 'center', backgroundColor: colors.page, borderRadius: radius.md,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.xxs
  },
  countBoxBought: { backgroundColor: colors.confirmedBackground },
  countNumber: {
    color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 20, lineHeight: 27, fontVariant: ['tabular-nums']
  },
  countLabel: { color: colors.text, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  categorySection: { padding: spacing.sm, gap: spacing.xs },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xxs, paddingVertical: spacing.xxs },
  categoryHeading: { flex: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 25 },
  categoryItems: { gap: spacing.xs },
  item: {
    minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border
  },
  itemBought: { backgroundColor: colors.page },
  checkbox: {
    width: 24, height: 24, flexShrink: 0, borderRadius: 6, borderWidth: 1,
    borderColor: colors.textSecondary, alignItems: 'center', justifyContent: 'center'
  },
  checkboxChecked: { backgroundColor: colors.brand, borderColor: colors.brand },
  itemContent: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  itemDetails: { flexBasis: 120, flexGrow: 1, flexShrink: 1, gap: spacing.xxs },
  itemName: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 21 },
  itemNameBought: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  quantity: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20, fontVariant: ['tabular-nums'] },
  itemAction: { color: colors.brandDeep, fontFamily: fontFamily.bold, flexShrink: 1, fontSize: 13, lineHeight: 19 },
  itemActionBought: {
    backgroundColor: colors.confirmedBackground, borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs
  },
  stateCard: { padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
  stateTitle: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 25, textAlign: 'center' },
  errorBox: {
    backgroundColor: colors.dangerButtonBackground, borderColor: colors.dangerBackground,
    borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs
  },
  errorTitle: { color: colors.dangerText, fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 22 },
  errorText: { color: colors.dangerText, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  errorHint: { color: colors.text, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 20 },
  primaryButton: {
    minHeight: 48, backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, alignItems: 'center', justifyContent: 'center'
  },
  primaryButtonText: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  refreshingHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }
});
