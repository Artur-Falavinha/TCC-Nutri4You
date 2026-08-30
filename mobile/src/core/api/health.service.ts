import { apiClient } from './api-client';
import { HealthStatus } from './api-response.types';

/**
 * Critério de aceite da Sprint 1: "Web e mobile consultam o endpoint de
 * saúde da API em ambiente de desenvolvimento."
 */
export const healthService = {
  check(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>('/health');
  }
};
