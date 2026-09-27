import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { Paciente } from '../../../../core/models/paciente.models';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-reativar-paciente-modal',
  imports: [UiButtonComponent, FormAlertComponent],
  templateUrl: './reativar-paciente-modal.component.html',
  styleUrl: './reativar-paciente-modal.component.css'
})
export class ReativarPacienteModalComponent {
  @Input({ required: true }) paciente!: Paciente;
  @Output() fechar = new EventEmitter<void>();
  @Output() reativado = new EventEmitter<Paciente>();

  private readonly pacientesService = inject(PacientesService);

  loading = false;
  errorMessage = '';

  onConfirmar(): void {
    this.loading = true;
    this.errorMessage = '';

    this.pacientesService
      .reativarPaciente(this.paciente.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pacienteAtualizado: Paciente) => {
          this.reativado.emit(pacienteAtualizado);
        },
        error: (error: ApiErrorResponse) => {
          this.errorMessage = error.message ?? 'Não foi possível reativar o paciente.';
        }
      });
  }

  onCancelar(): void {
    this.fechar.emit();
  }

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal__backdrop')) {
      this.fechar.emit();
    }
  }
}
