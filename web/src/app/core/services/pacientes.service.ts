import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { Paciente } from '../models/paciente.models';

export interface CriarPacientePayload {
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
  sexo?: string;
}

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private readonly api = inject(ApiService);

  /** Retorna a lista de pacientes vinculados ao nutricionista autenticado. */
  listarPacientes(): Observable<Paciente[]> {
    return this.api.get<Paciente[]>('/gestao-pacientes');
  }

  /** Cria um novo paciente. Retorna o paciente criado (201 Created). */
  criarPaciente(payload: CriarPacientePayload): Observable<Paciente> {
    return this.api.post<Paciente>('/pacientes', payload);
  }

  /** Inativa um paciente de forma lógica (HTTP 204). */
  inativarPaciente(id: number): Observable<void> {
    return this.api.patch<void>(`/pacientes/${id}/inativar`, {});
  }

  /** Reativa um paciente inativado logicamente (HTTP 200). */
  reativarPaciente(id: number): Observable<Paciente> {
    return this.api.patch<Paciente>(`/pacientes/${id}/reativar`, {});
  }
}

