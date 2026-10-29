import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-feature-unavailable',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <h1>{{ pagina['titulo'] }}</h1>
    </header>
    <section class="notice" aria-labelledby="notice-title">
      <i class="ph ph-info" aria-hidden="true"></i>
      <h2 id="notice-title">Ainda não disponível</h2>
      <p>{{ pagina['descricao'] }}</p>
      <a [routerLink]="pagina['destino']">{{ pagina['acao'] }}</a>
    </section>
  `,
  styles: `
    :host { display: block; color: var(--color-text-primary); }
    .page-header { padding: 32px 40px; border-bottom: 1px solid var(--color-border-default); }
    h1 { margin: 0; font-size: 32px; }
    .notice { max-width: 640px; margin: 40px; padding: 32px; background: var(--color-surface-card);
      border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); }
    .notice > i { font-size: 32px; color: var(--color-brand-primary); }
    h2 { margin: 16px 0 12px; font-size: 24px; }
    p { line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; padding: 12px 20px; color: var(--color-text-on-brand);
      background: var(--color-brand-primary); border-radius: var(--radius-sm); text-decoration: none; }
    a:hover { background: var(--color-brand-primary-hover); }
    a:focus-visible { outline: 3px solid var(--color-brand-primary); outline-offset: 4px; }
    @media (max-width: 600px) {
      .page-header { padding: 24px; }
      .notice { margin: 24px; padding: 24px; }
    }
  `
})
export class FeatureUnavailableComponent {
  readonly pagina = inject(ActivatedRoute).snapshot.data;
}
