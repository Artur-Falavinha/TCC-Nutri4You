import { ChangeDetectionStrategy, Component, Injector, afterNextRender, inject, input, signal } from '@angular/core';
import { FotoPerfilService } from '../../core/services/foto-perfil.service';
import { AvatarPerfilComponent } from '../../shared/components/avatar-perfil/avatar-perfil.component';
import { DialogoConfirmacaoComponent } from '../../shared/components/dialogo-confirmacao/dialogo-confirmacao.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';

@Component({
  selector: 'app-foto-perfil',
  imports: [AvatarPerfilComponent, UiButtonComponent, DialogoConfirmacaoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './foto-perfil.component.html',
  styleUrl: './foto-perfil.component.css'
})
export class FotoPerfilComponent {
  readonly nome = input.required<string>();
  protected readonly foto = inject(FotoPerfilService);
  protected readonly remocaoAberta = signal(false);
  private readonly injector = inject(Injector);

  protected selecionar(seletor: HTMLInputElement): void {
    const arquivo = seletor.files?.item(0);
    seletor.value = '';
    if (arquivo) this.foto.salvar(arquivo);
  }

  protected confirmarRemocao(identidade: HTMLElement): void {
    this.foto.remover(() => {
      this.remocaoAberta.set(false);
      if (!this.foto.url()) {
        afterNextRender(() => identidade.focus(), { injector: this.injector });
      }
    });
  }
}
