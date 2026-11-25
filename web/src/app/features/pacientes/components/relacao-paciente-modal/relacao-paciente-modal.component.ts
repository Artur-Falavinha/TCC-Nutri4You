import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { PacientesService } from '../../../../core/services/pacientes.service';
import { Paciente } from '../../../../core/models/paciente.models';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';
import { DialogoConfirmacaoComponent } from '../../../../shared/components/dialogo-confirmacao/dialogo-confirmacao.component';

export type AcaoRelacao = 'vincular' | 'desvincular';

@Component({
  selector: 'app-relacao-paciente-modal',
  imports: [DialogoConfirmacaoComponent],
  templateUrl: './relacao-paciente-modal.component.html'
})
export class RelacaoPacienteModalComponent {
  @Input({ required: true }) paciente!: Paciente;
  @Input({ required: true }) acao!: AcaoRelacao;
  @Output() fechar = new EventEmitter<void>();
  @Output() concluido = new EventEmitter<void>();

  private readonly pacientesService = inject(PacientesService);

  loading = false;
  erro = '';

  get title(): string {
    return this.acao === 'desvincular' ? 'Encerrar vínculo?' : 'Solicitar vínculo?';
  }

  get description(): string {
    if (this.acao === 'desvincular') {
      return `Você deixará de acessar a ficha clínica de ${this.paciente.nome}. Consultas em aberto com esse paciente serão canceladas e o histórico ficará guardado no sistema.`;
    }
    return `${this.paciente.nome} precisa aceitar a solicitação no aplicativo para iniciar o vínculo.`;
  }

  get confirmLabel(): string {
    return this.acao === 'desvincular' ? 'Encerrar vínculo' : 'Enviar solicitação';
  }

  onConfirmar(): void {
    if (this.loading) return;
    this.loading = true;
    this.erro = '';

    const request =
      this.acao === 'desvincular'
        ? this.pacientesService.desvincularPaciente(this.paciente.id)
        : this.pacientesService.vincularPaciente(this.paciente.id);

    request.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => this.concluido.emit(),
      error: (error: ApiErrorResponse) => {
        this.erro = error.message || (this.acao === 'desvincular'
          ? 'Não foi possível encerrar o vínculo. Tente novamente.'
          : 'Não foi possível enviar a solicitação. Tente novamente.');
      }
    });
  }
}
