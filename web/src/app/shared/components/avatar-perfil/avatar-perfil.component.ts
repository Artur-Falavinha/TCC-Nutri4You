import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FotoPerfilService } from '../../../core/services/foto-perfil.service';

@Component({
  selector: 'app-avatar-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @if (foto.url(); as url) {
      <img [src]="url" alt="" />
    } @else {
      <i class="ph ph-user"></i>
    }
  `,
  styles: `
    :host {
      display: grid;
      width: var(--tamanho-avatar, 2rem);
      height: var(--tamanho-avatar, 2rem);
      flex: none;
      place-items: center;
      overflow: hidden;
      border-radius: 50%;
      background: var(--color-surface-page);
      color: var(--color-brand-primary);
      font-size: calc(var(--tamanho-avatar, 2rem) / 2);
    }
    img { width: 100%; height: 100%; object-fit: cover; }
  `
})
export class AvatarPerfilComponent {
  protected readonly foto = inject(FotoPerfilService);
}
