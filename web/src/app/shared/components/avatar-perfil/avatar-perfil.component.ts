import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @if (url(); as imagem) {
      <img [src]="imagem" alt="" />
    } @else if (iniciais()) {
      <span>{{ iniciais() }}</span>
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
      background: var(--fundo-avatar, var(--color-surface-page));
      color: var(--color-brand-primary);
      font-size: calc(var(--tamanho-avatar, 2rem) / 2);
    }
    img { width: 100%; height: 100%; object-fit: cover; }
    span { font-family: var(--font-heading); font-size: 0.85em; font-weight: 700; }
  `
})
export class AvatarPerfilComponent {
  readonly nome = input('');
  readonly url = input<string | null>(null);
  protected readonly iniciais = computed(() => {
    const partes = this.nome().trim().split(/\s+/);
    const primeira = Array.from(partes[0] ?? '')[0] ?? '';
    const ultima = partes.length > 1 ? (Array.from(partes.at(-1) ?? '')[0] ?? '') : '';
    return (primeira + ultima).toLocaleUpperCase('pt-BR');
  });
}
