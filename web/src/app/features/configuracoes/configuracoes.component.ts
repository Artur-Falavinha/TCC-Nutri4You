import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioInfo } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { PrivacidadeComponent } from '../privacidade/privacidade.component';
import { FotoPerfilComponent } from './foto-perfil.component';
import { PerfilContaComponent } from './perfil-conta.component';
import { PreferenciasEmailAgendaService } from './preferencias-email-agenda.service';

@Component({
  selector: 'app-configuracoes',
  imports: [RouterLink, PageHeaderComponent, UiButtonComponent, PrivacidadeComponent, FotoPerfilComponent, PerfilContaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.css'
})
export class ConfiguracoesComponent {
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly preferenciasEmail = inject(PreferenciasEmailAgendaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly privacidade = viewChild(PrivacidadeComponent);
  readonly notificacoesAtivas = signal<boolean | null>(null);
  readonly carregandoPreferencia = signal(false);
  readonly salvandoPreferencia = signal(false);
  readonly conta = signal<UsuarioInfo | null>(null);
  readonly carregandoConta = signal(true);
  readonly erroConta = signal('');
  readonly enviandoSenha = signal(false);

  constructor() {
    this.carregarConta();
    this.carregarPreferencia();
  }

  carregarConta(): void {
    this.carregandoConta.set(true);
    this.erroConta.set('');
    this.auth.fetchMe().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: usuario => { this.conta.set(usuario); this.carregandoConta.set(false); },
      error: () => { this.erroConta.set('Não foi possível carregar seus dados.'); this.carregandoConta.set(false); }
    });
  }

  atualizarConta(dados: { nome?: string; email?: string; reaceitouTermos?: boolean }): void {
    this.conta.update(conta => conta
      ? { ...conta, nome: dados.nome ?? conta.nome, email: dados.email ?? conta.email } : null);
    const usuario = this.conta();
    if (usuario) this.auth.atualizarUsuario(usuario);
    if (dados.reaceitouTermos) this.privacidade()?.carregarAceite();
  }

  solicitarRedefinicao(): void {
    const email = this.conta()?.email;
    if (!email || this.enviandoSenha()) return;
    this.enviandoSenha.set(true);
    this.auth.solicitarRecuperacaoSenha(email).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: mensagem => { this.toast.sucesso(mensagem); this.enviandoSenha.set(false); },
      error: () => { this.toast.erro('Não foi possível solicitar o link. Tente novamente.'); this.enviandoSenha.set(false); }
    });
  }

  carregarPreferencia(): void {
    if (this.carregandoPreferencia()) return;
    this.carregandoPreferencia.set(true);
    this.preferenciasEmail.buscar()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoPreferencia.set(false)))
      .subscribe({
        next: preferencia => this.notificacoesAtivas.set(preferencia.ativa),
        error: () => this.notificacoesAtivas.set(null)
      });
  }

  salvarPreferencia(controle: HTMLInputElement): void {
    const anterior = this.notificacoesAtivas();
    if (anterior === null || this.salvandoPreferencia()) return;

    const ativa = controle.checked;
    this.notificacoesAtivas.set(ativa);
    this.salvandoPreferencia.set(true);
    this.preferenciasEmail.salvar(ativa)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvandoPreferencia.set(false)))
      .subscribe({
        next: preferencia => {
          this.notificacoesAtivas.set(preferencia.ativa);
          this.toast.sucesso(preferencia.ativa ? 'Notificações por e-mail ativadas.' : 'Notificações por e-mail desativadas.');
        },
        error: () => {
          this.notificacoesAtivas.set(anterior);
          controle.checked = anterior;
          this.toast.erro('Não foi possível salvar a preferência de e-mail. Tente novamente.');
        }
      });
  }
}
