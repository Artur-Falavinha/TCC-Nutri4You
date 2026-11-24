import { Injectable, inject } from '@angular/core';

import { ApiService } from '../../core/services/api.service';

interface PreferenciaEmailAgenda {
  ativa: boolean;
}

@Injectable({ providedIn: 'root' })
export class PreferenciasEmailAgendaService {
  private readonly api = inject(ApiService);
  private readonly rota = '/agenda-nutricionista/preferencias/notificacoes-email';

  buscar() {
    return this.api.get<PreferenciaEmailAgenda>(this.rota);
  }

  salvar(ativa: boolean) {
    return this.api.put<PreferenciaEmailAgenda>(this.rota, { ativa });
  }
}
