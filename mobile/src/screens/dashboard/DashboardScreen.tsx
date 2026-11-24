import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/layout/AppHeader';
import { toast } from '../../components/feedback/toast';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { logout } from '../../core/auth/auth.service';
import {
  calcularPercentualMeta,
  carregarDashboardPaciente,
  DashboardPacienteDados,
  extrairPrimeiroNome
} from '../../core/evolucao/evolucao.service';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';
import { DailyIntakeCard } from './components/DailyIntakeCard';
import { DailyMealsCard } from './components/DailyMealsCard';
import { NextAppointmentCard } from './components/NextAppointmentCard';
import { PersonalDietCard } from './components/PersonalDietCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
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
        toast.informacao('Esta funcionalidade será disponibilizada nas próximas entregas.');
        break;
    }
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

          <NextAppointmentCard
            dataHora={dados?.proximaConsulta?.dataHora}
            abrirAgenda={() => navigation.navigate('Agenda')}
          />
          <PersonalDietCard abrirDieta={() => navigation.navigate('Dieta')} />
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
  }
});
