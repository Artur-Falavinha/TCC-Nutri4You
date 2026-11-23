import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sectionCardStyles } from '../../../components/layout/SectionCardHeader';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';
import { appointmentDateLabel, timeRangeLabel } from '../appointments-date.util';
import { Appointment } from '../appointments.models';

interface AppointmentCardProps {
  appointment: Appointment;
  onAddToCalendar: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

const statusLabels: Record<Appointment['status'], string> = {
  AGUARDANDO_CONFIRMACAO: 'AGUARDANDO CONFIRMAÇÃO',
  CONFIRMADA: 'CONFIRMADO',
  REALIZADA: 'REALIZADA',
  CANCELADA: 'CANCELADA',
  RECUSADA: 'RECUSADA'
};

export function AppointmentCard({
  appointment,
  onAddToCalendar,
  onReschedule,
  onCancel
}: AppointmentCardProps) {
  const confirmed = appointment.status === 'CONFIRMADA' && !appointment.iniciadaEm;
  const pending = appointment.status === 'AGUARDANDO_CONFIRMACAO';
  const canceled = appointment.status === 'CANCELADA' || appointment.status === 'RECUSADA';

  return (
    <View style={sectionCardStyles.superficie}>
      <View style={styles.resumo}>
        <Text style={styles.professionalName}>{appointment.nutricionistaNome}</Text>
        <Text
          style={[
            styles.status,
            pending ? styles.pendingStatus : styles.confirmedStatus,
            canceled && styles.canceledStatus
          ]}
        >
          {appointment.iniciadaEm && appointment.status === 'CONFIRMADA' ? 'EM ATENDIMENTO' : statusLabels[appointment.status]}
        </Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Feather name="calendar" size={16} color={colors.brandDeep} aria-hidden />
          <Text style={styles.detailText}>{appointmentDateLabel(appointment.dataHora)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="clock" size={16} color={colors.brandDeep} aria-hidden />
          <Text style={styles.detailText}>{timeRangeLabel(appointment.dataHora)}</Text>
        </View>
      </View>

      {confirmed ? (
        <>
          <Pressable
            style={({ pressed }) => [styles.calendarButton, pressed && styles.pressed]}
            onPress={() => onAddToCalendar(appointment)}
            accessibilityRole="button"
            accessibilityLabel="Adicionar consulta ao Google Agenda"
          >
            <Text style={styles.calendarButtonText}>Adicionar ao Google Agenda</Text>
            <Feather name="external-link" size={16} color={colors.white} aria-hidden />
          </Pressable>
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
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  resumo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs
  },
  status: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    fontFamily: fontFamily.bold,
    fontSize: 11,
    lineHeight: 16,
    overflow: 'hidden'
  },
  confirmedStatus: {
    backgroundColor: colors.confirmedBackground,
    color: colors.brandDark
  },
  pendingStatus: {
    backgroundColor: colors.pendingBackground,
    color: colors.pending
  },
  canceledStatus: {
    backgroundColor: colors.subtle,
    color: colors.text
  },
  professionalName: {
    flexShrink: 1,
    color: colors.brandDeep,
    fontFamily: fontFamily.extrabold,
    fontSize: 17,
    lineHeight: 24
  },
  details: {
    minHeight: 44,
    backgroundColor: colors.subtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.md,
    rowGap: spacing.xs
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
    lineHeight: 20,
    fontVariant: ['tabular-nums']
  },
  actions: {
    paddingTop: spacing.xxs,
    flexDirection: 'row',
    gap: spacing.sm
  },
  calendarButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.brand,
    borderRadius: radius.md
  },
  calendarButtonText: {
    flexShrink: 1,
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 20
  },
  rescheduleButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.confirmedBackground,
    padding: spacing.xs,
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
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerButtonBackground,
    padding: spacing.xs,
    borderRadius: radius.md
  },
  cancelText: {
    color: colors.dangerText,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 20
  },
  pressed: {
    opacity: 0.75
  }
});
