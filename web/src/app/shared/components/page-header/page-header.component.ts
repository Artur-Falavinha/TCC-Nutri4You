import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-page-header',
  imports: [NotificationBellComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  readonly titulo = input.required<string>();
  readonly mostrarSino = input(true);
}
