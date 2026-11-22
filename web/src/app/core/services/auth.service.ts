import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap, throwError } from 'rxjs';

import {
  CadastroEmailConfirmado,
  ConfirmacaoEmailResponse,
  LoginResponse,
  MensagemResponse,
  NutricionistaCadastroPayload,
  UsuarioInfo
} from '../models/auth.models';
import { ApiErrorResponse } from '../models/api-response.model';
import { ApiService } from './api.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenStorage = inject(TokenStorageService);

  login(email: string, senha: string): Observable<UsuarioInfo> {
    return this.api.post<LoginResponse>('/auth/login', { email, senha }).pipe(
      switchMap((response) => {
        const token = response.token;
        return this.api.get<UsuarioInfo>('/usuarios/me', {
          headers: { Authorization: `Bearer ${token}` }
        }).pipe(
          switchMap((usuario) => {
            if (usuario.perfil !== 'NUTRICIONISTA') {
              return throwError(() =>
                this.buildClientError(
                  'Acesso web disponível apenas para nutricionistas. Pacientes devem usar o aplicativo mobile.'
                )
              );
            }
            this.tokenStorage.setToken(token);
            this.tokenStorage.setPerfil(usuario.perfil);
            return of(usuario);
          })
        );
      })
    );
  }

  fetchMe(): Observable<UsuarioInfo> {
    return this.api.get<UsuarioInfo>('/usuarios/me');
  }

  logout(): void {
    this.tokenStorage.clear();
  }

  get authenticated(): boolean {
    return this.isAuthenticatedNutricionista();
  }

  solicitarRecuperacaoSenha(email: string): Observable<string> {
    return this.api
      .post<MensagemResponse>('/auth/recuperar-senha', { email })
      .pipe(map((response) => response.mensagem ?? 'Solicitação enviada.'));
  }

  iniciarCadastro(email: string): Observable<MensagemResponse> {
    return this.api.post<MensagemResponse>('/cadastros/iniciar', { email, tipoUsuario: 'NUTRICIONISTA' });
  }

  confirmarCadastro(token: string): Observable<CadastroEmailConfirmado> {
    return this.api.post<CadastroEmailConfirmado>('/cadastros/confirmar', { token });
  }

  confirmarEmail(token: string): Observable<ConfirmacaoEmailResponse> {
    return this.api.post<ConfirmacaoEmailResponse>('/auth/confirmar-email', { token });
  }

  redefinirSenha(token: string, senha: string): Observable<string> {
    return this.api
      .post<MensagemResponse>('/auth/redefinir-senha', { token, senha })
      .pipe(map((response) => response.mensagem ?? 'Senha redefinida com sucesso.'));
  }

  autocadastrarNutricionista(payload: NutricionistaCadastroPayload): Observable<string> {
    return this.api
      .post<MensagemResponse>('/nutricionistas/autocadastro', payload)
      .pipe(map((response) => response.mensagem ?? 'Conta criada com sucesso!'));
  }

  isAuthenticatedNutricionista(): boolean {
    return this.tokenStorage.isAuthenticated() && this.tokenStorage.getPerfil() === 'NUTRICIONISTA';
  }

  private buildClientError(message: string): ApiErrorResponse {
    return {
      status: 0,
      error: 'ACESSO_NEGADO_CLIENTE',
      message
    };
  }
}
