import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';
import { AuthFormCardComponent } from '../../../../shared/components/auth-form-card/auth-form-card.component';
import { AuthPageLayoutComponent } from '../../../../shared/components/auth-page-layout/auth-page-layout.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiLinkComponent } from '../../../../shared/components/ui-link/ui-link.component';
import { normalizeCrnForApi } from '../../../../shared/utils/crn-mask.util';
import {
  resolveFieldError,
  resolveGroupFieldError
} from '../../../../shared/utils/form-field-error.util';
import { RegisterFlowService } from '../../services/register-flow.service';

@Component({
  selector: 'app-register-password',
  imports: [
    ReactiveFormsModule,
    AuthPageLayoutComponent,
    AuthFormCardComponent,
    UiInputComponent,
    UiButtonComponent,
    UiLinkComponent,
    FormAlertComponent
  ],
  templateUrl: './register-password.component.html',
  styleUrl: './register-password.component.css'
})
export class RegisterPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly registerFlow = inject(RegisterFlowService);
  private readonly router = inject(Router);

  loading = false;
  submitted = false;
  errorMessage = '';

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
    if (!this.registerFlow.getDraft()) {
      void this.router.navigate(['/cadastro']);
    }
  }

  submit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    let draft;
    try {
      draft = this.registerFlow.requireDraft();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Cadastro incompleto.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { senha } = this.form.getRawValue();

    this.authService
      .autocadastrarNutricionista({
        nome: draft.nome,
        email: draft.email,
        senha,
        crn: normalizeCrnForApi(draft.crn)
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.registerFlow.clear();
          void this.router.navigate(['/login'], { queryParams: { cadastro: 'ok' } });
        },
        error: (error: ApiErrorResponse) => {
          this.errorMessage = error.message ?? 'Não foi possível concluir o cadastro.';
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
}
