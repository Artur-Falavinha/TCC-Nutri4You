import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiErrorResponse } from '../models/api-response.model';

/**
 * Normaliza qualquer erro HTTP no formato ApiErrorResponse, para que
 * componentes e serviços de feature não precisem tratar HttpErrorResponse
 * diretamente. Alinhado ao "tratamento padrão de respostas" da API (RNF09/RNF10).
 *
 * Registrado em app.config.ts via provideHttpClient(withInterceptors([...])).
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error;
      const normalized: ApiErrorResponse = {
        status: error.status,
        error:
          typeof body === 'object' && body !== null && 'error' in body
            ? String((body as ApiErrorResponse).error)
            : error.status === 0
              ? 'ERRO_REDE'
              : error.statusText || 'ERRO_DESCONHECIDO',
        message:
          typeof body === 'object' && body !== null && 'message' in body
            ? String((body as ApiErrorResponse).message)
            : 'Não foi possível completar a requisição.',
        path: req.url,
        timestamp: new Date().toISOString()
      };
      return throwError(() => normalized);
    })
  );
};
