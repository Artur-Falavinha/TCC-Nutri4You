import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-auth-form-card',
  imports: [],
  templateUrl: './auth-form-card.component.html',
  styleUrl: './auth-form-card.component.css'
})
export class AuthFormCardComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
}
