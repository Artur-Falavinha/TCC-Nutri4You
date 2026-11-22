import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ApiErrorResponse } from '../../../../core/models/api-response.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthFormCardComponent } from '../../../../shared/components/auth-form-card/auth-form-card.component';
import { AuthPageLayoutComponent } from '../../../../shared/components/auth-page-layout/auth-page-layout.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiLinkComponent } from '../../../../shared/components/ui-link/ui-link.component';

@Component({
  selector: 'app-cadastro-email',
  imports: [ReactiveFormsModule, AuthFormCardComponent, AuthPageLayoutComponent, FormAlertComponent,
    UiButtonComponent, UiInputComponent, UiLinkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cadastro-email.component.html',
  styleUrl: '../register/register.component.css'
})
export class CadastroEmailComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]]
  });
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  protected readonly orientacao = signal('');

  protected enviar(): void {
    if (this.enviando()) return;

    this.erro.set('');
    this.orientacao.set('');
    if (this.formulario.invalid) {
      this.erro.set('Informe um endereço de e-mail válido.');
      return;
    }

    this.enviando.set(true);
    this.authService.iniciarCadastro(this.formulario.controls.email.value.trim())
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => this.orientacao.set('Confira sua caixa de entrada e abra o link para continuar seu cadastro.'),
        error: (erro: ApiErrorResponse) => this.erro.set(erro.message || 'Não foi possível enviar. Tente novamente.')
      });
  }
}
