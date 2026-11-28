import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-patient-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './patient-tabs.component.html',
  styleUrl: './patient-tabs.component.css'
})
export class PatientTabsComponent {
  private readonly router = inject(Router);
  @Input({ required: true }) patientId!: number;
  @Output() reabrir = new EventEmitter<void>();

  abrirSecao(evento: MouseEvent, caminho: string): void {
    if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    const destino = this.router.createUrlTree(['/pacientes', this.patientId, caminho]);
    if (this.router.isActive(destino, { paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'exact' })) {
      this.reabrir.emit();
    }
  }

  readonly tabs = [
    { path: 'dados', label: 'Dados' },
    { path: 'anamnese', label: 'Anamnese' },
    { path: 'historico', label: 'Histórico' },
    { path: 'consultas', label: 'Consultas' },
    { path: 'dieta', label: 'Dieta' },
    { path: 'exames', label: 'Exames' }
  ];
}
