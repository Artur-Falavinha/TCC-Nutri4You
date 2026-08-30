import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HealthStatus } from '../models/api-response.model';
import { ApiService } from './api.service';

/**
 * Critério de aceite da Sprint 1: "Web e mobile consultam o endpoint de
 * saúde da API em ambiente de desenvolvimento."
 */
@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly api = inject(ApiService);

  check(): Observable<HealthStatus> {
    return this.api.get<HealthStatus>('/health');
  }
}
