import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Placeholder da tela inicial. A partir da Sprint 2, esta rota deve dar lugar
 * ao dashboard real (nutricionista) conforme o protótipo no Figma.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent {}
