/**
 * Envelope padrão de resposta da API (RNF09/RNF10 — tratamento padrão de respostas).
 * Ajustar assim que o contrato real da API Spring Boot for publicado na Sprint 1.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
}

/** Resposta esperada do endpoint de health check (GET /api/v1/health). */
export interface HealthStatus {
  status: 'UP' | 'DOWN';
  service?: string;
  timestamp?: string;
}
