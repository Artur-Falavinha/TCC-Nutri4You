import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';

import { ToastService } from '../../../../core/services/toast.service';
import { CadastroEmailConfirmado, ConfirmacaoEmailResponse, UserProfile } from '../../../../core/models/auth.models';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthFormCardComponent } from '../../../../shared/components/auth-form-card/auth-form-card.component';
import { AuthPageLayoutComponent } from '../../../../shared/components/auth-page-layout/auth-page-layout.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiLinkComponent } from '../../../../shared/components/ui-link/ui-link.component';
import { isUuid } from '../../../../shared/utils/uuid.util';
import { RegisterFlowService } from '../../services/register-flow.service';

const MENSAGEM_LINK_INDISPONIVEL =
  'Este link é inválido, expirou ou já foi usado. Se já confirmou seu e-mail, entre pelo site ou volte ao aplicativo.';
const MENSAGEM_CADASTRO_INDISPONIVEL = 'Este link expirou, foi substituído ou o cadastro já foi concluído.';

@Component({
  selector: 'app-confirmar-email',
  imports: [AuthFormCardComponent, AuthPageLayoutComponent, FormAlertComponent, UiButtonComponent, UiLinkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirmar-email.component.html',
  styleUrl: './confirmar-email.component.css'
})
export class ConfirmarEmailComponent {
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localizacao = inject(Location);
  private readonly router = inject(Router);
  private readonly fluxoCadastro = inject(RegisterFlowService);
  private readonly parametros = new URLSearchParams(inject(ActivatedRoute).snapshot.fragment ?? '');
  protected readonly ehCadastro = this.parametros.has('cadastro');
  private readonly token = (this.ehCadastro ? this.parametros.get('cadastro') : this.parametros.get('token')) ?? '';
  private readonly mensagemIndisponivel = this.ehCadastro ? MENSAGEM_CADASTRO_INDISPONIVEL : MENSAGEM_LINK_INDISPONIVEL;

  protected readonly perfil = signal<UserProfile | null>(null);
  protected readonly podeConfirmar = signal(isUuid(this.token));
  protected readonly erro = signal(this.podeConfirmar() ? '' : this.mensagemIndisponivel);
  protected readonly emAndamento = signal(false);

  protected confirmar(): void {
    if (!this.podeConfirmar() || this.emAndamento()) {
      return;
    }

    this.emAndamento.set(true);
    this.erro.set('');
    const requisicao: Observable<ConfirmacaoEmailResponse | CadastroEmailConfirmado> = this.ehCadastro
      ? this.authService.confirmarCadastro(this.token)
      : this.authService.confirmarEmail(this.token);
    requisicao
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.emAndamento.set(false))
      )
      .subscribe({
        next: (resultado) => {
          this.podeConfirmar.set(false);
          if ('email' in resultado && resultado.tipoUsuario === 'NUTRICIONISTA') {
            this.fluxoCadastro.guardarEmailConfirmado({ ...resultado, token: this.token });
            void this.router.navigate(['/cadastro/dados'], { replaceUrl: true });
            return;
          }
          this.perfil.set(resultado.tipoUsuario);
          this.localizacao.replaceState('/confirmar-email');
        },
        error: (erro: ApiErrorResponse) => {
          if (erro.status === 400) {
            this.podeConfirmar.set(false);
            this.erro.set(this.mensagemIndisponivel);
            return;
          }
          this.toast.erro('Não foi possível confirmar agora. Tente novamente.');
        }
      });
  }
}
