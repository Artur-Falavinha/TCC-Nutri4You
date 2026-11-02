import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppHeader } from '../../components/layout/AppHeader';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { ApiError } from '../../core/api/api-response.types';
import { logout } from '../../core/auth/auth.service';
import {
  formatDate,
  formatFoodSource,
  formatGrams,
  formatNutrient,
  formatNutrientAmount,
  formatTime,
  nutrientEntries
} from '../../features/dieta/dieta.formatters';
import { Meal, MealPlan } from '../../features/dieta/dieta.models';
import { getActiveMealPlan } from '../../features/dieta/dieta.service';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';
import { NutrientSummaryCard } from './components/NutrientSummaryCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Dieta'>;

interface DayPillItem {
  key: string;
  shortLabel: string;
  dayNumber: string;
  aliases: string[];
}

const WEEK_DAYS: DayPillItem[] = [
  { key: 'DOM', shortLabel: 'DOM', dayNumber: '12', aliases: ['DOM', 'DOMINGO'] },
  { key: 'SEG', shortLabel: 'SEG', dayNumber: '13', aliases: ['SEG', 'SEGUNDA', 'SEGUNDA-FEIRA'] },
  { key: 'TER', shortLabel: 'TER', dayNumber: '14', aliases: ['TER', 'TERCA', 'TERÇA', 'TERCA-FEIRA'] },
  { key: 'QUA', shortLabel: 'QUA', dayNumber: '15', aliases: ['QUA', 'QUARTA', 'QUARTA-FEIRA'] },
  { key: 'QUI', shortLabel: 'QUI', dayNumber: '16', aliases: ['QUI', 'QUINTA', 'QUINTA-FEIRA'] },
  { key: 'SEX', shortLabel: 'SEX', dayNumber: '17', aliases: ['SEX', 'SEXTA', 'SEXTA-FEIRA'] },
  { key: 'SAB', shortLabel: 'SÁB', dayNumber: '18', aliases: ['SAB', 'SÁB', 'SABADO', 'SÁBADO'] }
];

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível carregar sua dieta. Tente novamente.';
}

function MealCategoryIcon({ mealName }: { mealName: string }) {
  const normalized = mealName.toLowerCase();
  if (normalized.includes('café') || normalized.includes('cafe') || normalized.includes('manhã')) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17 8h1a4 4 0 110 8h-1M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 2v3M10 2v3M14 2v3"
          stroke={colors.brand}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (normalized.includes('almoço') || normalized.includes('almoco') || normalized.includes('jantar')) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 3v7a4 4 0 004 4v7M8 3v7M12 3v7M19 3v18M19 3a4 4 0 00-4 4v6h4"
          stroke={colors.brand}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm0 4v5l3 3"
        stroke={colors.brand}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface SwapOption {
  id: string;
  title: string;
  subtitle: string;
}

function buildMealSwapOptions(meal: Meal): SwapOption[] {
  const defaultTitle =
    meal.itens.map((item) => item.alimento.nome).join(', ') || meal.nome;
  const options: SwapOption[] = [
    {
      id: `prescribed-${meal.id}`,
      title: defaultTitle,
      subtitle: `${Math.round(meal.totais.kcal)} kcal • Prescrito`
    }
  ];

  meal.itens.forEach((item) => {
    item.substitutos?.forEach((sub, idx) => {
      options.push({
        id: `sub-${meal.id}-${item.alimento.id}-${sub.alimento.id}-${idx}`,
        title: `${sub.alimento.nome} (${formatGrams(sub.quantidadeGramas)} g)`,
        subtitle: `${Math.round(sub.nutrientes.kcal)} kcal • Substituto de ${item.alimento.nome}`
      });
    });
  });

  return options;
}

export function MealPlanScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('SEG');
  const [swapModalMeal, setSwapModalMeal] = useState<Meal | null>(null);
  const [swapSearch, setSwapSearch] = useState('');
  const [selectedOptionByMeal, setSelectedOptionByMeal] = useState<Record<number, string>>({});
  const [pendingSwapOptionId, setPendingSwapOptionId] = useState<string>('');
  const [waterLiters, setWaterLiters] = useState(1.4);
  const waterGoalLiters = 2.5;
  const requestId = useRef(0);

  const loadPlan = useCallback(async (refresh = false) => {
    const currentRequest = ++requestId.current;
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const response = await getActiveMealPlan();
      if (currentRequest === requestId.current) {
        setPlan(response);
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

    void getActiveMealPlan()
      .then((response) => {
        if (active && currentRequest === requestId.current) {
          setPlan(response);
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
  }, []);

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
        return;
      case 'shopping':
        navigation.navigate('Compras');
        return;
      case 'exams':
        navigation.navigate('Exames');
        return;
      case 'password':
        navigation.navigate('TrocarSenha');
        return;
      case 'logout':
        await signOut();
        return;
    }
  };

  const openShoppingList = () => navigation.navigate('Compras');

  const visibleMeals = useMemo(() => {
    if (!plan) {
      return [];
    }
    const hasDaySegmentation = plan.refeicoes.some(
      (meal) => typeof meal.diaSemana === 'string' && meal.diaSemana.trim().length > 0
    );
    if (!hasDaySegmentation) {
      return plan.refeicoes;
    }
    const activeDayConfig = WEEK_DAYS.find((d) => d.key === selectedDay);
    const aliases = activeDayConfig?.aliases ?? [selectedDay];
    return plan.refeicoes.filter((meal) => {
      if (!meal.diaSemana) {
        return true;
      }
      const upper = meal.diaSemana.trim().toUpperCase();
      return aliases.includes(upper);
    });
  }, [plan, selectedDay]);

  const openSwapModal = (meal: Meal) => {
    const options = buildMealSwapOptions(meal);
    const currentSelected = selectedOptionByMeal[meal.id] ?? options[0]?.id ?? '';
    setPendingSwapOptionId(currentSelected);
    setSwapSearch('');
    setSwapModalMeal(meal);
  };

  const confirmSwapSelection = () => {
    if (swapModalMeal && pendingSwapOptionId) {
      setSelectedOptionByMeal((prev) => ({
        ...prev,
        [swapModalMeal.id]: pendingSwapOptionId
      }));
    }
    setSwapModalMeal(null);
  };

  const swapOptions = useMemo(() => {
    if (!swapModalMeal) {
      return [];
    }
    const all = buildMealSwapOptions(swapModalMeal);
    const query = swapSearch.trim().toLowerCase();
    if (!query) {
      return all;
    }
    return all.filter(
      (opt) =>
        opt.title.toLowerCase().includes(query) ||
        opt.subtitle.toLowerCase().includes(query)
    );
  }, [swapModalMeal, swapSearch]);

  const waterProgressRatio = Math.min(waterLiters / waterGoalLiters, 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />
      <SideMenu
        visible={menuVisible}
        activeItem="diet"
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
            onRefresh={() => void loadPlan(true)}
            tintColor={colors.brand}
          />
        }
      >
        <View style={styles.pageHeading}>
          <View style={styles.headingText}>
            <Text style={styles.title} accessibilityRole="header">
              Dieta ativa
            </Text>
            <Text style={styles.subtitle}>Seu plano alimentar vigente e as refeições do dia.</Text>
          </View>
          <Pressable
            style={styles.secondaryButton}
            onPress={openShoppingList}
            accessibilityRole="button"
            accessibilityLabel="Abrir lista de compras"
          >
            <Text style={styles.secondaryButtonText}>Lista de compras</Text>
          </Pressable>
        </View>

        <View style={styles.daySelectorSection} testID="meal-plan-day-selector">
          <View style={styles.daySelectorHeader}>
            <Text style={styles.daySelectorMonthTitle}>Maio 2026</Text>
            <Svg width={18} height={20} viewBox="0 0 18 20" fill="none">
              <Path
                d="M15 2h-1V0h-2v2H6V0H4v2H3C1.89 2 1 2.9 1 4v14a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm0 16H3V7h12v11z"
                fill={colors.brand}
              />
            </Svg>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayPillsRow}
          >
            {WEEK_DAYS.map((day) => {
              const isSelected = day.key === selectedDay;
              return (
                <Pressable
                  key={day.key}
                  style={[styles.dayPill, isSelected && styles.dayPillActive]}
                  onPress={() => setSelectedDay(day.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Dia ${day.shortLabel} ${day.dayNumber}`}
                  testID={`day-selector-pill-${day.key}`}
                >
                  <Text style={[styles.dayPillLabel, isSelected && styles.dayPillLabelActive]}>
                    {day.shortLabel}
                  </Text>
                  <Text style={[styles.dayPillNumber, isSelected && styles.dayPillNumberActive]}>
                    {day.dayNumber}
                  </Text>
                  {isSelected ? <View style={styles.dayPillDot} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorTitle}>Não foi possível atualizar a dieta</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => void loadPlan()}
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar a dieta novamente"
            >
              <Text style={styles.primaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !plan ? (
          <View style={styles.stateCard} testID="meal-plan-loading">
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.bodyText}>Carregando sua dieta...</Text>
          </View>
        ) : error && !plan ? null : !plan ? (
          <View style={styles.stateCard} testID="meal-plan-empty">
            <Text style={styles.stateTitle}>Nenhuma dieta ativa</Text>
            <Text style={styles.bodyText}>
              Um plano publicado e dentro da vigência aparecerá aqui.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={openShoppingList}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Ver lista de compras</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.sections}>
            {loading ? (
              <View style={styles.refreshingHint}>
                <ActivityIndicator size="small" color={colors.brand} />
                <Text style={styles.bodyText}>Atualizando...</Text>
              </View>
            ) : null}

            <View style={styles.planCard}>
              <View style={[styles.planHeader, wide && styles.planHeaderWide]}>
                <View style={styles.planText}>
                  <Text style={styles.planTitle} accessibilityRole="header">
                    {plan.titulo}
                  </Text>
                  <Text style={styles.planNutritionist}>Prescrito por {plan.nutricionistaNome}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Ativo</Text>
                </View>
              </View>
              <Text style={styles.validityText}>
                Vigência: {formatDate(plan.vigenciaInicio)} a {formatDate(plan.vigenciaFim)}
              </Text>
              {plan.orientacoes?.trim() ? (
                <View style={styles.guidance}>
                  <Text style={styles.sectionTitle}>Orientações</Text>
                  <Text style={styles.bodyText}>{plan.orientacoes}</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.summaryGrid, wide && styles.summaryGridWide]}>
              {plan.metas ? (
                <View style={styles.summaryColumn}>
                  <NutrientSummaryCard
                    title="Metas diárias"
                    subtitle="Metas nutricionais de referência diária"
                    nutrients={plan.metas}
                  />
                </View>
              ) : (
                <View style={[styles.summaryColumn, styles.missingGoal]}>
                  <Text style={styles.sectionTitle}>Metas diárias</Text>
                  <Text style={styles.bodyText}>A nutricionista não informou metas para este plano.</Text>
                </View>
              )}
              <View style={styles.summaryColumn}>
                <NutrientSummaryCard
                  title="Totais diários"
                  subtitle="Progresso diário em relação às metas prescritas"
                  nutrients={plan.totais}
                  goals={plan.metas}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Refeições do dia
              </Text>
              {visibleMeals.length === 0 ? (
                <View style={styles.stateCard}>
                  <Text style={styles.bodyText}>Este plano ainda não contém refeições.</Text>
                </View>
              ) : (
                <View style={styles.mealCardsList}>
                  {visibleMeals.map((meal) => {
                    const swapOpts = buildMealSwapOptions(meal);
                    const chosenId = selectedOptionByMeal[meal.id];
                    const chosenOption = swapOpts.find((o) => o.id === chosenId);
                    const mealSummaryHeadline =
                      chosenOption?.title ??
                      (meal.itens.map((i) => i.alimento.nome).join(', ') || meal.nome);

                    return (
                      <View
                        key={meal.id}
                        style={styles.mealCard}
                        testID={`meal-card-${meal.id}`}
                      >
                        <View style={styles.mealCardTopRow}>
                          <View style={styles.mealIconBox}>
                            <MealCategoryIcon mealName={meal.nome} />
                          </View>

                          <View style={styles.mealCardHeaderCenter}>
                            <View style={styles.mealCategoryRow}>
                              <Text style={styles.mealTitle} accessibilityRole="header">
                                {meal.nome}
                              </Text>
                              <Text style={styles.mealTime}>{formatTime(meal.horario)}</Text>
                            </View>
                            <Text style={styles.mealHeadline} numberOfLines={2}>
                              {mealSummaryHeadline}
                            </Text>
                            <View style={styles.mealMacroBadgesRow}>
                              <View style={styles.mealMacroBadge}>
                                <Text style={styles.mealMacroBadgeText}>
                                  {Math.round(meal.totais.kcal)} KCAL
                                </Text>
                              </View>
                              <View style={styles.mealMacroBadge}>
                                <Text style={styles.mealMacroBadgeText}>
                                  {Math.round(meal.totais.proteinas)}G PROTEÍNA
                                </Text>
                              </View>
                            </View>
                          </View>

                          <Pressable
                            style={styles.mealActionBtn}
                            onPress={() => openSwapModal(meal)}
                            accessibilityRole="button"
                            accessibilityLabel={`Opções da refeição ${meal.nome}`}
                            testID={`meal-swap-button-${meal.id}`}
                          >
                            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                stroke={colors.brandDeep}
                                strokeWidth={2.2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </Pressable>
                        </View>

                        <View style={styles.mealItemsDivider} />

                        {meal.itens.map((item) => (
                          <View key={item.alimento.id} style={styles.foodItem}>
                            <View style={styles.foodRow}>
                              <View style={styles.foodDetails}>
                                <Text style={styles.foodName}>{item.alimento.nome}</Text>
                                <Text style={styles.foodMeta}>
                                  {formatNutrient(item.nutrientes.kcal)} kcal · Fibras{' '}
                                  {formatNutrientAmount(item.nutrientes.fibras)}
                                </Text>
                                <Text style={styles.foodSource}>
                                  {formatFoodSource(item.alimento.fonte, item.alimento.versaoFonte)}
                                  {item.alimento.codigoTaco != null
                                    ? ` · Código TACO ${item.alimento.codigoTaco}`
                                    : ''}
                                </Text>
                                {item.alimento.observacaoFonte ? (
                                  <Text style={styles.foodSource}>
                                    Observação: {item.alimento.observacaoFonte}
                                  </Text>
                                ) : null}
                              </View>
                              <Text
                                style={styles.foodQuantity}
                                accessibilityLabel={`${formatGrams(item.quantidadeGramas)} gramas`}
                              >
                                {formatGrams(item.quantidadeGramas)} g
                              </Text>
                            </View>
                            {item.substitutos?.length ? (
                              <View style={styles.substitutions}>
                                {item.substitutos.map((substitute, index) => (
                                  <View
                                    key={`${substitute.alimento.id}-${index}`}
                                    style={styles.substituteCard}
                                  >
                                    <Text style={styles.substituteLabel}>Substituto informativo</Text>
                                    <View style={styles.substituteFoodRow}>
                                      <Text style={styles.substituteFoodName}>
                                        {substitute.alimento.nome}
                                      </Text>
                                      <Text style={styles.foodQuantity}>
                                        {formatGrams(substitute.quantidadeGramas)} g
                                      </Text>
                                    </View>
                                    <Text style={styles.substituteNutrition}>
                                      {nutrientEntries(substitute.nutrientes)
                                        .map((entry) => `${entry.label}: ${entry.value}`)
                                        .join(' · ')}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : null}
                          </View>
                        ))}
                        <View style={styles.mealTotals}>
                          <Text style={styles.mealTotalsTitle}>Total da refeição</Text>
                          <Text style={styles.mealTotalsText}>
                            {formatNutrient(meal.totais.kcal)} kcal · {formatNutrient(meal.totais.proteinas)} g proteínas ·{' '}
                            {formatNutrient(meal.totais.carboidratos)} g carboidratos · {formatNutrient(meal.totais.gorduras)} g gorduras ·{' '}
                            Fibras {formatNutrientAmount(meal.totais.fibras)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.hydrationCard} testID="hydration-tracker-card">
              <View style={styles.hydrationTopRow}>
                <View style={styles.hydrationIconCircle}>
                  <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
                    <Path
                      d="M8 0C8 0 0 8.5 0 13.5C0 17.09 3.58 20 8 20C12.42 20 16 17.09 16 13.5C16 8.5 8 0 8 0Z"
                      fill="#5df975"
                    />
                  </Svg>
                </View>
                <View style={styles.hydrationHeaderCopy}>
                  <Text style={styles.hydrationTitle}>Hidratação</Text>
                  <Text style={styles.hydrationSubtitle}>
                    {waterLiters.toFixed(1)}L de {waterGoalLiters.toFixed(1)}L atingidos
                  </Text>
                </View>
              </View>
              <View style={styles.hydrationProgressTrack}>
                <View
                  style={[
                    styles.hydrationProgressFill,
                    { width: `${Math.round(waterProgressRatio * 100)}%` }
                  ]}
                />
              </View>
              <Pressable
                style={styles.hydrationButton}
                onPress={() =>
                  setWaterLiters((prev) => Number(Math.min(prev + 0.25, 5).toFixed(2)))
                }
                accessibilityRole="button"
                accessibilityLabel="Adicionar Água"
                testID="hydration-add-button"
              >
                <Text style={styles.hydrationButtonText}>+ Adicionar Água</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={swapModalMeal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSwapModalMeal(null)}
      >
        <View style={styles.modalBackdrop} testID="meal-swap-modal">
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trocar Refeição</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setSwapModalMeal(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar modal de troca de refeição"
                testID="meal-swap-close-button"
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalSearchWrap}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar outra opção..."
                placeholderTextColor="rgba(111,122,108,0.6)"
                value={swapSearch}
                onChangeText={setSwapSearch}
                testID="meal-swap-search-input"
              />
            </View>

            <View style={styles.modalOptionsList}>
              {swapOptions.map((option) => {
                const isSelected = option.id === pendingSwapOptionId;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.modalOptionCard, isSelected && styles.modalOptionCardSelected]}
                    onPress={() => setPendingSwapOptionId(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    testID={`meal-swap-option-${option.id}`}
                  >
                    <View style={styles.modalOptionTextWrap}>
                      <Text
                        style={[
                          styles.modalOptionTitle,
                          isSelected && styles.modalOptionTitleSelected
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text style={styles.modalOptionSubtitle}>{option.subtitle}</Text>
                    </View>
                    <View style={styles.modalOptionCheckWrap}>
                      {isSelected ? (
                        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                          <Circle cx={10} cy={10} r={10} fill="#005414" />
                          <Path
                            d="M6 10.2l2.6 2.6L14 7.4"
                            stroke="#ffffff"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      ) : (
                        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                          <Circle
                            cx={10}
                            cy={10}
                            r={9}
                            stroke="#bfc9bb"
                            strokeWidth={1.8}
                          />
                        </Svg>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalPrimaryButton}
                onPress={confirmSwapSelection}
                accessibilityRole="button"
                testID="meal-swap-confirm-button"
              >
                <Text style={styles.modalPrimaryButtonText}>Confirmar Troca</Text>
              </Pressable>
              <Pressable
                style={styles.modalSecondaryButton}
                onPress={() => setSwapModalMeal(null)}
                accessibilityRole="button"
                testID="meal-swap-cancel-button"
              >
                <Text style={styles.modalSecondaryButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  headingText: { flex: 1, gap: spacing.xxs },
  title: { color: colors.text, fontFamily: fontFamily.extrabold, fontSize: 25, lineHeight: 32 },
  subtitle: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  secondaryButton: { borderWidth: 1, borderColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  secondaryButtonText: { color: colors.brand, fontFamily: fontFamily.bold, fontSize: 13 },
  daySelectorSection: { gap: spacing.sm },
  daySelectorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  daySelectorMonthTitle: { color: '#1a1c1c', fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  dayPillsRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  dayPill: {
    width: 56,
    height: 75,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...shadows.card
  },
  dayPillActive: {
    width: 64,
    backgroundColor: '#005414'
  },
  dayPillLabel: {
    color: '#6f7a6c',
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 15,
    textTransform: 'uppercase'
  },
  dayPillLabelActive: {
    color: 'rgba(255,255,255,0.75)'
  },
  dayPillNumber: {
    color: '#1a1c1c',
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 26
  },
  dayPillNumberActive: {
    color: colors.white,
    fontFamily: fontFamily.extrabold,
    fontSize: 20,
    lineHeight: 28
  },
  dayPillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
    marginTop: 2
  },
  sections: { gap: spacing.md },
  planCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, ...shadows.card },
  planHeader: { flexDirection: 'column', alignItems: 'flex-start', gap: spacing.sm },
  planHeaderWide: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planText: { flex: 1, gap: spacing.xxs },
  planTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 27 },
  planNutritionist: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13 },
  statusBadge: { backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
  statusText: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 12 },
  validityText: { color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 13 },
  guidance: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: spacing.xs },
  summaryGrid: { gap: spacing.md },
  summaryGridWide: { flexDirection: 'row' },
  summaryColumn: { flex: 1, minWidth: 220 },
  missingGoal: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 17 },
  mealCardsList: { gap: 20 },
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: spacing.sm,
    ...shadows.card
  },
  mealCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16
  },
  mealIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mealCardHeaderCenter: {
    flex: 1,
    gap: 4
  },
  mealCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs
  },
  mealTitle: {
    color: '#006f1e',
    fontFamily: fontFamily.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  mealTime: {
    color: '#6f7a6c',
    fontFamily: fontFamily.regular,
    fontSize: 12
  },
  mealHeadline: {
    color: '#1a1c1c',
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 20
  },
  mealMacroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4
  },
  mealMacroBadge: {
    backgroundColor: '#f3f3f3',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  mealMacroBadgeText: {
    color: '#6f7a6c',
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 15
  },
  mealActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mealItemsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2
  },
  foodItem: { gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.xs },
  foodRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  foodDetails: { flex: 1, gap: 3 },
  foodName: { color: colors.text, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  foodMeta: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13 },
  foodSource: { color: colors.textSubtle, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16 },
  foodQuantity: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 13 },
  substitutions: { gap: spacing.xs, marginLeft: spacing.sm },
  substituteCard: { backgroundColor: colors.pageAlt, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  substituteLabel: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 12 },
  substituteFoodRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  substituteFoodName: { flex: 1, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 19 },
  substituteNutrition: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16 },
  mealTotals: { backgroundColor: colors.pageAlt, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xxs },
  mealTotalsTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 12 },
  mealTotalsText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  hydrationCard: {
    backgroundColor: '#064e3b',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    ...shadows.card
  },
  hydrationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  hydrationIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  hydrationHeaderCopy: {
    flex: 1,
    gap: 2
  },
  hydrationTitle: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22
  },
  hydrationSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16
  },
  hydrationProgressTrack: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.pill,
    overflow: 'hidden'
  },
  hydrationProgressFill: {
    height: '100%',
    backgroundColor: '#5df975',
    borderRadius: radius.pill
  },
  hydrationButton: {
    backgroundColor: '#006f1e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hydrationButtonText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 14
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  modalCard: {
    width: '100%',
    maxWidth: 342,
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.card
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16
  },
  modalTitle: {
    color: '#064e3b',
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCloseText: {
    color: '#6f7a6c',
    fontFamily: fontFamily.bold,
    fontSize: 16
  },
  modalSearchWrap: {
    paddingHorizontal: 24
  },
  modalSearchInput: {
    backgroundColor: '#e8e8e8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1a1c1c',
    fontFamily: fontFamily.regular,
    fontSize: 14
  },
  modalOptionsList: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 8
  },
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
    backgroundColor: colors.white
  },
  modalOptionCardSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5'
  },
  modalOptionTextWrap: {
    flex: 1,
    gap: 2
  },
  modalOptionTitle: {
    color: '#1a1c1c',
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 20
  },
  modalOptionTitleSelected: {
    color: '#064e3b'
  },
  modalOptionSubtitle: {
    color: '#6f7a6c',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16
  },
  modalOptionCheckWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalActions: {
    padding: 24,
    gap: 12
  },
  modalPrimaryButton: {
    backgroundColor: '#005414',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalPrimaryButtonText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    letterSpacing: -0.4
  },
  modalSecondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalSecondaryButtonText: {
    color: '#6f7a6c',
    fontFamily: fontFamily.semibold,
    fontSize: 14
  },
  stateCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  stateTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 17, textAlign: 'center' },
  bodyText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  errorBox: { backgroundColor: '#fff4f2', borderColor: colors.danger, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  noticeBox: { backgroundColor: colors.brandSoft, borderRadius: radius.md, padding: spacing.sm },
  noticeText: { color: colors.brandDeep, fontFamily: fontFamily.semibold, fontSize: 13 },
  errorTitle: { color: colors.dangerText, fontFamily: fontFamily.bold, fontSize: 15 },
  errorText: { color: colors.text, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
  primaryButton: { backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center' },
  primaryButtonText: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 14 },
  refreshingHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }
});
