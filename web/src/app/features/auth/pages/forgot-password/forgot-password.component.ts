import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';
import { AuthFormCardComponent } from '../../../../shared/components/auth-form-card/auth-form-card.component';
import { AuthPageLayoutComponent } from '../../../../shared/components/auth-page-layout/auth-page-layout.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiLinkComponent } from '../../../../shared/components/ui-link/ui-link.component';
import { resolveFieldError } from '../../../../shared/utils/form-field-error.util';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    AuthPageLayoutComponent,
    AuthFormCardComponent,
    UiInputComponent,
    UiButtonComponent,
    UiLinkComponent,
    FormAlertComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  sending = false;
  submitted = false;
  successMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  enviarToken(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending = true;
    this.successMessage = '';

    this.authService
      .solicitarRecuperacaoSenha(this.form.controls.email.value)
      .pipe(finalize(() => (this.sending = false)))
      .subscribe({
        next: (mensagem) => {
          this.successMessage = mensagem;
        },
        error: (error: ApiErrorResponse) => {
          this.toast.erro(error.message ?? 'Não foi possível enviar o token.');
        }
      });
  }

  fieldError(field: 'email'): string {
    return resolveFieldError(this.form.controls[field], this.submitted, {
      email: 'Informe um e-mail válido.'
    });
  }
}
