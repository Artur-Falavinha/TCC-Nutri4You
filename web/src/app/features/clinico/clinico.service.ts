import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface Avaliacao {
  id: number;
  dataAvaliacao: string;
  peso: number;
  altura: number;
  imc: number;
  razaoCinturaQuadril: number | null;
}

export interface ConsultaResumo {
  id: number;
  pacienteNome: string;
  dataHora: string;
}

export interface Historico {
  consultas: ConsultaResumo[];
  avaliacoes: Avaliacao[];
}

export interface Contagem {
  rotulo: string;
  quantidade: number;
}

export interface Agenda {
  hoje: ConsultaResumo[];
  semana: Contagem[];
  totalSemana: number;
  sexo: Contagem[];
  faixaEtaria: Contagem[];
  ultimos12Meses: Contagem[];
  totalConsultas12Meses: number;
}

@Injectable({ providedIn: 'root' })
export class ClinicoService {
  private readonly api = inject(ApiService);

  agenda() {
    return this.api.get<Agenda>('/dashboard/consultas');
  }

  historico(pacienteId: number) {
    return this.api.get<Historico>(`/gestao-pacientes/${pacienteId}/historico`);
  }

  registrar(pacienteId: number, body: Record<string, number>) {
    return this.api.post<Avaliacao>(`/gestao-pacientes/${pacienteId}/avaliacoes`, body);
  }
}
