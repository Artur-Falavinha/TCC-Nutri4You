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

  listarPlanos(pacienteId: number) {
    return this.api.get<Plano[]>(this.caminhoPlanos(pacienteId));
  }

  buscarPlano(pacienteId: number, planoId: number) {
    return this.api.get<Plano>(`${this.caminhoPlanos(pacienteId)}/${planoId}`);
  }

  criarPlano(pacienteId: number, request: PlanoRequest) {
    return this.api.post<Plano>(this.caminhoPlanos(pacienteId), request);
  }

  atualizarPlano(pacienteId: number, planoId: number, request: PlanoRequest) {
    return this.api.put<Plano>(`${this.caminhoPlanos(pacienteId)}/${planoId}`, request);
  }

  excluirRascunho(pacienteId: number, planoId: number, versao: number) {
    return this.api
      .delete<unknown>(`${this.caminhoPlanos(pacienteId)}/${planoId}?versao=${versao}`)
      .pipe(map(() => undefined));
  }

  publicarPlano(pacienteId: number, planoId: number, versao: number) {
    return this.api.post<Plano>(
      `${this.caminhoPlanos(pacienteId)}/${planoId}/publicacao`,
      { versao }
    );
  }

  previsualizarListaCompras(pacienteId: number, planoId: number, dias: number) {
    return this.api.get<ListaCompras>(
      `${this.caminhoPlanos(pacienteId)}/${planoId}/lista-compras`,
      { params: { dias } }
    );
  }

  private caminhoPlanos(pacienteId: number): string {
    return `/gestao-pacientes/${pacienteId}/planos-alimentares`;
  }
}
