import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, map, switchMap, timer } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacoesService } from '../../../features/notificacoes/notificacoes.service';

@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="bell" routerLink="/notificacoes" [attr.aria-label]="rotulo()">
      <i class="ph ph-bell" aria-hidden="true"></i>
      @if (quantidade(); as total) {
        <span class="badge" aria-hidden="true">{{ total > 99 ? '99+' : total }}</span>
      }
    </a>
  `,
  styles: [`
    :host { display: inline-flex; }
    .bell { position: relative; display: inline-flex; align-items: center; justify-content: center;
      width: 2.75rem; height: 2.75rem; border: 1px solid #dbe4dc; border-radius: 50%;
      color: #17391f; background: #fff; text-decoration: none; font-size: 1.35rem; }
    .bell:hover, .bell:focus-visible { border-color: #006f1e; color: #006f1e; }
    .badge { position: absolute; top: -0.3rem; right: -0.35rem; min-width: 1.25rem; height: 1.25rem;
      padding: 0 0.25rem; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center;
      background: #b42318; color: #fff; font-size: 0.68rem; font-weight: 700; border: 2px solid #fff; }
  `]
})
export class NotificationBellComponent implements OnInit {
  private readonly service = inject(NotificacoesService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly quantidade = signal(0);
  protected readonly rotulo = computed(() => {
    const total = this.quantidade();
    if (!total) return 'Notificações';
    return total === 1 ? 'Notificações, 1 não lida' : `Notificações, ${total} não lidas`;
  });

  ngOnInit(): void {
    this.auth.fetchMe().pipe(
      switchMap(usuario => timer(0, 30_000).pipe(
        switchMap(() => this.service.listarPendentes().pipe(
          map(pendentes => this.service.contarNaoVistas(usuario.id, pendentes)),
          catchError(() => EMPTY)
        ))
      )),
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(total => this.quantidade.set(total));
  }
}
