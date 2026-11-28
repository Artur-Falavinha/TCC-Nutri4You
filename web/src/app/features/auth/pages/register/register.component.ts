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
import { URL_TERMOS, VERSAO_TERMOS } from '../../../privacidade/privacidade.component';

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
  readonly urlTermos = `${URL_TERMOS}/${VERSAO_TERMOS}`;
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly registerFlow = inject(RegisterFlowService);

  readonly emailConfirmado = this.registerFlow.getEmailConfirmado()?.email ?? '';
  private readonly dadosAnteriores = this.registerFlow.getDraft();
  private readonly aceiteAnterior = this.dadosAnteriores?.versaoTermos === VERSAO_TERMOS
    && this.dadosAnteriores.termsAccepted;
  submitted = false;

  form = this.fb.nonNullable.group({
    nome: [this.dadosAnteriores?.nome ?? '', [Validators.required, Validators.minLength(3)]],
    crn: [this.dadosAnteriores?.crn ?? '', [Validators.required, crnValidator()]],
    termsAccepted: [this.aceiteAnterior, [Validators.requiredTrue]]
  });

  submit(): void {
    const confirmacao = this.registerFlow.getEmailConfirmado();
    if (!confirmacao) {
      void this.router.navigate(['/cadastro']);
      return;
    }
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const draft = this.form.getRawValue();
    this.registerFlow.saveDraft({
      ...draft,
      email: confirmacao.email,
      versaoTermos: VERSAO_TERMOS,
      crn: normalizeCrnForApi(draft.crn)
    });
    void this.router.navigate(['/cadastro/senha']);
  }

  fieldError(field: 'nome' | 'crn'): string {
    return resolveFieldError(this.form.controls[field], this.submitted, {
      minlength: 'Informe ao menos 3 caracteres.',
      crn: 'Use o formato CRN-8 12345.'
    });
  }

  termsError(): string {
    if (!this.submitted || this.form.controls.termsAccepted.valid) {
      return '';
    }
    return 'Você precisa aceitar os termos para continuar.';
  }
}
