import { Feather } from '@expo/vector-icons';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/layout/AppHeader';
import { SectionCardHeader, sectionCardStyles } from '../../components/layout/SectionCardHeader';
import { useAppAlert } from '../../components/feedback/AppAlertProvider';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { ApiError } from '../../core/api/api-response.types';
import { logout } from '../../core/auth/auth.service';
import { carregarPerfil } from '../../core/perfil/perfil.service';
import {
  cancelAppointment,
  listAgendaNutritionists,
  listAppointments
} from '../../features/appointments/appointments.service';
import { dateKeyFromLocalDateTime } from '../../features/appointments/appointments-date.util';
import { AgendaNutritionist, Appointment } from '../../features/appointments/appointments.models';
import { AppointmentCard } from '../../features/appointments/components/AppointmentCard';
import { NutritionistCatalog } from '../../features/appointments/components/NutritionistCatalog';
import { CancelAppointmentModal } from '../../features/appointments/components/CancelAppointmentModal';
import { buildGoogleCalendarUrl } from '../../features/appointments/google-calendar-link';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Agenda'>;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function AppointmentsScreen({ navigation }: Props) {
  const { showAlert } = useAppAlert();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nutritionists, setNutritionists] = useState<AgendaNutritionist[]>([]);
  const [userName, setUserName] = useState('Paciente');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [pendingCancellation, setPendingCancellation] = useState<Appointment | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const [appointmentData, nutritionistData, profile] = await Promise.all([
        listAppointments(),
        listAgendaNutritionists(),
        carregarPerfil()
      ]);
      setAppointments(appointmentData ?? []);
      setNutritionists(nutritionistData ?? []);
      setUserName(profile.nome || 'Paciente');
    } catch (failure) {
      setError(errorMessage(failure, 'Não foi possível carregar a agenda.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const confirmCancellation = async () => {
    if (!pendingCancellation) {
      return;
    }
    setCancelling(true);
    setError('');
    try {
      await cancelAppointment(pendingCancellation.id, pendingCancellation.versao);
      setPendingCancellation(null);
      await load(true);
      showAlert(
        'Consulta cancelada',
        'Se você adicionou essa consulta ao Google Agenda, remova o evento manualmente.'
      );
    } catch (failure) {
      setError(errorMessage(failure, 'Não foi possível cancelar a consulta.'));
    } finally {
      setCancelling(false);
    }
  };

  const addToGoogleCalendar = async (appointment: Appointment) => {
    setError('');
    try {
      await Linking.openURL(buildGoogleCalendarUrl(appointment));
    } catch (failure) {
      setError(errorMessage(failure, 'Não foi possível abrir o Google Agenda.'));
    }
  };

  const handleMenuNavigation = async (destination: MenuDestination) => {
    setMenuVisible(false);
    if (destination === 'appointments') {
      return;
    }
    if (destination === 'diet') {
      navigation.navigate('Dieta');
      return;
    }
    if (destination === 'shopping') {
      navigation.navigate('Compras');
      return;
    }
    if (destination === 'home') {
      navigation.navigate('Dashboard');
      return;
    }
    if (destination === 'profile') {
      navigation.navigate('DadosPessoais');
      return;
    }
    if (destination === 'results') {
      navigation.navigate('Evolucao');
      return;
    }
    if (destination === 'exams') {
      navigation.navigate('Exames');
      return;
    }
    if (destination === 'password') {
      navigation.navigate('TrocarSenha');
      return;
    }
    if (destination === 'logout') {
      await logout();
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
      return;
    }
    setError('Este módulo ainda não está disponível nesta etapa.');
  };

  const secaoConsultas = (
    <View style={sectionCardStyles.superficie} testID="agenda-consultas">
      <SectionCardHeader icone="clipboard" titulo="Consultas agendadas" />

      {error ? (
        <View style={styles.erro}>
          <Text style={styles.textoErro} accessibilityRole="alert">{error}</Text>
          <Pressable
            style={({ pressed }) => [styles.recarregar, pressed && styles.recarregarPressionado]}
            accessibilityRole="button"
            onPress={() => void load()}
          >
            <Text style={styles.textoRecarregar}>Recarregar agenda</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.loading} aria-busy>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.loadingText}>Carregando consultas...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon} aria-hidden>
            <Feather name="inbox" size={20} color={colors.brandDeep} />
          </View>
          <View style={styles.emptyContent}>
            <Text style={styles.emptyTitle}>Nenhuma consulta agendada</Text>
            <Text style={styles.emptyText}>
              Seus pedidos e consultas confirmadas aparecem aqui.
            </Text>
          </View>
        </View>
      ) : (
        appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onAddToCalendar={(item) => void addToGoogleCalendar(item)}
            onReschedule={(item) => navigation.navigate('HorariosDisponiveis', {
              data: dateKeyFromLocalDateTime(item.dataHora),
              nutricionistaId: item.nutricionistaId,
              consultaId: item.id,
              versao: item.versao
            })}
            onCancel={setPendingCancellation}
          />
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.brand}
          />
        }
      >
        <Text style={styles.tituloPagina} accessibilityRole="header" aria-level={1}>Agenda</Text>
        {!loading && !error ? (
          <NutritionistCatalog
            nutritionists={nutritionists}
            onSelect={(nutricionistaId) => navigation.navigate('HorariosDisponiveis', { nutricionistaId })}
          >
            {secaoConsultas}
          </NutritionistCatalog>
        ) : secaoConsultas}
      </ScrollView>

      <SideMenu
        visible={menuVisible}
        activeItem="appointments"
        userName={userName}
        onClose={() => setMenuVisible(false)}
        onNavigate={(destination) => void handleMenuNavigation(destination)}
      />

      <CancelAppointmentModal
        appointment={pendingCancellation}
        loading={cancelling}
        onKeep={() => setPendingCancellation(null)}
        onConfirm={() => void confirmCancellation()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page
  },
  scroll: {
    flex: 1
  },
  content: {
    width: '100%',
    maxWidth: 560,
    flexGrow: 1,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md
  },
  tituloPagina: {
    color: colors.brandDeep,
    fontFamily: fontFamily.extrabold,
    fontSize: 28,
    lineHeight: 36
  },
  loading: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 14
  },
  erro: {
    backgroundColor: colors.dangerButtonBackground,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm
  },
  textoErro: {
    color: colors.dangerText,
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 21
  },
  recarregar: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card
  },
  recarregarPressionado: { backgroundColor: colors.dangerBackground },
  textoRecarregar: { color: colors.dangerText, fontFamily: fontFamily.bold, fontSize: 14 },
  emptyContent: {
    flex: 1,
    gap: spacing.xxs
  },
  emptyState: {
    backgroundColor: colors.page,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.subtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 24
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21
  }
});
