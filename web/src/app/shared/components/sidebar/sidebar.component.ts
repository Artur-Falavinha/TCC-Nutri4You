import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { FotoPerfilService } from '../../../core/services/foto-perfil.service';
import { AvatarPerfilComponent } from '../avatar-perfil/avatar-perfil.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, AvatarPerfilComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  protected readonly foto = inject(FotoPerfilService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  nomeNutricionista = 'Nutricionista';

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

  async logout(): Promise<void> {
    const naHome = this.router.url.split(/[?#]/)[0] === '/dashboard';
    if (!naHome) {
      const saiu = await this.router.navigate(['/dashboard']);
      if (!saiu) return;
    }
    this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
