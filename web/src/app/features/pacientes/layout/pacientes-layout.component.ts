import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-pacientes-layout',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './pacientes-layout.component.html',
  styleUrl: './pacientes-layout.component.css'
})
export class PacientesLayoutComponent {}

