import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';

export interface Exame {
  id: number; nome: string; descricao: string | null; status: 'PENDENTE' | 'ENVIADO' | 'ANALISADO';
  dataSolicitacao: string; dataEnvio: string | null; arquivoNome: string | null; parecer: string | null; versao: number; possuiArquivo: boolean;
}
export interface PaginaExames { itens: Exame[]; pagina: number; totalPaginas: number; total: number }
@Injectable({ providedIn: 'root' })
export class ExamesService {
  private readonly http = inject(HttpClient);
  private params(atendimentoId: number | null): HttpParams {
    return atendimentoId === null ? new HttpParams() : new HttpParams().set('atendimentoId', atendimentoId);
  }
  private url(pacienteId: number): string { return `${environment.apiBaseUrl}/gestao-pacientes/${pacienteId}/exames`; }
  listar(id: number, pagina: number, atendimentoId: number | null = null) { return this.http.get<ApiResponse<PaginaExames>>(this.url(id), { params: this.params(atendimentoId).set('pagina', pagina) }).pipe(map(r => r.data)); }
  solicitar(id: number, nome: string, descricao: string, atendimentoId: number | null = null) { return this.http.post<ApiResponse<Exame>>(this.url(id), { nome, descricao }, { params: this.params(atendimentoId) }).pipe(map(r => r.data)); }
  analisar(id: number, exame: Exame, parecer: string, atendimentoId: number | null = null) { return this.http.post<ApiResponse<Exame>>(`${this.url(id)}/${exame.id}/analise`, { parecer, versao: exame.versao }, { params: this.params(atendimentoId) }).pipe(map(r => r.data)); }
  arquivo(id: number, exameId: number, atendimentoId: number | null = null) { return this.http.get(`${this.url(id)}/${exameId}/arquivo`, { responseType: 'blob', params: this.params(atendimentoId) }); }
}
