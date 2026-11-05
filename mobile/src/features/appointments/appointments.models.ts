export type AppointmentStatus =
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CONFIRMADA'
  | 'REALIZADA'
  | 'CANCELADA';

export interface Appointment {
  id: number;
  nutricionistaId: number;
  nutricionistaNome: string;
  dataHora: string;
  status: AppointmentStatus;
  versao: number;
  iniciadaEm?: string | null;
}

export interface AppointmentAvailability {
  nutricionistaId: number;
  nutricionistaNome: string;
  especialidade: string;
  duracaoMinutos: number;
  data: string;
  horarios: string[];
}

export interface ScheduleAppointmentPayload {
  nutricionistaId: number;
  dataHora: string;
}

export interface RescheduleAppointmentPayload {
  dataHora: string;
  versao: number;
}
