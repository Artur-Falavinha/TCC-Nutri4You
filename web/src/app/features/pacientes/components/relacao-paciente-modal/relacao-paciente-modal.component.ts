import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { Paciente } from '../../../../core/models/paciente.models';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';
import { PacienteDialogComponent } from '../paciente-dialog/paciente-dialog.component';

export type AcaoRelacao = 'vincular' | 'desvincular';

@Component({
  selector: 'app-relacao-paciente-modal',
  imports: [UiButtonComponent, FormAlertComponent, PacienteDialogComponent],
  templateUrl: './relacao-paciente-modal.component.html'
})
export class RelacaoPacienteModalComponent {
  @Input({ required: true }) paciente!: Paciente;
  @Input({ required: true }) acao!: AcaoRelacao;
  @Output() fechar = new EventEmitter<void>();
  @Output() concluido = new EventEmitter<void>();

  private readonly pacientesService = inject(PacientesService);

  loading = false;
  errorMessage = '';

  get title(): string {
    return this.acao === 'desvincular' ? 'Encerrar relação?' : 'Vincular paciente?';
  }

  get description(): string {
    if (this.acao === 'desvincular') {
      return 'Este paciente deixará de aparecer na listagem principal. O histórico clínico permanece guardado no sistema.';
    }
    return 'Este paciente passa a ter relação recorrente com você e entra na listagem principal.';
  }

  get confirmLabel(): string {
    return this.acao === 'desvincular' ? 'Encerrar relação' : 'Vincular';
  }

  onConfirmar(): void {
    this.loading = true;
    this.errorMessage = '';

    const request =
      this.acao === 'desvincular'
        ? this.pacientesService.desvincularPaciente(this.paciente.id)
        : this.pacientesService.vincularPaciente(this.paciente.id);

    request.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => this.concluido.emit(),
      error: (error: ApiErrorResponse) => {
        this.errorMessage =
          error.message ??
          (this.acao === 'desvincular'
            ? 'Não foi possível encerrar a relação.'
            : 'Não foi possível vincular o paciente.');
      }
    });
  }
}
