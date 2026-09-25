import { clearToken, getToken } from '../auth/token-storage';
import { env } from '../config/env';
import { ApiError, ApiErrorResponse, ApiResponse } from './api-response.types';

type UnauthorizedHandler = () => void;

/**
 * Cliente HTTP unico do mobile: URL base, JWT e unwrap do envelope ApiResponse.
 */
class ApiClient {
  private readonly baseUrl = env.apiBaseUrl;
  private onUnauthorized: UnauthorizedHandler | null = null;

  setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    this.onUnauthorized = handler;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const url = this.buildUrl(path);
    const token = await getToken();

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers
        }
      });
    } catch {
      throw new ApiError({
        status: 0,
        error: 'ERRO_DE_REDE',
        message:
          'Nao foi possivel conectar a API. Verifique sua conexao ou se o backend esta no ar.',
        path: url,
        timestamp: new Date().toISOString()
      });
    }

    if (response.status === 401) {
      await clearToken();
      this.onUnauthorized?.();
    }

    if (!response.ok) {
      const body = await this.safeParseJson<Partial<ApiErrorResponse>>(response);
      throw new ApiError({
        status: response.status,
        error: body?.error ?? response.statusText ?? 'ERRO_DESCONHECIDO',
        message: body?.message ?? 'Nao foi possivel completar a requisicao.',
        path: url,
        timestamp: new Date().toISOString()
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const envelope = await this.safeParseJson<ApiResponse<T>>(response);
    return envelope?.data as T;
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private async safeParseJson<T>(response: Response): Promise<T | undefined> {
    try {
      return (await response.json()) as T;
    } catch {
      return undefined;
    }
  }
}

export const apiClient = new ApiClient();
