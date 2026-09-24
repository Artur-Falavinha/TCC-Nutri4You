import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from './api.service';

export const AUTH_TOKEN_KEY = 'nutri4you.accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  get authenticated(): boolean { return !!sessionStorage.getItem(AUTH_TOKEN_KEY); }
  login(email: string, senha: string) {
    return this.api.post<{ token: string; tipoUsuario: string }>('/auth/login', { email, senha }).pipe(
      tap(result => {
        if (result.tipoUsuario !== 'NUTRICIONISTA') {
          throw new Error('Acesso restrito a nutricionistas.');
        }
        sessionStorage.setItem(AUTH_TOKEN_KEY, result.token);
      })
    );
  }
  logout(): void { sessionStorage.removeItem(AUTH_TOKEN_KEY); }
}
