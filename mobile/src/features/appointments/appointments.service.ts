import { apiClient } from '../../core/api/api-client';
import {
  Appointment,
  AppointmentAvailability,
  RescheduleAppointmentPayload,
  ScheduleAppointmentPayload
} from './appointments.models';

export function listAppointments(): Promise<Appointment[]> {
  return apiClient.get<Appointment[]>('/agenda/consultas');
}

export function getAppointmentAvailability(
  nutricionistaId: number,
  data: string
): Promise<AppointmentAvailability> {
  const params = new URLSearchParams({ nutricionistaId: String(nutricionistaId), data });
  return apiClient.get<AppointmentAvailability>(`/agenda/disponibilidade?${params.toString()}`);
}

export function scheduleAppointment(payload: ScheduleAppointmentPayload): Promise<Appointment> {
  return apiClient.post<Appointment>('/agenda/consultas', payload);
}

export function rescheduleAppointment(
  appointmentId: number,
  payload: RescheduleAppointmentPayload
): Promise<Appointment> {
  return apiClient.put<Appointment>(`/agenda/consultas/${appointmentId}/reagendamento`, payload);
}

export function cancelAppointment(appointmentId: number, versao: number): Promise<Appointment> {
  return apiClient.post<Appointment>(`/agenda/consultas/${appointmentId}/cancelamento`, {
    versao
  });
}
