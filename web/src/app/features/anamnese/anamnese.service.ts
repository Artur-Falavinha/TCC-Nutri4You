import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Anamnese, AnamneseField, Answers, Patient } from './anamnese.models';

@Injectable({ providedIn: 'root' })
export class AnamneseService {
  private readonly api = inject(ApiService);
  fields() { return this.api.get<AnamneseField[]>('/gestao-pacientes/anamnese/campos'); }
  patients() { return this.api.get<Patient[]>('/gestao-pacientes'); }
  user() { return this.api.get<{ nome: string }>('/usuarios/me'); }
  get(id: number) { return this.api.get<Anamnese>(`/gestao-pacientes/${id}/anamnese`); }
  save(id: number, versao: number | null, respostas: Answers, draft: boolean) {
    return this.api.put<Anamnese>(`/gestao-pacientes/${id}/anamnese${draft ? '/rascunho' : ''}`,
      { versao, respostas });
  }
  discard(id: number, version: number) {
    return this.api.delete<Anamnese>(`/gestao-pacientes/${id}/anamnese/rascunho?versao=${version}`);
  }
}
