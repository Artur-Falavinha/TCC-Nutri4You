import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/layout/AppHeader';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { ApiError } from '../../core/api/api-response.types';
import { logout } from '../../core/auth/auth.service';
import {
  carregarPerfil,
  listarNutricionistas,
  NutricionistaVinculo
} from '../../core/perfil/perfil.service';
import {
  cancelAppointment,
  listAppointments
} from '../../features/appointments/appointments.service';
import { dateKeyFromLocalDateTime, toDateKey } from '../../features/appointments/appointments-date.util';
import { Appointment } from '../../features/appointments/appointments.models';
import { AppointmentCard } from '../../features/appointments/components/AppointmentCard';
import { CalendarCard } from '../../features/appointments/components/CalendarCard';
import { CancelAppointmentModal } from '../../features/appointments/components/CancelAppointmentModal';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Agenda'>;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function AppointmentsScreen({ navigation }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nutritionists, setNutritionists] = useState<NutricionistaVinculo[]>([]);
  const [userName, setUserName] = useState('Paciente');
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
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
        listarNutricionistas(),
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

  const appointmentDates = useMemo(
    () => new Set(appointments.map((item) => dateKeyFromLocalDateTime(item.dataHora))),
    [appointments]
  );

  const openAvailability = (date: string, nutritionistId?: number, appointment?: Appointment) => {
    const selectedNutritionist = nutritionistId
      ? nutritionists.find((item) => item.id === nutritionistId)
      : nutritionists[0];
    if (!selectedNutritionist) {
      setError('Você precisa ter um nutricionista vinculado para solicitar uma consulta.');
      return;
    }
    setSelectedDate(date);
    navigation.navigate('HorariosDisponiveis', {
      nutricionistaId: selectedNutritionist.id,
      data: date,
      consultaId: appointment?.id,
      versao: appointment?.versao
    });
  };

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
    } catch (failure) {
      setError(errorMessage(failure, 'Não foi possível cancelar a consulta.'));
    } finally {
      setCancelling(false);
    }
  };

  const handleMenuNavigation = async (destination: MenuDestination) => {
    setMenuVisible(false);
    if (destination === 'appointments') {
      return;
    }
    if (destination === 'profile' || destination === 'home') {
      navigation.navigate('Home');
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.brand}
          />
        }
      >
        <CalendarCard
          selectedDate={selectedDate}
          appointmentDates={appointmentDates}
          onSelectDate={(date) => openAvailability(date)}
        />

        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>Consultas Agendadas</Text>

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.loadingText}>Carregando consultas...</Text>
            </View>
          ) : appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhuma consulta agendada</Text>
              <Text style={styles.emptyText}>
                Escolha um dia disponível no calendário para solicitar um horário.
              </Text>
            </View>
          ) : (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onReschedule={(item) =>
                  openAvailability(
                    dateKeyFromLocalDateTime(item.dataHora),
                    item.nutricionistaId,
                    item
                  )
                }
                onCancel={setPendingCancellation}
              />
            ))
          )}
        </View>
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
    maxWidth: 428,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg
  },
  appointmentsSection: {
    gap: spacing.md
  },
  sectionTitle: {
    paddingHorizontal: spacing.xs,
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: -0.45
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
  error: {
    color: colors.dangerText,
    backgroundColor: colors.dangerButtonBackground,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: 13
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs
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
    lineHeight: 20,
    textAlign: 'center'
  }
});
