import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FotoPerfilService } from '../../core/services/foto-perfil.service';
import { AvatarPerfilComponent } from '../../shared/components/avatar-perfil/avatar-perfil.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';

@Component({
  selector: 'app-foto-perfil',
  imports: [AvatarPerfilComponent, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './foto-perfil.component.html',
  styleUrl: './foto-perfil.component.css'
})
export class FotoPerfilComponent {
  readonly nome = input.required<string>();
  readonly email = input.required<string>();
  protected readonly foto = inject(FotoPerfilService);

  protected selecionar(seletor: HTMLInputElement): void {
    const arquivo = seletor.files?.item(0);
    seletor.value = '';
    if (arquivo) this.foto.salvar(arquivo);
  }

  protected confirmarRemocao(dialogo: HTMLDialogElement, identidade: HTMLElement): void {
    dialogo.close();
    identidade.focus();
    this.foto.remover();
  }
}
