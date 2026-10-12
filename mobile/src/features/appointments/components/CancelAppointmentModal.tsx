import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import CancelCalendarIcon from '../../../assets/appointments/cancel-calendar.svg';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';
import { appointmentLongDateLabel } from '../appointments-date.util';
import { Appointment } from '../appointments.models';

interface CancelAppointmentModalProps {
  appointment: Appointment | null;
  loading: boolean;
  onKeep: () => void;
  onConfirm: () => void;
}

export function CancelAppointmentModal({
  appointment,
  loading,
  onKeep,
  onConfirm
}: CancelAppointmentModalProps) {
  return (
    <Modal
      visible={appointment !== null}
      transparent
      animationType="fade"
      onRequestClose={onKeep}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modal} accessibilityRole="alert">
          <View style={styles.iconBackground}>
            <CancelCalendarIcon />
          </View>

          <Text style={styles.title}>Cancelar Consulta?</Text>
          {appointment ? (
            <Text style={styles.message}>
              Tem certeza que deseja cancelar sua consulta com a{' '}
              <Text style={styles.emphasis}>{appointment.nutricionistaNome}</Text> no dia{' '}
              <Text style={styles.emphasis}>
                {appointmentLongDateLabel(appointment.dataHora)}
              </Text>
              ?
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}
              onPress={onKeep}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.keepText}>Manter Consulta</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
              onPress={onConfirm}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={colors.dangerText} />
              ) : (
                <Text style={styles.confirmText}>Confirmar Cancelamento</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md
  },
  modal: {
    width: '100%',
    maxWidth: 384,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerBackground,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    paddingTop: spacing.sm,
    color: colors.text,
    fontFamily: fontFamily.extrabold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.6,
    textAlign: 'center'
  },
  message: {
    color: '#3f4a3d',
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center'
  },
  emphasis: {
    color: '#1a1c1c',
    fontFamily: fontFamily.bold
  },
  actions: {
    width: '100%',
    paddingTop: spacing.lg,
    gap: spacing.sm
  },
  keepButton: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center'
  },
  keepText: {
    color: colors.brandButtonText,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 24
  },
  confirmButton: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.dangerButtonBackground,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmText: {
    color: colors.dangerText,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 24
  },
  pressed: {
    opacity: 0.75
  }
});
