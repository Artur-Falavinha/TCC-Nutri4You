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
import Svg, { Circle, Path } from 'react-native-svg';

import DietIcon from '../../assets/appointments/nav-diet.svg';
import { AppHeader } from '../../components/layout/AppHeader';
import { useAppAlert } from '../../components/feedback/AppAlertProvider';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { logout } from '../../core/auth/auth.service';
import {
  calcularPercentualMeta,
  carregarDashboardPaciente,
  DashboardPacienteDados,
  extrairPrimeiroNome,
  formatarDataHoraConsulta,
  formatarNumeroMilhar
} from '../../core/evolucao/evolucao.service';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const RING_SIZE = 76;
const RING_STROKE = 7;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
    showAlert(
      'Plano Alimentar',
      dados?.dietaAtiva
        ? `Seu plano alimentar atual prescrito por ${dados.dietaAtiva.nutricionistaNome || 'sua nutricionista'} possui meta de ${formatarNumeroMilhar(dados.dietaAtiva.metaKcal)} kcal.`
        : 'Sua nutricionista ainda não publicou um plano alimentar detalhado para visualização.'
    );
  };

  const primeiroNome = extrairPrimeiroNome(dados?.nomePaciente);
  const consumo = dados?.consumo ?? null;

  const kcalConsumidas = consumo?.caloriasConsumidas ?? 0;
  const metaKcal = consumo?.metaCalorias ?? dados?.dietaAtiva?.metaKcal ?? 0;
  const percKcal = calcularPercentualMeta(kcalConsumidas, metaKcal);
  const percRing = Math.min(100, Math.max(0, percKcal));
  const strokeDashoffset = RING_CIRCUMFERENCE - (percRing / 100) * RING_CIRCUMFERENCE;

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
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

          {/* Card: Consumo Diário */}
          <View style={styles.consumoCard} testID="dashboard-consumo-card">
            <View style={styles.consumoTopRow}>
              <View style={styles.consumoMainInfo}>
                <Text style={styles.consumoLabel}>CONSUMO DIÁRIO</Text>
                <View style={styles.kcalRow}>
                  <Text style={styles.kcalValue}>
                    {formatarNumeroMilhar(kcalConsumidas)}
                  </Text>
                  <Text style={styles.kcalUnit}> kcal</Text>
                </View>
                <Text style={styles.metaText}>
                  {metaKcal > 0
                    ? `Meta: ${formatarNumeroMilhar(metaKcal)} kcal`
                    : 'Meta calórica ainda não definida'}
                </Text>
              </View>

              <View style={styles.ringWrapper}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke="#f1f5f9"
                    strokeWidth={RING_STROKE}
                    fill="none"
                  />
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={colors.brand}
                    strokeWidth={RING_STROKE}
                    strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </Svg>
                <View style={styles.ringCenter}>
                  <Text style={styles.ringPercentText} testID="dashboard-kcal-percent">
                    {percKcal}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.macrosRow}>
              {/* Proteínas */}
              <View style={styles.macroColumn}>
                <View style={styles.macroHeader}>
                  <View style={styles.macroTitleGroup}>
                    <DietIcon color={colors.brand} width={13} height={13} />
                    <Text style={styles.macroName}>Proteínas</Text>
                  </View>
                  <Text style={styles.macroStats}>
                    <Text style={styles.macroGramas}>{Math.round(proteinaConsumida)}g</Text>
                    <Text style={styles.macroPercent}> {percProteina}%</Text>
                  </Text>
                </View>
                <View style={styles.macroBarTrack}>
                  <View
                    style={[
                      styles.macroBarFill,
                      { width: `${Math.min(100, Math.max(0, percProteina))}%` }
                    ]}
                  />
                </View>
              </View>

              {/* Carbos */}
              <View style={styles.macroColumn}>
                <View style={styles.macroHeader}>
                  <View style={styles.macroTitleGroup}>
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66l.07-.12L13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15L11 21z"
                        fill={colors.brand}
                      />
                    </Svg>
                    <Text style={styles.macroName}>Carbos</Text>
                  </View>
                  <Text style={styles.macroStats}>
                    <Text style={styles.macroGramas}>{Math.round(carboConsumido)}g</Text>
                    <Text style={styles.macroPercent}> {percCarbo}%</Text>
                  </Text>
                </View>
                <View style={styles.macroBarTrack}>
                  <View
                    style={[
                      styles.macroBarFill,
                      { width: `${Math.min(100, Math.max(0, percCarbo))}%` }
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

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
  consumoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.card
  },
  consumoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  consumoMainInfo: {
    flex: 1,
    paddingRight: spacing.sm
  },
  consumoLabel: {
    color: '#64748b',
    fontFamily: fontFamily.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '700'
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  kcalValue: {
    color: '#1e293b',
    fontFamily: fontFamily.extrabold,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800'
  },
  kcalUnit: {
    color: '#64748b',
    fontFamily: fontFamily.regular,
    fontSize: 16
  },
  metaText: {
    color: '#64748b',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 2
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ringPercentText: {
    color: '#1e293b',
    fontFamily: fontFamily.bold,
    fontSize: 15,
    fontWeight: '700'
  },
  macrosRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg
  },
  macroColumn: {
    flex: 1
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  macroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  macroName: {
    color: '#334155',
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600'
  },
  macroStats: {
    fontSize: 12
  },
  macroGramas: {
    color: '#1e293b',
    fontFamily: fontFamily.bold,
    fontSize: 12,
    fontWeight: '700'
  },
  macroPercent: {
    color: '#94a3b8',
    fontFamily: fontFamily.regular,
    fontSize: 11
  },
  macroBarTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: radius.pill,
    overflow: 'hidden'
  },
  macroBarFill: {
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: radius.pill
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
    borderRadius: radius.xl
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
