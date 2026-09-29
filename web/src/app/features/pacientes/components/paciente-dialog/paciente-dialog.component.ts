import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-paciente-dialog',
  imports: [],
  templateUrl: './paciente-dialog.component.html',
  styleUrl: './paciente-dialog.component.css'
})
export class PacienteDialogComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Output() fechar = new EventEmitter<void>();

  readonly titleId = 'paciente-dialog-title';

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal__backdrop')) {
      this.fechar.emit();
    }
  }

  onEscape(event: Event): void {
    event.stopPropagation();
    this.fechar.emit();
  }
}
