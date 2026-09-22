import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ApiErrorResponse } from '../models/api-response.model';
import { TokenStorageService } from '../services/token-storage.service';

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/recuperar-senha',
  '/auth/redefinir-senha',
  '/auth/confirmar-email',
  '/pacientes/autocadastro',
  '/nutricionistas/autocadastro',
  '/health'
];

function isPublicEndpoint(url: string): boolean {
  return PUBLIC_PATHS.some((path) => url.includes(path));
}

function shouldForceLogout(url: string): boolean {
  return !isPublicEndpoint(url) && !url.includes('/auth/login');
}

function resolveStatus(error: unknown): number | undefined {
  if (error instanceof HttpErrorResponse) {
    return error.status;
  }
  return (error as ApiErrorResponse)?.status;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  let authReq = req;
  const token = tokenStorage.getToken();

  if (token && !isPublicEndpoint(req.url)) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const status = resolveStatus(error);
      if (status === 401 && shouldForceLogout(req.url)) {
        tokenStorage.clear();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
