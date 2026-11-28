import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { FotoPerfilService } from '../core/services/foto-perfil.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent],
  providers: [FotoPerfilService],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css'
})
export class AppShellComponent {
  constructor() {
    inject(FotoPerfilService).carregar();
  }
}
