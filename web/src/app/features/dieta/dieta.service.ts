import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import {
  ListaCompras,
  PaginaAlimentos,
  Plano,
  PlanoRequest
} from './dieta.models';

@Injectable({ providedIn: 'root' })
export class DietaService {
  private readonly api = inject(ApiService);

  listarAlimentos(
    filtros: { nome: string; categoria: string; pagina: number },
    tamanho = 20
  ) {
    const params: Record<string, string | number> = {
      pagina: filtros.pagina,
      tamanho
    };
    const nome = filtros.nome.trim();
    const categoria = filtros.categoria.trim();
    if (nome) params['nome'] = nome;
    if (categoria) params['categoria'] = categoria;
    return this.api.get<PaginaAlimentos>('/alimentos', { params });
  }

  listarCategorias() {
    return this.api.get<string[]>('/alimentos/categorias');
  }

  listarPlanos(pacienteId: number, atendimentoId: number | null = null) {
    return this.api.get<Plano[]>(this.escopo(this.caminhoPlanos(pacienteId), atendimentoId));
  }

  buscarPlano(pacienteId: number, planoId: number, atendimentoId: number | null = null) {
    return this.api.get<Plano>(this.escopo(`${this.caminhoPlanos(pacienteId)}/${planoId}`, atendimentoId));
  }

  criarPlano(pacienteId: number, request: PlanoRequest, atendimentoId: number | null = null) {
    return this.api.post<Plano>(this.escopo(this.caminhoPlanos(pacienteId), atendimentoId), request);
  }

  atualizarPlano(pacienteId: number, planoId: number, request: PlanoRequest, atendimentoId: number | null = null) {
    return this.api.put<Plano>(this.escopo(`${this.caminhoPlanos(pacienteId)}/${planoId}`, atendimentoId), request);
  }

  excluirRascunho(pacienteId: number, planoId: number, versao: number, atendimentoId: number | null = null) {
    return this.api
      .delete<unknown>(this.escopo(`${this.caminhoPlanos(pacienteId)}/${planoId}?versao=${versao}`, atendimentoId))
      .pipe(map(() => undefined));
  }

  publicarPlano(pacienteId: number, planoId: number, versao: number, atendimentoId: number | null = null) {
    return this.api.post<Plano>(
      this.escopo(`${this.caminhoPlanos(pacienteId)}/${planoId}/publicacao`, atendimentoId),
      { versao }
    );
  }

  previsualizarListaCompras(pacienteId: number, planoId: number, dias: number, atendimentoId: number | null = null) {
    return this.api.get<ListaCompras>(
      this.escopo(`${this.caminhoPlanos(pacienteId)}/${planoId}/lista-compras`, atendimentoId),
      { params: { dias } }
    );
  }

  private escopo(path: string, atendimentoId: number | null): string {
    return atendimentoId === null ? path : `${path}${path.includes('?') ? '&' : '?'}atendimentoId=${atendimentoId}`;
  }

  private caminhoPlanos(pacienteId: number): string {
    return `/gestao-pacientes/${pacienteId}/planos-alimentares`;
  }
}
