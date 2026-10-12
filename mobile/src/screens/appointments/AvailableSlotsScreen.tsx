import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ArrowLeftIcon from '../../assets/appointments/arrow-left.svg';
import CheckCircleIcon from '../../assets/appointments/check-circle.svg';
import InfoIcon from '../../assets/appointments/info.svg';
import { ApiError } from '../../core/api/api-response.types';
import {
  getAppointmentAvailability,
  rescheduleAppointment,
  scheduleAppointment
} from '../../features/appointments/appointments.service';
import {
  buildWeekDays,
  fromDateKey,
  groupSlotsByPeriod,
  monthTitle,
  timeRangeLabel,
  toDateKey,
  weekdayShort
} from '../../features/appointments/appointments-date.util';
import { AppointmentAvailability } from '../../features/appointments/appointments.models';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'HorariosDisponiveis'>;

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível carregar os horários disponíveis.';
}

export function AvailableSlotsScreen({ navigation, route }: Props) {
  const { nutricionistaId, consultaId, versao } = route.params;
  const [selectedDate, setSelectedDate] = useState(route.params.data);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AppointmentAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void getAppointmentAvailability(nutricionistaId, selectedDate)
      .then((data) => {
        if (active) {
          setAvailability(data);
        }
      })
      .catch((failure) => {
        if (active) {
          setAvailability(null);
          setError(errorMessage(failure));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [nutricionistaId, selectedDate]);

  const weekDays = useMemo(() => buildWeekDays(selectedDate), [selectedDate]);
  const groupedSlots = useMemo(
    () => groupSlotsByPeriod(availability?.horarios ?? []),
    [availability]
  );

  const confirm = async () => {
    if (!selectedSlot) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (consultaId !== undefined && versao !== undefined) {
        await rescheduleAppointment(consultaId, { dataHora: selectedSlot, versao });
        Alert.alert('Reagendamento solicitado', 'O novo horário aguarda confirmação do profissional.');
      } else {
        await scheduleAppointment({ nutricionistaId, dataHora: selectedSlot });
        Alert.alert('Horário solicitado', 'Sua consulta está aguardando confirmação.');
      }
      navigation.navigate('Agenda');
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : 'Não foi possível confirmar o horário.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ArrowLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Horários Disponíveis</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.professionalName}>
            {availability?.nutricionistaNome ?? 'Nutricionista'}
          </Text>
          <Text style={styles.specialty}>
            {availability?.especialidade ?? 'Nutricionista Clínico'}
          </Text>
        </View>

        <View style={styles.weekSection}>
          <View style={styles.weekTitleRow}>
            <Text style={styles.weekTitle}>{monthTitle(fromDateKey(selectedDate))}</Text>
            <Pressable
              onPress={() => navigation.navigate('Agenda')}
              accessibilityRole="button"
            >
              <Text style={styles.calendarLink}>VER CALENDÁRIO</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekDays}
          >
            {weekDays.map((date) => {
              const dateKey = toDateKey(date);
              const active = dateKey === selectedDate;
              return (
                <Pressable
                  key={dateKey}
                  style={[styles.weekDay, active && styles.activeWeekDay]}
                  onPress={() => {
                    setLoading(true);
                    setSelectedSlot(null);
                    setError('');
                    setSelectedDate(dateKey);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.weekdayName, active && styles.activeWeekdayText]}>
                    {weekdayShort(date)}
                  </Text>
                  <Text style={[styles.weekdayNumber, active && styles.activeWeekdayText]}>
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : (
          <>
            <SlotSection
              title="Manhã"
              slots={groupedSlots.morning}
              selectedSlot={selectedSlot}
              onSelect={setSelectedSlot}
            />
            <SlotSection
              title="Tarde"
              slots={groupedSlots.afternoon}
              selectedSlot={selectedSlot}
              onSelect={setSelectedSlot}
            />
            {availability?.horarios.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Não há horários disponíveis para esta data.</Text>
              </View>
            ) : null}
          </>
        )}

        <View style={styles.infoNote}>
          <InfoIcon />
          <Text style={styles.infoText}>
            {'As consultas têm duração aproximada de 45 minutos.\nChegue com 10 minutos de antecedência.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [
            styles.confirmButton,
            (!selectedSlot || saving) && styles.disabledButton,
            pressed && selectedSlot && styles.pressed
          ]}
          onPress={() => void confirm()}
          disabled={!selectedSlot || saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: !selectedSlot || saving }}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.confirmText}>Confirmar Horário</Text>
              <CheckCircleIcon />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface SlotSectionProps {
  title: string;
  slots: string[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}

function SlotSection({ title, slots, selectedSlot, onSelect }: SlotSectionProps) {
  if (slots.length === 0) {
    return null;
  }
  return (
    <View style={styles.slotSection}>
      <Text style={styles.slotTitle}>{title}</Text>
      <View style={styles.slotGrid}>
        {slots.map((slot) => {
          const active = selectedSlot === slot;
          return (
            <Pressable
              key={slot}
              style={[styles.slot, active && styles.activeSlot]}
              onPress={() => onSelect(slot)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.slotText, active && styles.activeSlotText]}>
                {timeRangeLabel(slot)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageAlt
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(249,249,249,0.96)'
  },
  backButton: {
    width: 28,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: colors.brandDark,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 28
  },
  scroll: {
    flex: 1
  },
  content: {
    width: '100%',
    maxWidth: 428,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg
  },
  profileCard: {
    minHeight: 80,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: 'center'
  },
  professionalName: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 28
  },
  specialty: {
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20
  },
  weekSection: {
    gap: spacing.sm
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  weekTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 24
  },
  calendarLink: {
    color: colors.brand,
    fontFamily: fontFamily.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6
  },
  weekDays: {
    gap: spacing.xs,
    paddingBottom: spacing.xs
  },
  weekDay: {
    width: 56,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs
  },
  activeWeekDay: {
    backgroundColor: colors.brand,
    ...shadows.button
  },
  weekdayName: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: -0.5
  },
  weekdayNumber: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 28
  },
  activeWeekdayText: {
    color: colors.white
  },
  loading: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center'
  },
  slotSection: {
    minHeight: 180,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md
  },
  slotTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 24
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm
  },
  slot: {
    width: '48%',
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeSlot: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
    ...shadows.button
  },
  slotText: {
    color: colors.text,
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20
  },
  activeSlotText: {
    color: colors.white
  },
  infoNote: {
    minHeight: 71,
    backgroundColor: 'rgba(0,84,20,0.05)',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm
  },
  infoText: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 19.5
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
    padding: spacing.lg
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    textAlign: 'center'
  },
  bottomBar: {
    padding: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: '#1a1c1c',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 12
  },
  confirmButton: {
    height: 56,
    maxWidth: 380,
    width: '100%',
    alignSelf: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  disabledButton: {
    opacity: 0.5
  },
  confirmText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 24
  },
  pressed: {
    opacity: 0.78
  }
});
