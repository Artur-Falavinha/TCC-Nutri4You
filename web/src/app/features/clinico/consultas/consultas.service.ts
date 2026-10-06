import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface MedidasConsulta {
  peso: number | null;
  altura: number | null;
  percentualGordura: number | null;
  massaMuscularKg: number | null;
  pregaBicipital: number | null;
  pregaTricipital: number | null;
  pregaSubescapular: number | null;
  pregaSuprailiaca: number | null;
  circunferenciaCintura: number | null;
  circunferenciaQuadril: number | null;
  circunferenciaBraco: number | null;
}

export interface ConsultaPayload {
  dataHora: string;
  status: string;
  observacao: string;
  avaliacao: MedidasConsulta | null;
  versao: number | null;
}

export interface Consulta extends Omit<ConsultaPayload, 'avaliacao' | 'versao' | 'observacao'> {
  id: number;
  idPaciente: number;
  observacao: string | null;
  versao: number;
  avaliacao: (MedidasConsulta & { id: number; imc: number }) | null;
}

export interface PaginaConsultas {
  itens: Consulta[];
  pagina: number;
  totalPaginas: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ConsultasService {
  private readonly api = inject(ApiService);
  private path(pacienteId: number) { return `/gestao-pacientes/${pacienteId}/consultas`; }

  listar(pacienteId: number, pagina = 0) {
    return this.api.get<PaginaConsultas>(this.path(pacienteId), { params: { pagina } });
  }
  buscar(pacienteId: number, id: number) {
    return this.api.get<Consulta>(`${this.path(pacienteId)}/${id}`);
  }
  salvar(pacienteId: number, id: number | null, payload: ConsultaPayload) {
    return id === null ? this.api.post<Consulta>(this.path(pacienteId), payload)
      : this.api.put<Consulta>(`${this.path(pacienteId)}/${id}`, payload);
  }
}
