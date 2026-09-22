import { Injectable } from '@angular/core';

import { UserProfile } from '../models/auth.models';

const JWT_LS_ITEM = 'nutri4you.jwt';
const PERFIL_LS_ITEM = 'nutri4you.perfil';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getToken(): string | null {
    return localStorage.getItem(JWT_LS_ITEM);
  }

  setToken(token: string): void {
    localStorage.setItem(JWT_LS_ITEM, token);
  }

  getPerfil(): UserProfile | null {
    const perfil = localStorage.getItem(PERFIL_LS_ITEM);
    return perfil === 'NUTRICIONISTA' || perfil === 'PACIENTE' ? perfil : null;
  }

  setPerfil(perfil: UserProfile): void {
    localStorage.setItem(PERFIL_LS_ITEM, perfil);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  clear(): void {
    localStorage.removeItem(JWT_LS_ITEM);
    localStorage.removeItem(PERFIL_LS_ITEM);
  }
}
