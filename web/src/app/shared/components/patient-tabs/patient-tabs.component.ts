import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-patient-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './patient-tabs.component.html',
  styleUrl: './patient-tabs.component.css'
})
export class PatientTabsComponent {
  @Input({ required: true }) patientId!: number;

  readonly tabs = [
    { path: 'dados', label: 'Dados' },
    { path: 'anamnese', label: 'Anamnese' },
    { path: 'historico', label: 'Histórico' },
    { path: 'medidas', label: 'Medidas' }
  ];
}
