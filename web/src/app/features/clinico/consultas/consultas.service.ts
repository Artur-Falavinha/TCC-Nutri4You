import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface MedidasConsulta {
  peso: number | null;
  altura: number | null;
  percentualGordura: number | null;
  massaMagraKg?: number | null;
  massaGordaKg?: number | null;
  massaMuscularKg: number | null;
  pregaBicipital: number | null;
  pregaPeitoral?: number | null;
  pregaAxilarMedia?: number | null;
  pregaTricipital: number | null;
  pregaSubescapular: number | null;
  pregaAbdominal?: number | null;
  pregaSuprailiaca: number | null;
  pregaCoxa?: number | null;
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
  iniciadaEm?: string | null;
  inicioPermitidoDe?: string;
  inicioPermitidoAte?: string;
  podeIniciar?: boolean;
  contextoClinico?: {
    dataNascimento: string | null;
    sexo: string | null;
    anamneseFinalizada: Record<string, unknown> | null;
  } | null;
  observacao: string | null;
  versao: number;
  avaliacao: (MedidasConsulta & { id: number; imc: number; somaSetePregas?: number | null; metodoPercentualGordura?: string | null }) | null;
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
  acao(pacienteId: number, c: Consulta, acao: 'inicio' | 'confirmacao' | 'cancelamento') {
    return this.api.post<Consulta>(`${this.path(pacienteId)}/${c.id}/${acao}`, { versao: c.versao });
  }
  salvar(pacienteId: number, id: number | null, payload: ConsultaPayload) {
    return id === null ? this.api.post<Consulta>(this.path(pacienteId), payload)
      : this.api.put<Consulta>(`${this.path(pacienteId)}/${id}`, payload);
  }
}

export interface AtendimentoClinico extends Consulta {
  pacienteNome: string;
  pacienteId: number | null;
  janelaInicio: string;
  janelaFim: string;
}

@Injectable({ providedIn: 'root' })
export class AtendimentosService {
  private readonly api = inject(ApiService);
  private readonly path = '/agenda-nutricionista/atendimentos';
  listar() { return this.api.get<AtendimentoClinico[]>(this.path); }
  buscar(id: number) { return this.api.get<AtendimentoClinico>(`${this.path}/${id}`); }
  iniciar(c: AtendimentoClinico) { return this.api.post<AtendimentoClinico>(`${this.path}/${c.id}/inicio`, { versao: c.versao }); }
  cancelar(c: AtendimentoClinico) { return this.api.post<void>(`${this.path}/${c.id}/cancelamento`, { versao: c.versao }); }
  salvar(id: number, payload: ConsultaPayload) { return this.api.put<AtendimentoClinico>(`${this.path}/${id}`, payload); }
}
