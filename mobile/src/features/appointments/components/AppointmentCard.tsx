import { Pressable, StyleSheet, Text, View } from 'react-native';

import CalendarDateIcon from '../../../assets/appointments/calendar-date.svg';
import ClockIcon from '../../../assets/appointments/clock.svg';
import { colors, fontFamily, radius, shadows, spacing } from '../../../theme/tokens';
import { appointmentDateLabel, timeRangeLabel } from '../appointments-date.util';
import { Appointment } from '../appointments.models';

interface AppointmentCardProps {
  appointment: Appointment;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

const statusLabels: Record<Appointment['status'], string> = {
  AGUARDANDO_CONFIRMACAO: 'AGUARDANDO CONFIRMAÇÃO',
  CONFIRMADA: 'CONFIRMADO',
  REALIZADA: 'REALIZADA',
  CANCELADA: 'CANCELADA'
};

export function AppointmentCard({
  appointment,
  onReschedule,
  onCancel
}: AppointmentCardProps) {
  const confirmed = appointment.status === 'CONFIRMADA';
  const pending = appointment.status === 'AGUARDANDO_CONFIRMACAO';

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.status,
          pending ? styles.pendingStatus : styles.confirmedStatus
        ]}
      >
        <Text style={[styles.statusText, pending ? styles.pendingText : styles.confirmedText]}>
          {statusLabels[appointment.status]}
        </Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <CalendarDateIcon />
          <Text style={styles.detailText}>{appointmentDateLabel(appointment.dataHora)}</Text>
        </View>
        <View style={styles.detailItem}>
          <ClockIcon />
          <Text style={styles.detailText}>{timeRangeLabel(appointment.dataHora)}</Text>
        </View>
      </View>

      {confirmed ? (
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.rescheduleButton, pressed && styles.pressed]}
            onPress={() => onReschedule(appointment)}
            accessibilityRole="button"
          >
            <Text style={styles.rescheduleText}>Reagendar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            onPress={() => onCancel(appointment)}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card
  },
  status: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs
  },
  confirmedStatus: {
    backgroundColor: colors.confirmedBackground
  },
  pendingStatus: {
    backgroundColor: colors.pendingBackground
  },
  statusText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5
  },
  confirmedText: {
    color: colors.brandDark
  },
  pendingText: {
    color: colors.pending
  },
  details: {
    minHeight: 44,
    backgroundColor: colors.subtle,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  detailText: {
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20
  },
  actions: {
    paddingTop: spacing.xxs,
    flexDirection: 'row',
    gap: spacing.sm
  },
  rescheduleButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,84,20,0.05)',
    borderRadius: radius.md
  },
  rescheduleText: {
    color: colors.brandDark,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 20
  },
  cancelButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    ...shadows.button
  },
  cancelText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 20
  },
  pressed: {
    opacity: 0.75
  }
});
