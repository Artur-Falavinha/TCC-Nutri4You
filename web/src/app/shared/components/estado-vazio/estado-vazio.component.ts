import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-estado-vazio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'region', '[attr.aria-label]': 'titulo()' },
  template: `
    <img [src]="imagem().url" [width]="imagem().largura" [height]="imagem().altura" alt="" />
    <h2>{{ titulo() }}</h2>
    @if (descricao()) { <p>{{ descricao() }}</p> }
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-12);
      min-height: 28rem;
      padding: calc(var(--space-24) * 2) var(--space-24);
      text-align: center;
    }

    img {
      width: min(420px, 85%);
      height: auto;
      margin-bottom: var(--space-8);
    }

    h2 {
      font-family: var(--font-heading);
      font-size: 1.375rem;
      font-weight: 700;
    }

    p {
      max-width: 34rem;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      line-height: 1.5;
    }
  `
})
export class EstadoVazioComponent {
  readonly imagem = input.required<{ url: string; largura: number; altura: number }>();
  readonly titulo = input.required<string>();
  readonly descricao = input('');
}
