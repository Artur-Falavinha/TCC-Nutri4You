import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  nomeNutricionista = 'Nutricionista';
  isExpanded = false;

  constructor() {
    this.authService.fetchMe().subscribe({
      next: (usuario) => {
        this.nomeNutricionista = usuario.nome;
      },
      error: () => {
        /* mantém o fallback em caso de erro */
      }
    });
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  async logout(): Promise<void> {
    const left = await this.router.navigate(['/login']);
    if (left) this.authService.logout();
  }
}

