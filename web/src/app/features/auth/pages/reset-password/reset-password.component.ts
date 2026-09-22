import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';
import { AuthFormCardComponent } from '../../../../shared/components/auth-form-card/auth-form-card.component';
import { AuthPageLayoutComponent } from '../../../../shared/components/auth-page-layout/auth-page-layout.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiLinkComponent } from '../../../../shared/components/ui-link/ui-link.component';
import {
  resolveFieldError,
  resolveGroupFieldError
} from '../../../../shared/utils/form-field-error.util';
import { INVALID_TOKEN_MESSAGE, isUuid } from '../../../../shared/utils/uuid.util';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    AuthPageLayoutComponent,
    AuthFormCardComponent,
    UiInputComponent,
    UiButtonComponent,
    UiLinkComponent,
    FormAlertComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  token = '';

  form = this.fb.nonNullable.group(
    {
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', [Validators.required]]
    },
    {
      validators: (group) =>
        group.get('senha')?.value === group.get('confirmarSenha')?.value
          ? null
          : { senhasDiferentes: true }
    }
  );

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    if (!this.token || !isUuid(this.token)) {
      this.token = '';
      this.errorMessage = INVALID_TOKEN_MESSAGE;
    }
  }

  submit(): void {
    if (!this.token) {
      return;
    }

    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { senha } = this.form.getRawValue();

    this.authService
      .redefinirSenha(this.token, senha)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (mensagem) => {
          this.successMessage = mensagem;
          setTimeout(() => void this.router.navigate(['/login']), 2000);
        },
        error: (error: ApiErrorResponse) => {
          this.errorMessage = this.resolveSubmitError(error);
        }
      });
  }

  fieldError(field: 'senha' | 'confirmarSenha'): string {
    const controlError = resolveFieldError(this.form.controls[field], this.submitted, {
      minlength: 'A senha deve ter no mínimo 8 caracteres.'
    });

    if (controlError || field !== 'confirmarSenha') {
      return controlError;
    }

    return resolveGroupFieldError(
      this.form,
      this.submitted,
      'senhasDiferentes',
      'As senhas não coincidem.',
      ['senha', 'confirmarSenha']
    );
  }

  private resolveSubmitError(error: ApiErrorResponse): string {
    if (error.error === 'REQUISICAO_INVALIDA') {
      return INVALID_TOKEN_MESSAGE;
    }

    const message = error.message ?? '';
    if (message.includes('Token inválido') || message.includes('Invalid UUID')) {
      return INVALID_TOKEN_MESSAGE;
    }

    return message || 'Não foi possível redefinir a senha.';
  }
}
