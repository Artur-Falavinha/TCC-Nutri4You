import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { ShoppingList } from '../../features/dieta/dieta.models';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Compras'>;

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível carregar ou salvar sua lista de compras. Tente novamente.';
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
  const [menuNotice, setMenuNotice] = useState('');
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
        setMenuNotice('Este módulo ainda não está disponível nesta etapa.');
    }
  };

  const changePeriod = (difference: number) => changeDays(days + difference);
  const retry = () => void loadList(days);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
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
        contentContainerStyle={[styles.content, { maxWidth: wide ? 760 : 560 }]}
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
        {menuNotice ? (
          <View style={styles.noticeBox} accessibilityRole="alert">
            <Text style={styles.noticeText}>{menuNotice}</Text>
          </View>
        ) : null}
        <View style={styles.heading}>
          <View style={styles.headingText}>
            <Text style={styles.title} accessibilityRole="header">
              Lista de compras
            </Text>
            <Text style={styles.subtitle}>
              Inclui apenas os alimentos principais; substituições opcionais não são somadas.
            </Text>
          </View>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Dieta')}
            accessibilityRole="button"
            accessibilityLabel="Voltar para dieta ativa"
          >
            <Text style={styles.secondaryButtonText}>Dieta</Text>
          </Pressable>
        </View>

        <View style={[styles.periodCard, wide && styles.periodCardWide]}>
          <View style={styles.periodText}>
            <Text style={styles.sectionTitle}>Período</Text>
            <Text style={styles.bodyText}>A lista considera dias consecutivos do plano diário.</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              style={[styles.stepButton, days <= MIN_SHOPPING_DAYS && styles.disabledButton]}
              onPress={() => changePeriod(-1)}
              disabled={days <= MIN_SHOPPING_DAYS || loading || refreshing || savingFoodId !== null}
              accessibilityRole="button"
              accessibilityLabel="Diminuir período em um dia"
              accessibilityState={{ disabled: days <= MIN_SHOPPING_DAYS || loading || refreshing || savingFoodId !== null }}
            >
              <Text style={styles.stepButtonText}>−</Text>
            </Pressable>
            <Text style={styles.daysValue} accessibilityLiveRegion="polite">
              {days} {days === 1 ? 'dia' : 'dias'}
            </Text>
            <Pressable
              style={[styles.stepButton, days >= MAX_SHOPPING_DAYS && styles.disabledButton]}
              onPress={() => changePeriod(1)}
              disabled={days >= MAX_SHOPPING_DAYS || loading || refreshing || savingFoodId !== null}
              accessibilityRole="button"
              accessibilityLabel="Aumentar período em um dia"
              accessibilityState={{ disabled: days >= MAX_SHOPPING_DAYS || loading || refreshing || savingFoodId !== null }}
            >
              <Text style={styles.stepButtonText}>+</Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorTitle}>Não foi possível concluir a atualização</Text>
            <Text style={styles.errorText}>{error}</Text>
            {list === null ? (
              <Pressable
                style={styles.primaryButton}
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
          <View style={styles.stateCard} testID="shopping-list-loading">
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.bodyText}>Carregando lista de compras...</Text>
          </View>
        ) : error && !list ? null : list === null ? (
          <View style={styles.stateCard} testID="shopping-list-empty">
            <Text style={styles.stateTitle}>Nenhuma lista de compras disponível</Text>
            <Text style={styles.bodyText}>
              Uma lista será criada a partir da sua dieta ativa quando houver um plano vigente.
            </Text>
            <Pressable
              style={styles.primaryButton}
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

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{list.planoTitulo}</Text>
              {progress ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressCount} accessibilityLiveRegion="polite">
                      {progress.comprados} de {progress.total}{' '}
                      {progress.total === 1 ? 'item comprado' : 'itens comprados'}
                    </Text>
                    <Text style={styles.progressPercent}>{progress.percentual}%</Text>
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
                <View style={styles.countBox}>
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
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Nenhum alimento neste período</Text>
                <Text style={styles.bodyText}>
                  A dieta ativa não contém alimentos para os {days} {days === 1 ? 'dia' : 'dias'} selecionados.
                </Text>
              </View>
            ) : (
              itemGroups.map((group) => (
                <View key={group.categoria} style={styles.categorySection}>
                  <Text style={styles.categoryHeading} accessibilityRole="header">
                    {group.categoria}
                  </Text>
                  {group.itens.map((item) => {
                    const saving = savingFoodId === item.alimentoId;
                    return (
                      <View key={item.alimentoId} style={styles.itemCard}>
                        <View style={styles.itemDetails}>
                          <Text style={[styles.itemName, item.comprado && styles.itemNameBought]}>
                            {item.nome}
                          </Text>
                          <Text style={styles.quantity}>{formatGrams(item.quantidadeGramas)} g</Text>
                        </View>
                        <Pressable
                          style={[styles.checkButton, item.comprado && styles.checkedButton]}
                          onPress={() => void toggleItem(item.alimentoId, !item.comprado)}
                          disabled={savingFoodId !== null || loading || refreshing}
                          accessibilityRole="checkbox"
                          aria-checked={item.comprado}
                          accessibilityLabel={`${item.comprado ? 'Desmarcar' : 'Marcar'} ${item.nome} como comprado`}
                          accessibilityState={{
                            checked: item.comprado,
                            disabled: savingFoodId !== null || loading || refreshing,
                            busy: saving
                          }}
                        >
                          {saving ? (
                            <ActivityIndicator size="small" color={colors.brand} />
                          ) : (
                            <Text style={[styles.checkText, item.comprado && styles.checkedText]}>
                              {item.comprado ? 'Comprado' : 'Marcar'}
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
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
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  headingText: { flex: 1, gap: spacing.xxs },
  title: { color: colors.text, fontFamily: fontFamily.extrabold, fontSize: 25, lineHeight: 32 },
  subtitle: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  secondaryButton: { borderWidth: 1, borderColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  secondaryButtonText: { color: colors.brand, fontFamily: fontFamily.bold, fontSize: 13 },
  periodCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, ...shadows.card },
  periodCardWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodText: { flex: 1, gap: spacing.xxs },
  sectionTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 16 },
  bodyText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  stepButton: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { opacity: 0.45 },
  stepButtonText: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 28 },
  daysValue: { minWidth: 62, textAlign: 'center', color: colors.text, fontFamily: fontFamily.bold, fontSize: 16 },
  listSection: { gap: spacing.sm },
  summaryCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  summaryTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 16 },
  progressSection: { gap: spacing.xs },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  progressCount: { color: colors.text, fontFamily: fontFamily.semibold, fontSize: 13 },
  progressPercent: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14 },
  progressTrack: { height: 10, backgroundColor: colors.pageAlt, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.pill },
  countsRow: { flexDirection: 'row', gap: spacing.sm },
  countBox: { flex: 1, alignItems: 'center', backgroundColor: colors.pageAlt, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  countNumber: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 20 },
  countLabel: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 11, textAlign: 'center' },
  itemCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, ...shadows.card },
  itemDetails: { flex: 1, gap: 3 },
  itemName: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 21 },
  itemNameBought: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  categorySection: { gap: spacing.xs },
  categoryHeading: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 16, marginTop: spacing.xs },
  quantity: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, marginTop: 2 },
  checkButton: { minWidth: 82, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  checkedButton: { backgroundColor: colors.brandSoft },
  checkText: { color: colors.brand, fontFamily: fontFamily.bold, fontSize: 12 },
  checkedText: { color: colors.brandDeep },
  stateCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  stateTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 17, textAlign: 'center' },
  errorBox: { backgroundColor: '#fff4f2', borderColor: colors.danger, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  noticeBox: { backgroundColor: colors.brandSoft, borderRadius: radius.md, padding: spacing.sm },
  noticeText: { color: colors.brandDeep, fontFamily: fontFamily.semibold, fontSize: 13 },
  errorTitle: { color: colors.dangerText, fontFamily: fontFamily.bold, fontSize: 15 },
  errorText: { color: colors.text, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
  errorHint: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  primaryButton: { backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center' },
  primaryButtonText: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 14 },
  refreshingHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }
});
