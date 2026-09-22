import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-form-alert',
  imports: [],
  templateUrl: './form-alert.component.html',
  styleUrl: './form-alert.component.css'
})
export class FormAlertComponent {
  @Input() message = '';
  @Input() type: 'error' | 'success' | 'info' = 'error';

  /** Sem mensagem, o host some do flex — evita gap fantasma acima do primeiro campo. */
  @HostBinding('class.form-alert-host--visible')
  get isVisible(): boolean {
    return !!this.message.trim();
  }
}
