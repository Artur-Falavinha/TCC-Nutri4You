/** Envelope padrão de resposta de sucesso (RNF09/RNF10). */
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

export class ApiError extends Error implements ApiErrorResponse {
  status: number;
  error: string;
  path?: string;
  timestamp?: string;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.status = response.status;
    this.error = response.error;
    this.path = response.path;
    this.timestamp = response.timestamp;
  }
}
