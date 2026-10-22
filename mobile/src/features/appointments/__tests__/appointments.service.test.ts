import { apiClient } from '../../../core/api/api-client';
import {
  cancelAppointment,
  getAppointmentAvailability,
  listAppointments,
  rescheduleAppointment,
  scheduleAppointment
} from '../appointments.service';

describe('appointments service', () => {
  it('usa os endpoints da agenda do paciente', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([]).mockResolvedValueOnce({});
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue({});
    const put = jest.spyOn(apiClient, 'put').mockResolvedValue({});

    await listAppointments();
    await getAppointmentAvailability(7, '2026-10-22');
    await scheduleAppointment({ nutricionistaId: 7, dataHora: '2026-10-22T10:15:00' });
    await rescheduleAppointment(12, { dataHora: '2026-10-23T14:00:00', versao: 2 });
    await cancelAppointment(12, 3);

    expect(get).toHaveBeenNthCalledWith(1, '/agenda/consultas');
    expect(get).toHaveBeenNthCalledWith(
      2,
      '/agenda/disponibilidade?nutricionistaId=7&data=2026-10-22'
    );
    expect(post).toHaveBeenNthCalledWith(1, '/agenda/consultas', {
      nutricionistaId: 7,
      dataHora: '2026-10-22T10:15:00'
    });
    expect(put).toHaveBeenCalledWith('/agenda/consultas/12/reagendamento', {
      dataHora: '2026-10-23T14:00:00',
      versao: 2
    });
    expect(post).toHaveBeenNthCalledWith(2, '/agenda/consultas/12/cancelamento', {
      versao: 3
    });
  });
});
