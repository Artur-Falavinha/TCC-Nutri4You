import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { Agenda, ClinicoService } from '../clinico/clinico.service';

@Component({
  selector: 'app-dashboard',
  imports: [SidebarComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly clinico = inject(ClinicoService);

  agenda: Agenda | null = null;
  carregando = true;
  erro = '';

  ngOnInit(): void {
    this.clinico.agenda().subscribe({
      next: agenda => {
        this.agenda = agenda;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar a agenda.';
        this.carregando = false;
      }
    });
  }
}
