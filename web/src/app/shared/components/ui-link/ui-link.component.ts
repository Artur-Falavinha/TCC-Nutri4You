import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ui-link',
  imports: [RouterLink],
  templateUrl: './ui-link.component.html',
  styleUrl: './ui-link.component.css'
})
export class UiLinkComponent {
  @Input({ required: true }) label = '';
  @Input() route: string | string[] = '/';
  @Input() icon = '';
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Input() centered = false;
}
