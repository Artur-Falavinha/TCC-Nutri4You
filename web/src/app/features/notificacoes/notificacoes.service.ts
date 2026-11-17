import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface NotificacaoConsulta {
  id: number;
  pacienteId: number;
  pacienteNome: string;
  dataHora: string;
  versao: number;
  avulsa: boolean;
}

export interface NotificacaoVinculo { id: number; pacienteNome: string; versao: number }

@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private readonly api = inject(ApiService);
  private readonly path = '/agenda-nutricionista/notificacoes';

  listar() { return this.api.get<NotificacaoConsulta[]>(this.path); }
  listarVinculos() { return this.api.get<NotificacaoVinculo[]>(`${this.path}/vinculos`); }
  decidirVinculo(item: NotificacaoVinculo, aceitar: boolean) {
    return this.api.post<void>(`${this.path}/vinculos/${item.id}/decisao`, { aceitar, versao: item.versao });
  }
  decidir(item: NotificacaoConsulta, aceitar: boolean) {
    return this.api.post<void>(`${this.path}/${item.id}/decisao`, { aceitar, versao: item.versao });
  }
}
