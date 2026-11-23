import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppHeader } from '../../components/layout/AppHeader';
import { useAppAlert } from '../../components/feedback/AppAlertProvider';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { logout } from '../../core/auth/auth.service';
import {
  calcularPercentualMeta,
  carregarDashboardPaciente,
  DashboardPacienteDados,
  extrairPrimeiroNome,
  formatarDataHoraConsulta
} from '../../core/evolucao/evolucao.service';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';
import { DailyIntakeCard } from './components/DailyIntakeCard';
import { DailyMealsCard } from './components/DailyMealsCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { showAlert } = useAppAlert();
  const [menuVisible, setMenuVisible] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<DashboardPacienteDados | null>(null);

  useEffect(() => {
    let cancelado = false;

    void carregarDashboardPaciente()
      .then((resposta) => {
        if (!cancelado) {
          setDados(resposta);
          setErro(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          setErro(
            e instanceof Error
              ? e.message
              : 'Não foi possível carregar os dados da tela inicial.'
          );
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCarregando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await carregarDashboardPaciente();
      setDados(resposta);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar os dados da tela inicial.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setAtualizando(true);
    try {
      const resposta = await carregarDashboardPaciente();
      setDados(resposta);
      setErro(null);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar os dados da tela inicial.'
      );
    } finally {
      setAtualizando(false);
    }
  }, []);

  const sair = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      })
    );
  };

  const handleMenuNavigate = async (destination: MenuDestination) => {
    setMenuVisible(false);
    switch (destination) {
      case 'home':
        break;
      case 'profile':
        navigation.navigate('DadosPessoais');
        break;
      case 'results':
        navigation.navigate('Evolucao');
        break;
      case 'appointments':
        navigation.navigate('Agenda');
        break;
      case 'diet':
        navigation.navigate('Dieta');
        break;
      case 'shopping':
        navigation.navigate('Compras');
        break;
      case 'exams':
        navigation.navigate('Exames');
        break;
      case 'password':
        navigation.navigate('TrocarSenha');
        break;
      case 'logout':
        await sair();
        break;
      default:
        showAlert(
          'Em breve',
          'Esta funcionalidade será disponibilizada nas próximas entregas.'
        );
        break;
    }
  };

  const handlePressProximaConsulta = () => {
    navigation.navigate('Agenda');
  };

  const handlePressAcessarDieta = () => {
    navigation.navigate('Dieta');
  };

  const primeiroNome = extrairPrimeiroNome(dados?.nomePaciente);
  const consumo = dados?.consumo ?? null;

  const kcalConsumidas = consumo?.caloriasConsumidas ?? 0;
  const metaKcal = consumo?.metaCalorias ?? dados?.dietaAtiva?.metaKcal ?? 0;
  const percKcal = calcularPercentualMeta(kcalConsumidas, metaKcal);

  const proteinaConsumida = consumo?.proteinas ?? 0;
  const metaProteina = consumo?.metaProteinas ?? dados?.dietaAtiva?.metaProteina ?? 0;
  const percProteina = calcularPercentualMeta(proteinaConsumida, metaProteina);

  const carboConsumido = consumo?.carboidratos ?? 0;
  const metaCarbo = consumo?.metaCarboidratos ?? dados?.dietaAtiva?.metaCarboidratos ?? 0;
  const percCarbo = calcularPercentualMeta(carboConsumido, metaCarbo);

  const textoProximaConsulta = dados?.proximaConsulta?.dataHora
    ? formatarDataHoraConsulta(dados.proximaConsulta.dataHora)
    : 'Nenhuma consulta agendada';

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />
      <SideMenu
        visible={menuVisible}
        activeItem="home"
        userName={dados?.nomePaciente || 'Paciente'}
        onClose={() => setMenuVisible(false)}
        onNavigate={(dest) => void handleMenuNavigate(dest)}
      />

      {carregando ? (
        <View style={styles.centerBox} testID="dashboard-loading">
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={styles.loadingText}>Carregando seu resumo diário...</Text>
        </View>
      ) : erro ? (
        <View style={styles.centerBox} testID="dashboard-erro">
          <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
          <Text style={styles.errorText}>{erro}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => void recarregar()}
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => void handleRefresh()}
              colors={[colors.brand]}
              tintColor={colors.brand}
            />
          }
        >
          {/* Saudação */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle} testID="dashboard-greeting">
              Olá, {primeiroNome}!
            </Text>
            <Text style={styles.greetingSubtitle}>
              Sua jornada de hoje começou bem.
            </Text>
          </View>

          <DailyMealsCard onChanged={handleRefresh} />
          <DailyIntakeCard
            calorias={{ valor: kcalConsumidas, meta: metaKcal, percentual: percKcal }}
            proteinas={{ valor: proteinaConsumida, percentual: percProteina }}
            carboidratos={{ valor: carboConsumido, percentual: percCarbo }}
          />

          {/* Card: Próxima Consulta */}
          <Pressable
            style={({ pressed }) => [
              styles.consultaCard,
              pressed && styles.cardPressed
            ]}
            onPress={handlePressProximaConsulta}
            accessibilityRole="button"
            accessibilityLabel={`Próxima Consulta: ${textoProximaConsulta}`}
            testID="dashboard-proxima-consulta-card"
          >
            <View style={styles.consultaIconBox}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-8.53 9.47L7.4 14.4l1.41-1.41 1.66 1.66 4.24-4.24 1.41 1.41-5.65 5.65z"
                  fill="#86efac"
                />
              </Svg>
            </View>

            <View style={styles.consultaTextContainer}>
              <Text style={styles.consultaLabel}>Próxima Consulta</Text>
              <Text style={styles.consultaDate} testID="dashboard-proxima-consulta-texto">
                {textoProximaConsulta}
              </Text>
            </View>

            <View style={styles.consultaChevronBox}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9.29 6.71a.996.996 0 0 0 0 1.41L13.17 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"
                  fill="#ffffff"
                />
              </Svg>
            </View>
          </Pressable>

          {/* Card: Sua dieta personalizada */}
          <View style={styles.dietaCardWrapper} testID="dashboard-dieta-card">
            <ImageBackground
              source={require('../../../assets/diet-card-bg.png')}
              style={styles.dietaImageBg}
              imageStyle={styles.dietaImageStyle}
              resizeMode="cover"
            >
              <View style={styles.dietaOverlay}>
                <Text style={styles.dietaTitle}>Sua dieta personalizada</Text>
                <Text style={styles.dietaDescription}>
                  Confira o plano de refeições atualizado pela sua nutricionista para hoje.
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.dietaButton,
                    pressed && styles.cardPressed
                  ]}
                  onPress={handlePressAcessarDieta}
                  accessibilityRole="button"
                  accessibilityLabel="Acessar Dieta"
                  testID="dashboard-acessar-dieta-btn"
                >
                  <Text style={styles.dietaButtonText}>Acessar Dieta</Text>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59a.996.996 0 0 0 0-1.41l-6.58-6.6a.996.996 0 1 0-1.41 1.41L16.17 11H5c-.55 0-1 .45-1 1s.45 1 1 1z"
                      fill="#bbf7d0"
                    />
                  </Svg>
                </Pressable>
              </View>
            </ImageBackground>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 14
  },
  errorTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    marginBottom: spacing.xs
  },
  errorText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  retryButton: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md
  },
  retryButtonText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 14
  },
  greetingSection: {
    marginBottom: spacing.xxs
  },
  greetingTitle: {
    color: '#1e293b',
    fontFamily: fontFamily.extrabold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800'
  },
  greetingSubtitle: {
    color: '#475569',
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2
  },
  consultaCard: {
    backgroundColor: '#1b3b2b',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card
  },
  cardPressed: {
    opacity: 0.88
  },
  consultaIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  consultaTextContainer: {
    flex: 1,
    marginHorizontal: 14
  },
  consultaLabel: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginBottom: 2
  },
  consultaDate: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 15,
    fontWeight: '700'
  },
  consultaChevronBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dietaCardWrapper: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    minHeight: 300,
    ...shadows.card
  },
  dietaImageBg: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'flex-end'
  },
  dietaImageStyle: {
    borderRadius: radius.xl,
    width: '100%',
    height: '100%'
  },
  dietaOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.42)'
  },
  dietaTitle: {
    color: colors.white,
    fontFamily: fontFamily.extrabold,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    marginBottom: 8
  },
  dietaDescription: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18
  },
  dietaButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...shadows.button
  },
  dietaButtonText: {
    color: '#bbf7d0',
    fontFamily: fontFamily.bold,
    fontSize: 14,
    fontWeight: '700'
  }
});
