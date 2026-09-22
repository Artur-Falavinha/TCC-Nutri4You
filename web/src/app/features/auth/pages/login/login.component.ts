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
import { resolveFieldError } from '../../../../shared/utils/form-field-error.util';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    AuthPageLayoutComponent,
    AuthFormCardComponent,
    UiInputComponent,
    UiButtonComponent,
    UiLinkComponent,
    FormAlertComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const erro = this.route.snapshot.queryParamMap.get('erro');
    if (erro === 'acesso-web-nutricionista') {
      this.errorMessage =
        'Acesso web disponível apenas para nutricionistas. Pacientes devem usar o aplicativo mobile.';
    }
    if (this.route.snapshot.queryParamMap.get('cadastro') === 'ok') {
      this.successMessage = 'Conta criada com sucesso! Faça login para continuar.';
    }
  }

  submit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, senha } = this.form.getRawValue();

    this.authService
      .login(email, senha)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error: ApiErrorResponse) => {
          this.errorMessage = error.message ?? 'Não foi possível entrar. Tente novamente.';
        }
      });
  }

  fieldError(field: 'email' | 'senha'): string {
    return resolveFieldError(this.form.controls[field], this.submitted, {
      email: 'Informe um e-mail válido.'
    });
  }
}
