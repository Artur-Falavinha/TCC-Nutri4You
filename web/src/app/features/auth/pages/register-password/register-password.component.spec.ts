import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterPasswordComponent } from './register-password.component';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterFlowService } from '../../services/register-flow.service';

describe('RegisterPasswordComponent', () => {
  let fixture: ComponentFixture<RegisterPasswordComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let registerFlow: RegisterFlowService;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['autocadastrarNutricionista']);

    await TestBed.configureTestingModule({
      imports: [RegisterPasswordComponent],
      providers: [{ provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['erro']) }, provideRouter([]), { provide: AuthService, useValue: authService }, RegisterFlowService]
    }).compileComponents();

    registerFlow = TestBed.inject(RegisterFlowService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    registerFlow.guardarEmailConfirmado({
      email: 'nutri@teste.com',
      tipoUsuario: 'NUTRICIONISTA',
      token: '550e8400-e29b-41d4-a716-446655440000',
      expiraEm: new Date(Date.now() + 3600000).toISOString()
    });

    registerFlow.saveDraft({
      nome: 'Nutri Teste',
      crn: 'CRN8-12345',
      email: 'nutri@teste.com',
      termsAccepted: true,
      versaoTermos: '2026-11-22'
    });

    fixture = TestBed.createComponent(RegisterPasswordComponent);
    fixture.detectChanges();
  });

  it('navega para login após autocadastro bem-sucedido', () => {
    authService.autocadastrarNutricionista.and.returnValue(of('Nutricionista cadastrado com sucesso!'));

    fixture.componentInstance.form.setValue({
      senha: 'senhaSegura123',
      confirmarSenha: 'senhaSegura123'
    });
    fixture.componentInstance.submit();

    expect(authService.autocadastrarNutricionista).toHaveBeenCalledWith(jasmine.objectContaining({
      email: 'nutri@teste.com', tokenCadastro: '550e8400-e29b-41d4-a716-446655440000', crnDeclarado: true
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { cadastro: 'ok' } });
  });

  it('permanece na tela quando autocadastro falha', () => {
    authService.autocadastrarNutricionista.and.returnValue(
      throwError(() => ({
        status: 400,
        error: 'REQUISICAO_INVALIDA',
        message: 'E-mail já está em uso no sistema.'
      }))
    );

    fixture.componentInstance.form.setValue({
      senha: 'senhaSegura123',
      confirmarSenha: 'senhaSegura123'
    });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage).toContain('E-mail já está em uso');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
