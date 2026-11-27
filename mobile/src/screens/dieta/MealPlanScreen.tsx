import { toast } from '../../components/feedback/toast';
import { Feather } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
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
import Svg, { Path } from 'react-native-svg';

import { AppHeader } from '../../components/layout/AppHeader';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { ApiError } from '../../core/api/api-response.types';
import { logout } from '../../core/auth/auth.service';
import { useAtualizacaoDieta, useCargaVigente } from '../../features/dieta/dieta.atualizacao';
import { dataIsoDaClinica, formatDateFromDate } from '../../core/utils/date-mask.util';
import {
  formatDate,
  formatFoodSource,
  formatGrams,
  formatNutrient,
  formatNutrientAmount,
  formatTime,
  nutrientEntries
} from '../../features/dieta/dieta.formatters';
import { HydrationProgress, Meal, MealPlan, Nutrients } from '../../features/dieta/dieta.models';
import { addWater, getActiveMealPlan, getHydrationProgress } from '../../features/dieta/dieta.service';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';
import { NutrientSummaryCard } from './components/NutrientSummaryCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Dieta'>;

const DAYS = [
  { key: 'DOM', label: 'DOM' },
  { key: 'SEG', label: 'SEG' },
  { key: 'TER', label: 'TER' },
  { key: 'QUA', label: 'QUA' },
  { key: 'QUI', label: 'QUI' },
  { key: 'SEX', label: 'SEX' },
  { key: 'SAB', label: 'SÁB' }
];

function semanaAtual(hoje: Date) {
  return DAYS.map((dia, indice) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + indice);
    return { ...dia, data };
  });
}

function totaisRefeicoes(refeicoes: Meal[]): Nutrients {
  return refeicoes.reduce<Nutrients>((total, { totais }) => ({
    kcal: total.kcal + totais.kcal,
    proteinas: total.proteinas + totais.proteinas,
    carboidratos: total.carboidratos + totais.carboidratos,
    gorduras: total.gorduras + totais.gorduras,
    fibras: total.fibras == null || totais.fibras == null ? null : total.fibras + totais.fibras
  }), { kcal: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0 });
}

function carregarDieta() {
  return Promise.allSettled([getActiveMealPlan(), getHydrationProgress()]);
}

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

interface SubstitutoInformativo {
  id: string;
  title: string;
  subtitle: string;
}

function listarSubstitutos(meal: Meal): SubstitutoInformativo[] {
  const options: SubstitutoInformativo[] = [];

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
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 640;
  const larguraMinimaDia = Platform.OS === 'android' ? 48 : 44;
  const recuoHorizontal = width < 420 ? spacing.sm : spacing.md;
  const larguraMinimaSemana = 7 * larguraMinimaDia + 6 * spacing.xxs + 2 * (recuoHorizontal + spacing.xs + 1);
  const diasEmDuasLinhas = width < larguraMinimaSemana || (fontScale >= 1.4 && width < 560);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const diaClinica = useRef(dataIsoDaClinica());
  const [selectedDay, setSelectedDay] = useState(() => new Date(diaClinica.current + 'T12:00:00').getDay());
  const week = semanaAtual(new Date(diaClinica.current + 'T12:00:00'));
  const [swapModalMeal, setSwapModalMeal] = useState<Meal | null>(null);
  const [swapSearch, setSwapSearch] = useState('');
  const [hydration, setHydration] = useState<HydrationProgress | null>(null);
  const [hydrationError, setHydrationError] = useState('');
  const [savingWater, setSavingWater] = useState(false);
  const { executar } = useCargaVigente();
  const revisaoAgua = useRef(0);

  const recarregarPlano = useCallback((refresh = false) => {
    const dia = dataIsoDaClinica();
    if (dia !== diaClinica.current) {
      diaClinica.current = dia;
      setSelectedDay(new Date(dia + 'T12:00:00').getDay());
      setSwapModalMeal(null);
    }
    return executar(dia, async atual => {
      const versaoAgua = revisaoAgua.current;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      const [plano, agua] = await carregarDieta();
      if (!atual()) return;
      if (plano.status === 'fulfilled') setPlan(plano.value);
      setError(plano.status === 'rejected' ? errorMessage(plano.reason) : '');
      if (versaoAgua === revisaoAgua.current) {
        if (agua.status === 'fulfilled') setHydration(agua.value);
        setHydrationError(agua.status === 'rejected' ? 'Não foi possível consultar a hidratação.' : '');
      }
      setLoading(false);
      setRefreshing(false);
    });
  }, [executar]);

  useAtualizacaoDieta(recarregarPlano);

  const registrarAgua = async () => {
    if (!hydration || savingWater) return;
    setSavingWater(true);
    setHydrationError('');
    try {
      const agua = await addWater();
      revisaoAgua.current += 1;
      if (diaClinica.current === agua.data) setHydration(agua);
      toast.sucesso('Consumo de água registrado.');
    } catch (failure) {
      toast.erro(failure instanceof ApiError ? failure.message : 'Não foi possível registrar a água.');
    } finally {
      setSavingWater(false);
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

  const selectedDate = week[selectedDay].data;
  const mesSelecionado = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const dateKey = [
    selectedDate.getFullYear(),
    String(selectedDate.getMonth() + 1).padStart(2, '0'),
    String(selectedDate.getDate()).padStart(2, '0')
  ].join('-');
  const dentroDaVigencia = plan != null
    && (!plan.vigenciaInicio || dateKey >= plan.vigenciaInicio)
    && (!plan.vigenciaFim || dateKey <= plan.vigenciaFim);
  const visibleMeals = dentroDaVigencia
    ? plan.refeicoes.filter(meal => meal.diaSemana == null || meal.diaSemana === (selectedDay || 7))
    : [];
  const dailyTotals = totaisRefeicoes(visibleMeals);

  const openSwapModal = (meal: Meal) => {
    setSwapSearch('');
    setSwapModalMeal(meal);
  };

  const swapOptions = useMemo(() => {
    if (!swapModalMeal) {
      return [];
    }
    const all = listarSubstitutos(swapModalMeal);
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

  const waterProgressRatio = hydration && hydration.metaMl > 0
    ? Math.min(hydration.consumidoMl / hydration.metaMl, 1)
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
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
        contentContainerStyle={[styles.content, { paddingHorizontal: recuoHorizontal, maxWidth: wide ? 760 : 560 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => recarregarPlano(true)}
            tintColor={colors.brand}
          />
        }
      >
        <View style={styles.pageHeading}>
          <Text style={styles.title} accessibilityRole="header" aria-level={1}>Dieta ativa</Text>
          <Text style={styles.subtitle}>Seu plano alimentar vigente e as refeições do dia.</Text>
        </View>

        <View style={styles.daySelectorSection} testID="meal-plan-day-selector">
          <View style={styles.daySelectorHeader}>
            <Feather name="calendar" size={18} color={colors.brand} aria-hidden />
            <Text style={styles.daySelectorMonthTitle}>
              {mesSelecionado.charAt(0).toLocaleUpperCase('pt-BR') + mesSelecionado.slice(1)}
            </Text>
          </View>
          <View style={styles.dayPillsRow}>
            {week.map((day, index) => {
              const isSelected = index === selectedDay;
              return (
                <Pressable
                  key={day.key}
                  style={({ pressed }) => [
                    styles.dayPill,
                    { minWidth: larguraMinimaDia },
                    diasEmDuasLinhas && styles.dayPillWrapped,
                    isSelected && styles.dayPillActive,
                    pressed && styles.pressed
                  ]}
                  onPress={() => setSelectedDay(index)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  {...(Platform.OS === 'web' && { 'aria-pressed': isSelected })}
                  accessibilityLabel={day.data.toLocaleDateString('pt-BR', { weekday: 'long' }) + ', ' + formatDateFromDate(day.data)}
                  testID={`day-selector-pill-${day.key}`}
                >
                  <Text style={[styles.dayPillLabel, isSelected && styles.dayPillTextActive]}>{day.label}</Text>
                  <Text style={[styles.dayPillNumber, isSelected && styles.dayPillTextActive]}>{day.data.getDate()}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorTitle}>Não foi possível atualizar a dieta</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => recarregarPlano()}
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar a dieta novamente"
            >
              <Text style={styles.primaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !plan ? (
          <View style={styles.stateCard} testID="meal-plan-loading" aria-live="polite">
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.bodyText}>Carregando sua dieta...</Text>
          </View>
        ) : error && !plan ? null : !plan ? (
          <View style={styles.stateCard} testID="meal-plan-empty">
            <View style={styles.sectionIcon}><Feather name="file-text" size={20} color={colors.brand} aria-hidden /></View>
            <Text style={styles.stateTitle} accessibilityRole="header">Nenhuma dieta ativa</Text>
            <Text style={[styles.bodyText, styles.centered]}>
              Um plano publicado e dentro da vigência aparecerá aqui.
            </Text>
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
              <View style={styles.planHeader}>
                <View style={styles.planText}>
                  <Text style={styles.planTitle} accessibilityRole="header" aria-level={2}>
                    {plan.titulo}
                  </Text>
                  <Text style={styles.planNutritionist}>Prescrito por {plan.nutricionistaNome}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Ativo</Text>
                </View>
              </View>
              <View style={styles.validityRow}>
                <Feather name="calendar" size={15} color={colors.brand} aria-hidden />
                <Text style={styles.validityText}>
                  Vigência: {formatDate(plan.vigenciaInicio)} a {formatDate(plan.vigenciaFim)}
                </Text>
              </View>
              {plan.orientacoes?.trim() ? (
                <View style={styles.guidance}>
                  <Text style={styles.guidanceTitle}>Orientações</Text>
                  <Text style={styles.bodyText}>{plan.orientacoes}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionIcon}><Feather name="list" size={20} color={colors.brand} aria-hidden /></View>
                <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>Refeições do dia</Text>
              </View>
              {visibleMeals.length === 0 ? (
                <View style={styles.stateCard}>
                  <Text style={[styles.bodyText, styles.centered]}>{dentroDaVigencia ? 'Nenhuma refeição prevista para este dia.' : 'Data fora da vigência do plano.'}</Text>
                </View>
              ) : (
                <View style={styles.mealCardsList}>
                  {visibleMeals.map((meal) => {
                    const mealSummaryHeadline =
                      meal.itens.map((item) => item.alimento.nome).join(', ') || meal.nome;

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
                              <Text style={styles.mealTitle} accessibilityRole="header" aria-level={3}>
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
                        </View>

                        {meal.itens.some(item => item.substitutos?.length) ? (
                          <Pressable
                            style={({ pressed }) => [styles.mealActionBtn, pressed && styles.pressed]}
                            onPress={() => openSwapModal(meal)}
                            accessibilityRole="button"
                            accessibilityLabel={`Ver substitutos de ${meal.nome}`}
                            testID={`meal-swap-button-${meal.id}`}
                          >
                            <Feather name="repeat" size={16} color={colors.brandDeep} aria-hidden />
                            <Text style={styles.mealActionText}>Ver substitutos</Text>
                          </Pressable>
                        ) : null}

                        <View style={styles.mealItemsDivider} />

                        {meal.itens.map((item) => (
                          <View key={item.alimento.id} style={styles.foodItem}>
                            <View style={styles.foodRow}>
                              <View style={styles.foodDetails}>
                                <Text style={styles.foodName} testID={`meal-food-${meal.id}-${item.alimento.id}`}>
                                  {item.alimento.nome}
                                </Text>
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

            {dentroDaVigencia ? (
              <View style={[styles.summaryGrid, wide && styles.summaryGridWide]}>
                {plan.metas ? (
                  <View style={wide && styles.summaryColumnWide}>
                    <NutrientSummaryCard
                      title="Metas diárias"
                      subtitle="Metas nutricionais de referência diária"
                      nutrients={plan.metas}
                      distribution={plan.percentuais}
                      mode="goals"
                    />
                  </View>
                ) : (
                  <View style={[styles.missingGoal, wide && styles.summaryColumnWide]}>
                    <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>Metas diárias</Text>
                    <Text style={styles.bodyText}>A nutricionista não informou metas para este plano.</Text>
                  </View>
                )}
                <View style={wide && styles.summaryColumnWide}>
                  <NutrientSummaryCard
                    title="Totais diários"
                    subtitle="Progresso diário em relação às metas prescritas"
                    nutrients={dailyTotals}
                    goals={plan.metas}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.hydrationCard} testID="hydration-tracker-card">
              <View style={styles.hydrationTopRow}>
                <View style={styles.hydrationIconCircle}>
                  <Feather name="droplet" size={20} color={colors.brand} aria-hidden />
                </View>
                <View style={styles.hydrationHeaderCopy}>
                  <Text style={styles.hydrationTitle} accessibilityRole="header" aria-level={2}>Hidratação</Text>
                  <Text style={styles.hydrationSubtitle}>
                    {hydration
                      ? `${(hydration.consumidoMl / 1000).toFixed(1)}L de ${(hydration.metaMl / 1000).toFixed(1)}L atingidos`
                      : 'Registro de hidratação indisponível'}
                  </Text>
                </View>
              </View>
              {hydrationError ? (
                <Text style={styles.errorText} accessibilityRole="alert">{hydrationError}</Text>
              ) : null}
              <View
                style={styles.hydrationProgressTrack}
                accessibilityRole="progressbar"
                accessibilityLabel="Hidratação"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(waterProgressRatio * 100)}
              >
                <View
                  style={[
                    styles.hydrationProgressFill,
                    { width: `${Math.round(waterProgressRatio * 100)}%` }
                  ]}
                />
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton, styles.hydrationButton,
                  (!hydration || savingWater) && styles.hydrationButtonDisabled, pressed && styles.pressed
                ]}
                onPress={() => void registrarAgua()}
                disabled={!hydration || savingWater}
                accessibilityRole="button"
                accessibilityState={{ disabled: !hydration || savingWater, busy: savingWater }}
                accessibilityLabel="Adicionar Água"
                testID="hydration-add-button"
              >
                {savingWater ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>+ Adicionar Água</Text>
                )}
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
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} accessibilityRole="header">Substitutos informativos</Text>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
                onPress={() => setSwapModalMeal(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar substitutos informativos"
                testID="meal-swap-close-button"
              >
                <Feather name="x" size={22} color={colors.brandDeep} aria-hidden />
              </Pressable>
            </View>

            <View style={styles.modalSearchWrap}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar substituto..."
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Buscar substituto"
                value={swapSearch}
                onChangeText={setSwapSearch}
                testID="meal-swap-search-input"
              />
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalOptionsList} keyboardShouldPersistTaps="handled">
              {swapOptions.map((option) => (
                <View key={option.id} style={styles.modalOptionCard}>
                  <Text style={styles.modalOptionTitle}>{option.title}</Text>
                  <Text style={styles.modalOptionSubtitle}>{option.subtitle}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  pageHeading: { paddingTop: spacing.xs, gap: spacing.xxs },
  title: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 30, lineHeight: 38 },
  subtitle: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 23 },
  daySelectorSection: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.xs, gap: spacing.xs
  },
  daySelectorHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xxs, paddingTop: spacing.xxs
  },
  daySelectorMonthTitle: {
    flex: 1, color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 22
  },
  dayPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs },
  dayPill: {
    flexBasis: 0, flexGrow: 1, minHeight: 56, paddingVertical: spacing.xxs, borderRadius: radius.md,
    backgroundColor: colors.page, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center'
  },
  dayPillWrapped: { flexBasis: '22%', flexGrow: 0 },
  dayPillActive: { borderColor: colors.brandDark, backgroundColor: colors.brandDark },
  dayPillLabel: { color: colors.textSecondary, fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 17 },
  dayPillNumber: { color: colors.text, fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 25, fontVariant: ['tabular-nums'] },
  dayPillTextActive: { color: colors.white },
  pressed: { opacity: 0.8 },
  sections: { gap: spacing.lg },
  planCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, gap: spacing.sm, ...shadows.card
  },
  planHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.xs },
  planText: { flexGrow: 1, flexShrink: 1, flexBasis: 160, gap: spacing.xxs },
  planTitle: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 23, lineHeight: 30 },
  planNutritionist: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  statusBadge: {
    backgroundColor: colors.confirmedBackground, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs
  },
  statusText: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 13 },
  validityRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.pageAlt,
    borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs
  },
  validityText: { flex: 1, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 19, fontVariant: ['tabular-nums'] },
  guidance: { gap: spacing.xxs },
  guidanceTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22 },
  summaryGrid: { gap: spacing.md },
  summaryGridWide: { flexDirection: 'row' },
  summaryColumnWide: { flex: 1, minWidth: 0 },
  missingGoal: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.xs
  },
  section: { gap: spacing.sm },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionIcon: {
    width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.confirmedBackground,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  sectionTitle: { flexShrink: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 20, lineHeight: 27 },
  mealCardsList: { gap: spacing.sm },
  mealCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm, ...shadows.card
  },
  mealCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  mealIconBox: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.confirmedBackground,
    alignItems: 'center', justifyContent: 'center'
  },
  mealCardHeaderCenter: { flex: 1, minWidth: 0, gap: spacing.xxs },
  mealCategoryRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  mealTitle: { flexShrink: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 17, lineHeight: 23 },
  mealTime: {
    color: colors.brandDeep, backgroundColor: colors.confirmedBackground, borderRadius: radius.sm,
    paddingHorizontal: spacing.xs, paddingVertical: 2, fontFamily: fontFamily.bold, fontSize: 12, fontVariant: ['tabular-nums']
  },
  mealHeadline: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  mealMacroBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs, paddingTop: spacing.xxs },
  mealMacroBadge: { backgroundColor: colors.pageAlt, borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  mealMacroBadgeText: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 16, fontVariant: ['tabular-nums'] },
  mealActionBtn: {
    minHeight: 48, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.confirmedBackground, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.md
  },
  mealActionText: { flexShrink: 1, color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20 },
  mealItemsDivider: { height: 1, backgroundColor: colors.border },
  foodItem: { gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  foodRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs },
  foodDetails: { flexGrow: 1, flexShrink: 1, flexBasis: 140, gap: spacing.xxs },
  foodName: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22 },
  foodMeta: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
  foodSource: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  foodQuantity: { flexShrink: 1, color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  substitutions: { gap: spacing.xs },
  substituteCard: {
    backgroundColor: colors.page, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xxs,
    borderLeftWidth: 2, borderLeftColor: colors.brand
  },
  substituteLabel: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 12 },
  substituteFoodRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs },
  substituteFoodName: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  substituteNutrition: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  mealTotals: { backgroundColor: colors.confirmedBackground, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xxs },
  mealTotalsTitle: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 13 },
  mealTotalsText: { color: colors.text, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 20 },
  hydrationCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md, ...shadows.card
  },
  hydrationTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hydrationIconCircle: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.confirmedBackground,
    alignItems: 'center', justifyContent: 'center'
  },
  hydrationHeaderCopy: { flex: 1, gap: spacing.xxs },
  hydrationTitle: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 20, lineHeight: 27 },
  hydrationSubtitle: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  hydrationProgressTrack: { height: 8, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden' },
  hydrationProgressFill: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.pill },
  hydrationButton: { alignSelf: 'stretch' },
  hydrationButtonDisabled: { opacity: 0.56 },
  modalBackdrop: {
    flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.md
  },
  modalCard: {
    width: '100%', maxWidth: 460, maxHeight: '100%', flexShrink: 1, backgroundColor: colors.card,
    borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm, ...shadows.card
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  modalTitle: { flex: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 20, lineHeight: 27 },
  modalCloseBtn: {
    width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.pageAlt,
    alignItems: 'center', justifyContent: 'center'
  },
  modalSearchWrap: { width: '100%' },
  modalSearchInput: {
    minHeight: 48, backgroundColor: colors.page, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, color: colors.text, fontFamily: fontFamily.regular, fontSize: 16
  },
  modalScroll: { flexGrow: 0, flexShrink: 1 },
  modalOptionsList: { gap: spacing.xs },
  modalOptionCard: {
    gap: spacing.xxs, padding: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.page
  },
  modalOptionTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22 },
  modalOptionSubtitle: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
  stateCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, alignItems: 'center', gap: spacing.xs
  },
  stateTitle: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 25, textAlign: 'center' },
  bodyText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 23 },
  centered: { textAlign: 'center' },
  errorBox: {
    backgroundColor: colors.dangerButtonBackground, borderColor: colors.dangerBackground,
    borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs
  },
  errorTitle: { color: colors.dangerText, fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 22 },
  errorText: { color: colors.dangerText, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  primaryButton: {
    minHeight: 48, backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, alignItems: 'center', justifyContent: 'center'
  },
  primaryButtonText: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  refreshingHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }
});
