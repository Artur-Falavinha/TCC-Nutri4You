import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['redefinirSenha', 'logout']);

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => '550e8400-e29b-41d4-a716-446655440000'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
  });

  it('exibe erro amigável para token inválido da API', () => {
    authService.redefinirSenha.and.returnValue(
      throwError(() => ({
        status: 400,
        error: 'REQUISICAO_INVALIDA',
        message: 'Token inválido ou expirado.'
      }))
    );

    fixture.componentInstance.form.setValue({
      senha: 'novaSenha123',
      confirmarSenha: 'novaSenha123'
    });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage).toContain('inválido');
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('redefine com o token do link e encerra a sessão local após a confirmação', fakeAsync(() => {
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
    authService.redefinirSenha.and.returnValue(of('Senha redefinida com sucesso.'));

    fixture.componentInstance.form.setValue({
      senha: 'novaSenha123',
      confirmarSenha: 'novaSenha123'
    });
    fixture.componentInstance.submit();

    expect(authService.redefinirSenha).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      'novaSenha123'
    );
    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.token).toBe('');
    tick(2000);
    expect(navegar).toHaveBeenCalledWith(['/login']);
  }));
});
