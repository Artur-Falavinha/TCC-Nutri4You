import { env } from '../config/env';
import { ApiError, ApiErrorResponse } from './api-response.types';

/**
 * Cliente de API genérico usado por todos os serviços de feature no mobile.
 * Equivalente ao ApiService do Angular: centraliza a URL base e normaliza
 * erros no formato ApiErrorResponse, para que as telas só precisem tratar
 * um formato único de erro.
 *
 * Sprint 1: cobre apenas o necessário para consumir o endpoint de health
 * check. Sprint 2 em diante, o header de Authorization (JWT) entra aqui.
 */
class ApiClient {
  private readonly baseUrl = env.apiBaseUrl;

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body)
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

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers
        }
      });
    } catch {
      throw new ApiError({
        status: 0,
        error: 'ERRO_DE_REDE',
        message: 'Não foi possível conectar à API. Verifique sua conexão ou se o backend está no ar.',
        path: url,
        timestamp: new Date().toISOString()
      });
    }

    if (!response.ok) {
      const body = await this.safeParseJson<Partial<ApiErrorResponse>>(response);
      throw new ApiError({
        status: response.status,
        error: body?.error ?? response.statusText ?? 'ERRO_DESCONHECIDO',
        message: body?.message ?? 'Não foi possível completar a requisição.',
        path: url,
        timestamp: new Date().toISOString()
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return this.safeParseJson<T>(response) as Promise<T>;
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
