import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * Cliente de API genérico usado por todos os serviços de feature.
 * Centraliza a URL base (por ambiente) para que nenhuma feature precise
 * conhecer o host/porta do backend.
 *
 * Sprint 1: cobre apenas o necessário para consumir o endpoint de health check.
 * Sprint 2 em diante: interceptors cuidam de token JWT e normalização de erro
 * (ver core/interceptors), então os serviços de feature não precisam repetir
 * esse tratamento.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.buildUrl(path), { params: this.buildParams(params) })
      .pipe(map((response) => response.data));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.buildUrl(path), body)
      .pipe(map((response) => response.data));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(this.buildUrl(path), body)
      .pipe(map((response) => response.data));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(this.buildUrl(path), body)
      .pipe(map((response) => response.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.buildUrl(path))
      .pipe(map((response) => response.data));
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private buildParams(params?: Record<string, string | number | boolean>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    for (const [key, value] of Object.entries(params)) {
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
