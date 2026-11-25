import { DialogoConfirmacao } from '../../../components/feedback/DialogoConfirmacao';
import { appointmentDateLabel } from '../appointments-date.util';
import type { Appointment } from '../appointments.models';

interface CancelAppointmentModalProps {
  appointment: Appointment | null;
  onKeep: () => void;
  onConfirm: () => Promise<void>;
}

export function CancelAppointmentModal({ appointment, onKeep, onConfirm }: CancelAppointmentModalProps) {
  if (!appointment) return null;

  const data = appointmentDateLabel(appointment.dataHora);
  const horario = appointment.dataHora.slice(11, 16);

  return (
    <DialogoConfirmacao
      titulo="Cancelar consulta?"
      descricao={`Sua consulta com ${appointment.nutricionistaNome} em ${data} às ${horario} será cancelada.`}
      icone="calendar"
      fechar={onKeep}
      acoes={[
        { rotulo: 'Manter consulta', variante: 'secundaria', executar: onKeep },
        { rotulo: 'Cancelar consulta', variante: 'perigo', executar: onConfirm, rotuloOcupado: 'Cancelando…' }
      ]}
    />
  );
}