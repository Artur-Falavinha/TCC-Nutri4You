import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export type TipoNotificacaoConsulta = 'PRIMEIRA_CONSULTA' | 'ACOMPANHAMENTO' | 'REAGENDAMENTO' | 'CONSULTA';

export interface NotificacaoConsulta {
  id: number;
  pacienteId: number;
  pacienteNome: string;
  dataHora: string;
  versao: number;
  avulsa: boolean;
  tipo: TipoNotificacaoConsulta;
  duracaoMinutos: number;
}

export interface NotificacaoVinculo { id: number; pacienteNome: string; versao: number }

export interface NotificacaoResultadoExame {
  id: number;
  pacienteId: number;
  pacienteNome: string;
  atendimentoId: number | null;
  exameNome: string;
  criadaEm: string;
}

interface NotificacoesPendentes {
  consultas: NotificacaoConsulta[];
  vinculos: NotificacaoVinculo[];
  resultados: NotificacaoResultadoExame[];
}

@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private readonly api = inject(ApiService);
  private readonly path = '/agenda-nutricionista/notificacoes';

  listar() { return this.api.get<NotificacaoConsulta[]>(this.path); }
  listarVinculos() { return this.api.get<NotificacaoVinculo[]>(`${this.path}/vinculos`); }
  listarResultados() { return this.api.get<NotificacaoResultadoExame[]>(`${this.path}/exames`); }

  listarPendentes() {
    return forkJoin({ consultas: this.listar(), vinculos: this.listarVinculos(), resultados: this.listarResultados() });
  }

  contarNaoVistas(usuarioId: number, pendentes: NotificacoesPendentes): number {
    const vistas = this.lerVistas(usuarioId);
    return this.chaves(pendentes).filter(chave => !vistas.has(chave)).length;
  }

  marcarComoVistas(usuarioId: number, pendentes: NotificacoesPendentes): void {
    const vistas = this.lerVistas(usuarioId);
    const todas = new Set([...vistas, ...this.chaves(pendentes)]);
    if (todas.size === vistas.size) return;
    try {
      localStorage.setItem(this.chaveArmazenamento(usuarioId), JSON.stringify([...todas]));
    } catch {
      // O armazenamento indisponível não impede a decisão sobre as solicitações.
    }
  }

  decidirVinculo(item: NotificacaoVinculo, aceitar: boolean) {
    return this.api.post<void>(`${this.path}/vinculos/${item.id}/decisao`, { aceitar, versao: item.versao });
  }
  decidir(item: NotificacaoConsulta, aceitar: boolean) {
    return this.api.post<void>(`${this.path}/${item.id}/decisao`, { aceitar, versao: item.versao });
  }

  private chaves({ consultas, vinculos, resultados }: NotificacoesPendentes): string[] {
    return [
      ...consultas.map(({ id, versao }) => `consulta:${id}:${versao}`),
      ...vinculos.map(({ id, versao }) => `vinculo:${id}:${versao}`),
      ...resultados.map(({ id }) => `exame:${id}`)
    ];
  }

  private lerVistas(usuarioId: number): Set<string> {
    try {
      const valor: unknown = JSON.parse(localStorage.getItem(this.chaveArmazenamento(usuarioId)) ?? '[]');
      return new Set(Array.isArray(valor) ? valor.filter(chave => typeof chave === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private chaveArmazenamento(usuarioId: number): string {
    return `nutri4you.notificacoes.vistas.${usuarioId}`;
  }
}
