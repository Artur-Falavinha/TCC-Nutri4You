import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let api: jasmine.SpyObj<ApiService>;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['post', 'get']);
    tokenStorage = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'setToken',
      'setPerfil',
      'clear',
      'getToken',
      'getPerfil',
      'isAuthenticated'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: api },
        { provide: TokenStorageService, useValue: tokenStorage }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('login grava token somente após confirmar perfil nutricionista', () => {
    api.post.and.returnValue(of({ token: 'jwt-token', tipoUsuario: 'NUTRICIONISTA' }));
    api.get.and.returnValue(
      of({ id: 1, nome: 'Nutri', email: 'nutri@teste.com', perfil: 'NUTRICIONISTA' })
    );

    service.login('nutri@teste.com', 'senha123').subscribe();

    expect(tokenStorage.setToken).toHaveBeenCalledWith('jwt-token');
    expect(tokenStorage.setPerfil).toHaveBeenCalledWith('NUTRICIONISTA');
  });

  it('login de paciente não persiste token', () => {
    api.post.and.returnValue(of({ token: 'jwt-token', tipoUsuario: 'PACIENTE' }));
    api.get.and.returnValue(
      of({ id: 2, nome: 'Paciente', email: 'p@teste.com', perfil: 'PACIENTE' })
    );

    service.login('p@teste.com', 'senha123').subscribe({
      error: () => undefined
    });

    expect(tokenStorage.setToken).not.toHaveBeenCalled();
    expect(tokenStorage.setPerfil).not.toHaveBeenCalled();
  });

  it('autocadastro chama endpoint público correto', () => {
    api.post.and.returnValue(of({ mensagem: 'ok' }));

    service
      .autocadastrarNutricionista({
        nome: 'Nutri',
        email: 'n@teste.com',
        senha: 'senha12345',
        crn: 'CRN8-12345'
      })
      .subscribe();

    expect(api.post).toHaveBeenCalledWith('/nutricionistas/autocadastro', {
      nome: 'Nutri',
      email: 'n@teste.com',
      senha: 'senha12345',
      crn: 'CRN8-12345'
    });
  });

  it('login propaga erro quando fetchMe falha', () => {
    api.post.and.returnValue(of({ token: 'jwt-token', tipoUsuario: 'NUTRICIONISTA' }));
    api.get.and.returnValue(throwError(() => new Error('401')));

    let failed = false;
    service.login('nutri@teste.com', 'senha123').subscribe({
      error: () => {
        failed = true;
      }
    });

    expect(failed).toBeTrue();
    expect(tokenStorage.setToken).not.toHaveBeenCalled();
  });
});
