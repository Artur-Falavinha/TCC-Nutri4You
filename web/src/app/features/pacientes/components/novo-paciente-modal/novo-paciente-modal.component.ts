import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { PacienteResumo } from '../../../../core/models/paciente.models';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';
import { extractCpfDigits } from '../../../../shared/utils/cpf-mask.util';
import { PacienteDialogComponent } from '../paciente-dialog/paciente-dialog.component';

@Component({
  selector: 'app-novo-paciente-modal',
  imports: [
    ReactiveFormsModule,
    UiInputComponent,
    UiButtonComponent,
    FormAlertComponent,
    PacienteDialogComponent
  ],
  templateUrl: './novo-paciente-modal.component.html',
  styleUrl: './novo-paciente-modal.component.css'
})
export class NovoPacienteModalComponent {
  @Output() fechar = new EventEmitter<void>();
  @Output() vinculado = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly pacientesService = inject(PacientesService);

  loading = false;
  vinculando = false;
  errorMessage = '';
  encontrado: PacienteResumo | null = null;

  form = this.fb.nonNullable.group({
    email: [''],
    cpf: ['']
  });

  onBuscar(): void {
    const criterio = this.criterioBusca();
    if (!criterio) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.encontrado = null;

    this.pacientesService
      .buscarPaciente(criterio)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (paciente) => {
          this.encontrado = paciente;
        },
        error: (error: ApiErrorResponse) => {
          this.errorMessage =
            error.status === 404
              ? 'Nenhum paciente encontrado com esse critério.'
              : (error.message ?? 'Não foi possível buscar o paciente.');
        }
      });
  }

  onVincular(): void {
    if (!this.encontrado) {
      return;
    }

    this.vinculando = true;
    this.errorMessage = '';

    this.pacientesService
      .vincularPaciente(this.encontrado.id)
      .pipe(finalize(() => (this.vinculando = false)))
      .subscribe({
        next: () => this.vinculado.emit(),
        error: (error: ApiErrorResponse) => {
          this.errorMessage = error.message ?? 'Não foi possível vincular o paciente.';
        }
      });
  }

  onCampoAlterado(): void {
    this.encontrado = null;
    this.errorMessage = '';
  }

  private criterioBusca(): { email?: string; cpf?: string } | null {
    const email = this.form.controls.email.value.trim();
    const cpf = extractCpfDigits(this.form.controls.cpf.value);
    const temEmail = email.length > 0;
    const temCpf = cpf.length > 0;

    if (temEmail === temCpf) {
      this.errorMessage = 'Informe somente o e-mail ou somente o CPF.';
      return null;
    }

    if (temEmail && !email.includes('@')) {
      this.errorMessage = 'Informe um e-mail válido.';
      return null;
    }

    if (temCpf && cpf.length !== 11) {
      this.errorMessage = 'CPF incompleto. Use o formato 000.000.000-00.';
      return null;
    }

    this.errorMessage = '';
    return temEmail ? { email } : { cpf };
  }
}
