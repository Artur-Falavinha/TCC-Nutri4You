import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { UsuarioInfo } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { ClinicoService, ConsultaResumo } from '../clinico/clinico.service';

interface PreferenciasNotificacao {
  lembretesConsulta: boolean;
}

const CHAVE_PREFERENCIAS = 'nutri4you.preferencias-notificacao';
const PADRAO: PreferenciasNotificacao = { lembretesConsulta: true };

@Component({
  selector: 'app-configuracoes',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="settings">
      <header class="page-header">
        <div><p class="eyebrow">Sua conta</p><h1>Configurações</h1></div>
        <a routerLink="/dashboard">Voltar ao dashboard</a>
      </header>

      <section class="card" aria-labelledby="account-title">
        <div class="section-heading">
          <span class="icon" aria-hidden="true"><i class="ph ph-user-circle"></i></span>
          <div><h2 id="account-title">Dados da conta</h2><p>Informações do seu acesso profissional.</p></div>
        </div>
        @if (carregandoConta()) { <p role="status">Carregando seus dados...</p> }
        @else if (erroConta()) {
          <p role="alert">{{ erroConta() }}</p>
          <button class="secondary-action" type="button" (click)="carregarConta()">Tentar novamente</button>
        }
        @else {
          @if (conta(); as usuario) {
            <dl class="account-details">
              <div><dt>Nome</dt><dd>{{ usuario.nome }}</dd></div>
              <div><dt>E-mail</dt><dd>{{ usuario.email }}</dd></div>
              <div><dt>Perfil</dt><dd>Nutricionista</dd></div>
            </dl>
          }
        }
      </section>

      <section class="card" aria-labelledby="access-title">
        <div class="section-heading">
          <span class="icon" aria-hidden="true"><i class="ph ph-lock-key"></i></span>
          <div><h2 id="access-title">Acesso e agenda</h2><p>Gerencie sua senha e disponibilidade.</p></div>
        </div>
        <div class="action-row"><span><strong>Senha da conta</strong><small>Receba um link de redefinição no e-mail da sua conta.</small></span><button class="secondary-action" type="button" (click)="solicitarRedefinicao()" [disabled]="!conta() || enviandoSenha()">{{ enviandoSenha() ? 'Enviando...' : 'Enviar link' }}</button></div>
        @if (mensagemSenha()) { <p role="status" aria-live="polite">{{ mensagemSenha() }}</p> }
        @if (erroSenha()) { <p role="alert">{{ erroSenha() }}</p> }
        <div class="action-row"><span><strong>Horários de atendimento</strong><small>Defina os horários em que pacientes podem solicitar consultas.</small></span><a routerLink="/agenda">Editar horários</a></div>
      </section>

      <section class="card" id="notificacoes" aria-labelledby="notifications-title">
        <div class="section-heading">
          <span class="icon" aria-hidden="true"><i class="ph ph-bell-ringing"></i></span>
          <div><h2 id="notifications-title">Notificações</h2>
            <p>Acompanhe as consultas de hoje neste dispositivo.</p></div>
        </div>

        <label class="setting-row">
          <span><strong>Lembretes de consulta</strong><small>Mostrar as consultas de hoje nesta página.</small></span>
          <input type="checkbox" [checked]="preferencias.lembretesConsulta" (change)="atualizar('lembretesConsulta', $event)" aria-label="Lembretes de consulta" />
        </label>
        <p class="saved" role="status" aria-live="polite">{{ mensagem }}</p>
        <div class="inbox" aria-live="polite">
          <div class="inbox-heading"><h3>Consultas de hoje</h3><button type="button" (click)="carregar()" [disabled]="carregando()">Atualizar</button></div>
          @if (!preferencias.lembretesConsulta) { <p>Os lembretes estão desativados neste navegador.</p> }
          @else if (carregando()) { <p role="status">Carregando consultas...</p> }
          @else if (erro()) { <p role="alert">{{ erro() }}</p> }
          @else if (!consultas().length) { <p>Não há consultas marcadas para hoje.</p> }
          @else {
            <ul>@for (consulta of consultas(); track consulta.id) {
              <li><time [attr.datetime]="consulta.dataHora">{{ consulta.dataHora | date:'HH:mm' }}</time><span>{{ consulta.pacienteNome }}</span></li>
            }</ul>
          }
        </div>
        <p class="note">A preferência fica salva neste navegador. Esta tela não envia notificações por e-mail ou push.</p>
      </section>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100%; color: var(--color-text-primary); }
    .settings { max-width: 1100px; margin: 0 auto; padding: 32px 40px; }
    .page-header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding-bottom:24px; border-bottom:1px solid var(--color-border-default); }
    h1 { margin:0; font-size:32px; } .eyebrow { margin:0 0 6px; color:var(--color-brand-primary); font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
    a { color:var(--color-brand-primary); font-weight:600; } a:focus-visible, input:focus-visible { outline:3px solid var(--color-brand-primary); outline-offset:3px; }
    .card { max-width:760px; margin-top:24px; padding:28px; background:var(--color-surface-card); border:1px solid var(--color-border-default); border-radius:var(--radius-lg); }
    .section-heading { display:flex; gap:16px; align-items:flex-start; margin-bottom:12px; } .icon { display:grid; place-items:center; width:44px; height:44px; border-radius:12px; color:var(--color-brand-primary); background:#eaf4ed; font-size:23px; }
    h2 { margin:0 0 6px; font-size:21px; } .section-heading p, .note { margin:0; color:var(--color-text-secondary); line-height:1.5; }
    .setting-row { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:20px 0; border-top:1px solid var(--color-border-default); cursor:pointer; }
    .setting-row span { display:grid; gap:5px; } .setting-row small { color:var(--color-text-secondary); line-height:1.4; }
    input { flex:none; width:20px; height:20px; accent-color:var(--color-brand-primary); cursor:pointer; }
    .saved { min-height:20px; margin:0 0 8px; color:var(--color-brand-primary); font-size:14px; } .note { padding-top:14px; border-top:1px solid var(--color-border-default); font-size:13px; }
    .inbox { padding:16px 0 20px; border-top:1px solid var(--color-border-default); } .inbox-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    h3 { margin:0; font-size:18px; } .inbox p { color:var(--color-text-secondary); } .inbox button { padding:8px 12px; border:1px solid var(--color-border-default); border-radius:var(--radius-sm); background:var(--color-surface-card); color:var(--color-brand-primary); cursor:pointer; }
    .inbox button:disabled { opacity:.5; cursor:default; } .inbox ul { list-style:none; padding:0; margin:14px 0 0; } .inbox li { display:flex; gap:14px; padding:12px 0; border-top:1px solid var(--color-border-default); }
    .inbox time { min-width:48px; font-weight:700; color:var(--color-brand-primary); }
    .account-details { margin:0; } .account-details div, .action-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 0; border-top:1px solid var(--color-border-default); }
    dt { color:var(--color-text-secondary); } dd { margin:0; font-weight:600; overflow-wrap:anywhere; text-align:right; }
    .action-row span { display:grid; gap:4px; } .action-row small { color:var(--color-text-secondary); line-height:1.4; }
    .action-row a { flex:none; } .secondary-action { padding:8px 12px; border:1px solid var(--color-border-default); border-radius:var(--radius-sm); background:var(--color-surface-card); color:var(--color-brand-primary); cursor:pointer; }
    .secondary-action:disabled { opacity:.5; cursor:default; }
    @media(max-width:600px) { .settings { padding:24px 16px; } .page-header { align-items:flex-start; flex-direction:column; } h1 { font-size:28px; } .card { padding:20px; } .setting-row { align-items:flex-start; } .action-row { align-items:flex-start; flex-direction:column; } }
  `
})
export class ConfiguracoesComponent {
  private readonly auth = inject(AuthService);
  private readonly clinico = inject(ClinicoService);
  private readonly destroyRef = inject(DestroyRef);
  preferencias = this.carregarPreferencias();
  mensagem = '';
  readonly consultas = signal<ConsultaResumo[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly conta = signal<UsuarioInfo | null>(null);
  readonly carregandoConta = signal(true);
  readonly erroConta = signal('');
  readonly enviandoSenha = signal(false);
  readonly mensagemSenha = signal('');
  readonly erroSenha = signal('');

  constructor() { this.carregarConta(); this.carregar(); }

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
    this.carregando.set(true);
    this.erro.set('');
    this.clinico.agenda().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: agenda => { this.consultas.set(agenda.hoje); this.carregando.set(false); },
      error: () => { this.erro.set('Não foi possível carregar as consultas.'); this.carregando.set(false); }
    });
  }

  atualizar(chave: keyof PreferenciasNotificacao, event: Event): void {
    this.preferencias = { ...this.preferencias, [chave]: (event.target as HTMLInputElement).checked };
    try {
      localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(this.preferencias));
      this.mensagem = 'Preferências salvas neste dispositivo.';
    } catch { this.mensagem = 'Não foi possível salvar a preferência neste navegador.'; }
  }

  private carregarPreferencias(): PreferenciasNotificacao {
    try {
      const valor = localStorage.getItem(CHAVE_PREFERENCIAS);
      return valor ? { ...PADRAO, ...JSON.parse(valor) } : { ...PADRAO };
    } catch {
      return { ...PADRAO };
    }
  }
}
