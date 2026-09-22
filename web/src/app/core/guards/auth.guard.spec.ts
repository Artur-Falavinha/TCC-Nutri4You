import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['fetchMe']);
    tokenStorage = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'isAuthenticated',
      'setPerfil',
      'clear'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: TokenStorageService, useValue: tokenStorage },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('redireciona para login sem token', () => {
    tokenStorage.isAuthenticated.and.returnValue(false);
    router.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as never, {} as never);
      expect(result).toBeTruthy();
    });

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('sincroniza perfil após fetchMe', (done) => {
    tokenStorage.isAuthenticated.and.returnValue(true);
    authService.fetchMe.and.returnValue(
      of({ id: 1, nome: 'Nutri', email: 'n@teste.com', perfil: 'NUTRICIONISTA' })
    );

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as never, {} as never);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((allowed) => {
          expect(allowed).toBeTrue();
          expect(tokenStorage.setPerfil).toHaveBeenCalledWith('NUTRICIONISTA');
          done();
        });
      } else {
        fail('Esperava Observable do guard');
        done();
      }
    });
  });
});
