import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AUTH_TOKEN_KEY } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  const apiRequest = request.url.startsWith(environment.apiBaseUrl + '/');
  return next(token && apiRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request);
};
