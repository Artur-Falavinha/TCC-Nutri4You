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
import {
  formatDate,
  formatFoodSource,
  formatGrams,
  formatNutrient,
  formatTime
} from '../../features/dieta/dieta.formatters';
import { getActiveMealPlan } from '../../features/dieta/dieta.service';
import { MealPlan } from '../../features/dieta/dieta.models';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';
import { NutrientSummaryCard } from './components/NutrientSummaryCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Dieta'>;

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível carregar sua dieta. Tente novamente.';
}

export function MealPlanScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menuNotice, setMenuNotice] = useState('');
  const [plan, setPlan] = useState<MealPlan | null>(null);
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

  const openShoppingList = () => navigation.navigate('Compras');

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
        {menuNotice ? (
          <View style={styles.noticeBox} accessibilityRole="alert">
            <Text style={styles.noticeText}>{menuNotice}</Text>
          </View>
        ) : null}
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
                  <NutrientSummaryCard title="Metas diárias" nutrients={plan.metas} />
                </View>
              ) : (
                <View style={[styles.summaryColumn, styles.missingGoal]}>
                  <Text style={styles.sectionTitle}>Metas diárias</Text>
                  <Text style={styles.bodyText}>A nutricionista não informou metas para este plano.</Text>
                </View>
              )}
              <View style={styles.summaryColumn}>
                <NutrientSummaryCard title="Totais diários" nutrients={plan.totais} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Refeições do dia
              </Text>
              {plan.refeicoes.length === 0 ? (
                <View style={styles.stateCard}>
                  <Text style={styles.bodyText}>Este plano ainda não contém refeições.</Text>
                </View>
              ) : (
                plan.refeicoes.map((meal) => (
                  <View key={meal.id} style={styles.mealCard}>
                    <View style={[styles.mealHeading, wide && styles.mealHeadingWide]}>
                      <Text style={styles.mealTitle} accessibilityRole="header">
                        {meal.nome}
                      </Text>
                      <Text style={styles.mealTime}>{formatTime(meal.horario)}</Text>
                    </View>
                    {meal.itens.map((item) => (
                      <View key={item.alimento.id} style={styles.foodRow}>
                        <View style={styles.foodDetails}>
                          <Text style={styles.foodName}>{item.alimento.nome}</Text>
                          <Text style={styles.foodMeta}>{formatNutrient(item.nutrientes.kcal)} kcal</Text>
                          <Text style={styles.foodSource}>
                            {formatFoodSource(item.alimento.fonte, item.alimento.versaoFonte)}
                            {item.alimento.codigoTaco != null
                              ? ` · Código TACO ${item.alimento.codigoTaco}`
                              : ''}
                          </Text>
                          {item.alimento.observacaoFonte ? (
                            <Text style={styles.foodSource}>Observação: {item.alimento.observacaoFonte}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.foodQuantity} accessibilityLabel={`${formatGrams(item.quantidadeGramas)} gramas`}>
                          {formatGrams(item.quantidadeGramas)} g
                        </Text>
                      </View>
                    ))}
                    <View style={styles.mealTotals}>
                      <Text style={styles.mealTotalsTitle}>Total da refeição</Text>
                      <Text style={styles.mealTotalsText}>
                        {formatNutrient(meal.totais.kcal)} kcal · {formatNutrient(meal.totais.proteinas)} g proteínas ·{' '}
                        {formatNutrient(meal.totais.carboidratos)} g carboidratos · {formatNutrient(meal.totais.gorduras)} g gorduras
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
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
  mealCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, ...shadows.card },
  mealHeading: { flexDirection: 'column', alignItems: 'flex-start', gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  mealHeadingWide: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 16 },
  mealTime: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14 },
  foodRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.xs },
  foodDetails: { flex: 1, gap: 3 },
  foodName: { color: colors.text, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  foodMeta: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13 },
  foodSource: { color: colors.textSubtle, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16 },
  foodQuantity: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 13 },
  mealTotals: { backgroundColor: colors.pageAlt, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xxs },
  mealTotalsTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 12 },
  mealTotalsText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
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
