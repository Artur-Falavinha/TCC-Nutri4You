import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AvatarPacienteComponent } from './avatar-paciente.component';

@Component({
  selector: 'app-titulo-paciente',
  imports: [AvatarPacienteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pacienteId()) { <app-avatar-paciente [pacienteId]="pacienteId()" /> }
    <h1>{{ nome() }}</h1>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--space-12);
      margin-bottom: var(--space-8);
      --tamanho-avatar: 2.75rem;
      --fundo-avatar: color-mix(in srgb, var(--color-brand-primary) 8%, var(--color-surface-card));
    }
    h1 {
      margin: 0;
      font: 700 2.25rem / 1.3 var(--font-heading);
      letter-spacing: 0;
      overflow-wrap: anywhere;
      min-width: 0;
    }
    @media (max-width: 720px) {
      :host { --tamanho-avatar: 2.25rem; }
      h1 { font-size: 1.75rem; }
    }
  `
})
export class TituloPacienteComponent {
  readonly pacienteId = input.required<number | null>();
  readonly nome = input.required<string>();
}
