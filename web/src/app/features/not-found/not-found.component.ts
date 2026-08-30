import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="page">
      <h1>Página não encontrada</h1>
      <a routerLink="/">Voltar para a home</a>
    </main>
  `
})
export class NotFoundComponent {}
