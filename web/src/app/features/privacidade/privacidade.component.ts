import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';

export const VERSAO_TERMOS = '2026-11-22';
export const URL_TERMOS = `${environment.apiBaseUrl}/privacidade/termos`;
interface Aceite { versao: string; aceito: boolean; aceitoEm: string | null }

@Component({
  selector: 'app-privacidade',
  templateUrl: './privacidade.component.html',
  styleUrl: './privacidade.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacidadeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly urlTermos = URL_TERMOS;
  readonly aceite = signal<Aceite | null>(null);
  readonly erro = signal('');

  formatarVersao(versao: string): string {
    const partes = /^(\d{4})-(\d{2})-(\d{2})(?:\.(\d+))?$/.exec(versao);
    if (!partes) return versao;
    const [, ano, mes, dia, revisao] = partes;
    return `${dia}/${mes}/${ano}${revisao ? ` (revisão ${revisao})` : ''}`;
  }

  formatarDataAceite(valor: string): string {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(data);
  }

  ngOnInit(): void {
    this.carregarAceite();
  }

  carregarAceite(): void {
    this.erro.set('');
    this.api.get<Aceite>('/privacidade/me/termos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: aceite => this.aceite.set(aceite),
      error: () => this.erro.set('Não foi possível consultar o aceite dos termos.')
    });
  }

}
