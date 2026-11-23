import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { UsuarioInfo } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { DataHoraClinicaPipe } from '../../shared/pipes/data-hora-clinica.pipe';
import { ClinicoService, ConsultaResumo } from '../clinico/clinico.service';
import { PrivacidadeComponent } from '../privacidade/privacidade.component';

interface PreferenciasNotificacao {
  lembretesConsulta: boolean;
}

const CHAVE_PREFERENCIAS = 'nutri4you.preferencias-notificacao';
const PADRAO: PreferenciasNotificacao = { lembretesConsulta: true };

@Component({
  selector: 'app-configuracoes',
  imports: [RouterLink, DataHoraClinicaPipe, PageHeaderComponent, UiButtonComponent, PrivacidadeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.css'
})
export class ConfiguracoesComponent {
  private readonly auth = inject(AuthService);
  private readonly clinico = inject(ClinicoService);
  private readonly destroyRef = inject(DestroyRef);
  preferencias = this.carregarPreferencias();
  mensagemPreferencia = '';
  erroPreferencia = '';
  readonly consultas = signal<ConsultaResumo[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly conta = signal<UsuarioInfo | null>(null);
  readonly carregandoConta = signal(true);
  readonly erroConta = signal('');
  readonly enviandoSenha = signal(false);
  readonly mensagemSenha = signal('');
  readonly erroSenha = signal('');

  constructor() {
    this.carregarConta();
    if (this.preferencias.lembretesConsulta) this.carregar();
  }

  carregarConta(): void {
    this.carregandoConta.set(true);
    this.erroConta.set('');
    this.auth.fetchMe().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: usuario => { this.conta.set(usuario); this.carregandoConta.set(false); },
      error: () => { this.erroConta.set('Não foi possível carregar seus dados.'); this.carregandoConta.set(false); }
    });
  }

  solicitarRedefinicao(): void {
    const email = this.conta()?.email;
    if (!email || this.enviandoSenha()) return;
    this.enviandoSenha.set(true);
    this.mensagemSenha.set('');
    this.erroSenha.set('');
    this.auth.solicitarRecuperacaoSenha(email).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: mensagem => { this.mensagemSenha.set(mensagem); this.enviandoSenha.set(false); },
      error: () => { this.erroSenha.set('Não foi possível solicitar o link. Tente novamente.'); this.enviandoSenha.set(false); }
    });
  }

  carregar(): void {
    if (this.carregando()) return;
    this.carregando.set(true);
    this.erro.set('');
    this.clinico.agenda().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: agenda => { this.consultas.set(agenda.hoje); this.carregando.set(false); },
      error: () => { this.erro.set('Não foi possível carregar as consultas.'); this.carregando.set(false); }
    });
  }

  atualizarLembretes(evento: Event): void {
    const controle = evento.target as HTMLInputElement;
    const preferencias = { lembretesConsulta: controle.checked };
    this.mensagemPreferencia = '';
    this.erroPreferencia = '';
    try {
      localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
    } catch {
      controle.checked = this.preferencias.lembretesConsulta;
      this.erroPreferencia = 'Não foi possível salvar a preferência neste navegador.';
      return;
    }
    this.preferencias = preferencias;
    this.mensagemPreferencia = 'Preferência salva neste navegador.';
    if (preferencias.lembretesConsulta) this.carregar();
  }

  private carregarPreferencias(): PreferenciasNotificacao {
    try {
      const valor = localStorage.getItem(CHAVE_PREFERENCIAS);
      const salvo: Partial<PreferenciasNotificacao> | null = valor ? JSON.parse(valor) : null;
      return typeof salvo?.lembretesConsulta === 'boolean'
        ? { lembretesConsulta: salvo.lembretesConsulta } : PADRAO;
    } catch {
      return PADRAO;
    }
  }
}
