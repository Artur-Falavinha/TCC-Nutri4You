import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterPasswordComponent } from './register-password.component';
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
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }, RegisterFlowService]
    }).compileComponents();

    registerFlow = TestBed.inject(RegisterFlowService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    registerFlow.saveDraft({
      nome: 'Nutri Teste',
      crn: 'CRN8-12345',
      email: 'nutri@teste.com',
      termsAccepted: true
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
