import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FotoPerfilService } from '../../core/services/foto-perfil.service';
import { AvatarPerfilComponent } from '../../shared/components/avatar-perfil/avatar-perfil.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';

@Component({
  selector: 'app-foto-perfil',
  imports: [AvatarPerfilComponent, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="perfil" [attr.aria-busy]="foto.carregando() || foto.salvando()">
      <app-avatar-perfil />
      <div>
        <h3>Foto de perfil</h3>
        <p>JPEG ou PNG de até 5 MB.</p>
        <input #seletor type="file" accept="image/jpeg,image/png" hidden (change)="selecionar(seletor)" />
        <div class="acoes">
          <app-ui-button [label]="foto.url() ? 'Trocar foto' : 'Adicionar foto'" icon="image"
            variant="secondary" [fullWidth]="false" [disabled]="foto.carregando()" [loading]="foto.salvando()"
            (click)="seletor.click()" />
          @if (foto.url()) {
            <app-ui-button label="Remover foto" variant="secondary" [fullWidth]="false"
              [disabled]="foto.salvando() || foto.carregando()" (click)="foto.remover()" />
          }
        </div>
      </div>
    </div>
    @if (foto.falhaCarga()) {
      <p role="alert">Não foi possível carregar sua foto.</p>
      <app-ui-button label="Tentar carregar a foto" variant="secondary" [fullWidth]="false"
        [disabled]="foto.salvando()" (click)="foto.carregar()" />
    }
    @if (foto.erro()) { <p class="erro" role="alert">{{ foto.erro() }}</p> }
    @if (foto.mensagem()) { <p role="status">{{ foto.mensagem() }}</p> }
  `,
  styles: `
    :host { display: grid; gap: var(--space-8); }
    .perfil {
      display: flex;
      align-items: flex-start;
      gap: var(--space-16);
      flex-wrap: wrap;
      padding: var(--space-12) 0 var(--space-16);
      border-bottom: 1px solid var(--color-border-default);
    }
    app-avatar-perfil { --tamanho-avatar: 4rem; }
    h3 { font: 700 1rem / var(--leading-tight) var(--font-heading); }
    p { color: var(--color-text-secondary); }
    .acoes { display: flex; gap: var(--space-8); flex-wrap: wrap; margin-top: var(--space-8); }
    .erro { color: color-mix(in srgb, var(--color-error) 80%, black); }
  `
})
export class FotoPerfilComponent {
  protected readonly foto = inject(FotoPerfilService);

  protected selecionar(seletor: HTMLInputElement): void {
    const arquivo = seletor.files?.item(0);
    seletor.value = '';
    if (arquivo) this.foto.salvar(arquivo);
  }
}
