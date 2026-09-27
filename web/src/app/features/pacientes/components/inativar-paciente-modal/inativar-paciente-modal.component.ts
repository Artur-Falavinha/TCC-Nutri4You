import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { Paciente } from '../../../../core/models/paciente.models';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-inativar-paciente-modal',
  imports: [UiButtonComponent, FormAlertComponent],
  templateUrl: './inativar-paciente-modal.component.html',
  styleUrl: './inativar-paciente-modal.component.css'
})
export class InativarPacienteModalComponent {
  @Input({ required: true }) paciente!: Paciente;
  @Output() fechar = new EventEmitter<void>();
  @Output() inativado = new EventEmitter<Paciente>();

  private readonly pacientesService = inject(PacientesService);

  loading = false;
  errorMessage = '';

  onConfirmar(): void {
    this.loading = true;
    this.errorMessage = '';

    this.pacientesService
      .inativarPaciente(this.paciente.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.inativado.emit({ ...this.paciente, ativo: false });
        },
        error: (error: ApiErrorResponse) => {
          this.errorMessage = error.message ?? 'Não foi possível inativar o paciente.';
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
