import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, timer } from 'rxjs';
import { NotificacoesService } from '../../../features/notificacoes/notificacoes.service';

@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink],
  template: `
    <a class="bell" routerLink="/notificacoes"
      [attr.aria-label]="quantidade ? quantidade + ' notificações de consulta pendentes' : 'Notificações'">
      <i class="ph ph-bell" aria-hidden="true"></i>
      @if (quantidade) { <span class="badge" aria-hidden="true">{{ quantidade > 99 ? '99+' : quantidade }}</span> }
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
  private readonly destroyRef = inject(DestroyRef);
  quantidade = 0;

  ngOnInit(): void {
    timer(0, 30_000).pipe(
      switchMap(() => this.service.listar().pipe(catchError(() => of([])))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(itens => { this.quantidade = itens.length; });
  }
}
