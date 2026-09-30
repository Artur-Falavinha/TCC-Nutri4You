import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from './api.service';
import { Paciente, PacienteResumo } from '../models/paciente.models';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private readonly api = inject(ApiService);

  /** Pacientes visíveis ao nutricionista: relação ativa ou consulta. */
  listarPacientes(): Observable<Paciente[]> {
    return this.api.get<Paciente[]>('/gestao-pacientes');
  }

  /** Busca um paciente já cadastrado por exatamente um critério. */
  buscarPaciente(criterio: { email?: string; cpf?: string }): Observable<PacienteResumo> {
    const params: Record<string, string> = {};
    if (criterio.email) {
      params['email'] = criterio.email;
    }
    if (criterio.cpf) {
      params['cpf'] = criterio.cpf;
    }
    return this.api.get<PacienteResumo>('/gestao-pacientes/busca', { params });
  }

  buscarPorId(id: number): Observable<Paciente> {
    return this.api.get<Paciente>(`/gestao-pacientes/${id}`);
  }

  vincularPaciente(id: number): Observable<void> {
    return this.api
      .post<unknown>(`/gestao-pacientes/${id}/vincular`, {})
      .pipe(map(() => undefined));
  }

  desvincularPaciente(id: number): Observable<void> {
    return this.api
      .delete<unknown>(`/gestao-pacientes/${id}/relacao`)
      .pipe(map(() => undefined));
  }
}
