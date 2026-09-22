import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthFormCardComponent } from '../../../../shared/components/auth-form-card/auth-form-card.component';
import { AuthPageLayoutComponent } from '../../../../shared/components/auth-page-layout/auth-page-layout.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/components/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiLinkComponent } from '../../../../shared/components/ui-link/ui-link.component';
import { crnValidator, normalizeCrnForApi } from '../../../../shared/utils/crn-mask.util';
import { resolveFieldError } from '../../../../shared/utils/form-field-error.util';
import { RegisterFlowService } from '../../services/register-flow.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    AuthPageLayoutComponent,
    AuthFormCardComponent,
    UiInputComponent,
    UiCheckboxComponent,
    UiButtonComponent,
    UiLinkComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly registerFlow = inject(RegisterFlowService);

  submitted = false;

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    crn: ['', [Validators.required, crnValidator()]],
    email: ['', [Validators.required, Validators.email]],
    termsAccepted: [false, [Validators.requiredTrue]]
  });

  submit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const draft = this.form.getRawValue();
    this.registerFlow.saveDraft({
      ...draft,
      crn: normalizeCrnForApi(draft.crn)
    });
    void this.router.navigate(['/cadastro/senha']);
  }

  fieldError(field: 'nome' | 'crn' | 'email'): string {
    return resolveFieldError(this.form.controls[field], this.submitted, {
      email: 'Informe um e-mail válido.',
      minlength: 'Informe ao menos 3 caracteres.',
      crn: 'Informe um CRN válido (ex.: CRN-8 12345).'
    });
  }

  termsError(): string {
    if (!this.submitted || this.form.controls.termsAccepted.valid) {
      return '';
    }
    return 'Você precisa aceitar os termos para continuar.';
  }
}
