import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { EMPTY, catchError } from 'rxjs';
import { PacientesService } from '../../../core/services/pacientes.service';
import { AvatarPerfilComponent } from '../avatar-perfil/avatar-perfil.component';

@Component({
  selector: 'app-avatar-paciente',
  imports: [AvatarPerfilComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<app-avatar-perfil [url]="url()" />',
  styles: `:host { display: block; flex: none; }`
})
export class AvatarPacienteComponent {
  readonly pacienteId = input.required<number | null>();
  private readonly pacientes = inject(PacientesService);
  private readonly foto = signal<{ pacienteId: number; url: string } | null>(null);
  protected readonly url = computed(() => {
    const foto = this.foto();
    return foto && foto.pacienteId === this.pacienteId() ? foto.url : null;
  });

  constructor() {
    effect(onCleanup => {
      const pacienteId = this.pacienteId();
      this.foto.set(null);
      if (!pacienteId) return;

      let url: string | undefined;
      const requisicao = this.pacientes.carregarFoto(pacienteId).pipe(catchError(() => EMPTY)).subscribe(imagem => {
        if (!imagem?.size) return;
        url = URL.createObjectURL(imagem);
        this.foto.set({ pacienteId, url });
      });
      onCleanup(() => {
        requisicao.unsubscribe();
        if (url) URL.revokeObjectURL(url);
      });
    });
  }
}
