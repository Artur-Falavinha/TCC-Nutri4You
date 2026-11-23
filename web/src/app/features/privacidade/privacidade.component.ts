import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';

export const VERSAO_TERMOS = '2026-11-19';
export const URL_TERMOS = `${environment.apiBaseUrl}/privacidade/termos`;
interface Aceite { versao: string; aceito: boolean; aceitoEm: string | null }

@Component({
  selector: 'app-privacidade',
  template: `
    <section class="card" aria-labelledby="privacidade-titulo">
      <div class="section-heading"><span class="icon" aria-hidden="true"><i class="ph ph-shield-check"></i></span>
        <div><h2 id="privacidade-titulo">Privacidade</h2><p>Consulte os termos e veja como exercer seus direitos.</p></div>
      </div>
      <a class="terms-link" [href]="urlTermos" target="_blank" rel="noopener"><i class="ph ph-file-pdf" aria-hidden="true"></i> Ler termos e aviso de privacidade (PDF)</a>
      @if (aceite; as termos) {
        @if (!termos.aceito) {
          <p>Depois de ler os termos, registre seu aceite.</p>
          <button class="secondary" type="button" [disabled]="ocupado" (click)="aceitar(termos)">Li e aceito os termos</button>
        } @else {
          <p>Termos aceitos - versão {{ formatarVersao(termos.versao) }}.</p>
          @if (termos.aceitoEm && formatarDataAceite(termos.aceitoEm); as data) { <p>Aceito em {{ data }}.</p> }
        }
      }
      <p>O canal de privacidade do Nutri4U está sendo definido.</p>
      <a class="terms-link" href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares" target="_blank" rel="noopener">Orientações da ANPD para titulares <i class="ph ph-arrow-square-out" aria-hidden="true"></i></a>
      @if (mensagem) { <p class="message" role="status">{{ mensagem }}</p> }
    </section>
  `,
  styles: `
    :host { display:block; margin-top:24px; } .card { padding:28px; background:var(--color-surface-card, #fff); border:1px solid var(--color-border-default, #dbe4dc); border-radius:var(--radius-lg, 16px); }
    .section-heading { display:flex; gap:16px; align-items:flex-start; margin-bottom:16px; } .icon { display:grid; place-items:center; width:44px; height:44px; flex:none; border-radius:12px; color:#006f1e; background:#eaf4ed; font-size:23px; }
    h2 { margin:0 0 6px; font-size:21px; } p { color:var(--color-text-secondary, #64748b); line-height:1.5; } .section-heading p { margin:0; }
    a { color:#006f1e; font-weight:700; } .terms-link { display:inline-flex; align-items:center; gap:8px; text-decoration:none; min-height:44px; }
    button { min-height:44px; padding:10px 18px; border-radius:8px; font:inherit; font-weight:700; cursor:pointer; } button:disabled { opacity:.5; cursor:not-allowed; }
    .secondary { background:white; color:#006f1e; border:1px solid #cbd5d0; } button:focus-visible,a:focus-visible { outline:3px solid #76a785; outline-offset:3px; } .message { color:#b42318; }
    @media(max-width:600px) { .card { padding:20px; } }
  `
})
export class PrivacidadeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly urlTermos = URL_TERMOS;
  aceite: Aceite | null = null;
  ocupado = false;
  mensagem = '';

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

  ngOnInit() {
    this.api.get<Aceite>('/privacidade/me/termos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: aceite => { this.aceite = aceite; this.changeDetector.markForCheck(); },
      error: () => { this.mensagem = 'Não foi possível consultar o aceite dos termos.'; this.changeDetector.markForCheck(); }
    });
  }

  aceitar(termos: Aceite) {
    this.ocupado = true;
    this.mensagem = '';
    this.api.post<Aceite>('/privacidade/me/termos', { versao: termos.versao, aceito: true })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { this.ocupado = false; this.changeDetector.markForCheck(); }))
      .subscribe({
        next: aceite => { this.aceite = aceite; },
        error: () => { this.mensagem = 'Não foi possível registrar o aceite. Tente novamente.'; }
      });
  }
}
