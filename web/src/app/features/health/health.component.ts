import { Component, OnInit, inject } from '@angular/core';

import { ApiErrorResponse, HealthStatus } from '../../core/models/api-response.model';
import { HealthService } from '../../core/services/health.service';

type ViewState = 'loading' | 'success' | 'error';

/**
 * Prova de fluxo ponta a ponta da Sprint 1: cliente -> API -> banco.
 * Chama GET /api/v1/health assim que a API Spring Boot estiver no ar.
 */
@Component({
  selector: 'app-health',
  standalone: true,
  imports: [],
  templateUrl: './health.component.html'
})
export class HealthComponent implements OnInit {
  private readonly healthService = inject(HealthService);

  state: ViewState = 'loading';
  health?: HealthStatus;
  error?: ApiErrorResponse;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.state = 'loading';
    this.healthService.check().subscribe({
      next: (health) => {
        this.health = health;
        this.state = 'success';
      },
      error: (error: ApiErrorResponse) => {
        this.error = error;
        this.state = 'error';
      }
    });
  }
}
