import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AlimentoTaco,
  AlimentosPaginados,
  ListaComprasResponse,
  PlanoAlimentarPayload,
  PlanoAlimentarResponse
} from './dieta.models';

@Injectable({ providedIn: 'root' })
export class DietaService {
  private readonly api = inject(ApiService);

  private planosPath(pacienteId: number): string {
    return `/gestao-pacientes/${pacienteId}/planos`;
  }

  buscarAlimentos(
    busca = '',
    categoria = '',
    pagina = 0,
    tamanho = 30
  ): Observable<AlimentosPaginados> {
    const params: Record<string, string | number> = { pagina, tamanho };
    if (busca.trim()) {
      params['busca'] = busca.trim();
    }
    if (categoria.trim()) {
      params['categoria'] = categoria.trim();
    }
    return this.api.get<AlimentosPaginados>('/alimentos', { params });
  }

  listarCategorias(): Observable<string[]> {
    return this.api.get<string[]>('/alimentos/categorias');
  }

  buscarAlimentoPorId(id: number): Observable<AlimentoTaco> {
    return this.api.get<AlimentoTaco>(`/alimentos/${id}`);
  }

  listarPlanos(pacienteId: number): Observable<PlanoAlimentarResponse[]> {
    return this.api.get<PlanoAlimentarResponse[]>(this.planosPath(pacienteId));
  }

  buscarDietaAtiva(pacienteId: number): Observable<PlanoAlimentarResponse | null> {
    return this.api.get<PlanoAlimentarResponse | null>(`${this.planosPath(pacienteId)}/ativa`);
  }

  buscarPlano(pacienteId: number, planoId: number): Observable<PlanoAlimentarResponse> {
    return this.api.get<PlanoAlimentarResponse>(`${this.planosPath(pacienteId)}/${planoId}`);
  }

  salvarPlano(
    pacienteId: number,
    planoId: number | null,
    payload: PlanoAlimentarPayload
  ): Observable<PlanoAlimentarResponse> {
    if (planoId === null) {
      return this.api.post<PlanoAlimentarResponse>(this.planosPath(pacienteId), payload);
    }
    return this.api.put<PlanoAlimentarResponse>(`${this.planosPath(pacienteId)}/${planoId}`, payload);
  }

  publicarPlano(pacienteId: number, planoId: number): Observable<PlanoAlimentarResponse> {
    return this.api.post<PlanoAlimentarResponse>(
      `${this.planosPath(pacienteId)}/${planoId}/publicar`,
      {}
    );
  }

  gerarOuBuscarListaCompras(
    pacienteId: number,
    idPlano?: number
  ): Observable<ListaComprasResponse> {
    const sufixo = idPlano !== undefined && idPlano !== null ? `?idPlano=${idPlano}` : '';
    return this.api.post<ListaComprasResponse>(
      `/gestao-pacientes/${pacienteId}/listas-compras${sufixo}`,
      {}
    );
  }
}

