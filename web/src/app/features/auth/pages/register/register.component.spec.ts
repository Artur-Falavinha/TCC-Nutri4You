import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { VERSAO_TERMOS } from '../../../privacidade/privacidade.component';
import { RegisterFlowService } from '../../services/register-flow.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  it('exibe o PDF da versão atual e exige o aceite com a declaração para continuar', async () => {
    const cadastro = jasmine.createSpyObj<RegisterFlowService>(
      'RegisterFlowService', ['getEmailConfirmado', 'getDraft', 'saveDraft']
    );
    cadastro.getEmailConfirmado.and.returnValue({
      email: 'nutri@teste.com',
      tipoUsuario: 'NUTRICIONISTA',
      token: '550e8400-e29b-41d4-a716-446655440000',
      expiraEm: new Date(Date.now() + 60_000).toISOString()
    });
    cadastro.getDraft.and.returnValue(null);
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: RegisterFlowService, useValue: cadastro }]
    }).compileComponents();

    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const tela = TestBed.createComponent(RegisterComponent);
    tela.componentInstance.form.patchValue({ nome: 'Nutri Teste', crn: 'CRN-8 12345' });
    tela.detectChanges();

    const documento: HTMLElement = tela.nativeElement;
    const aceite = documento.querySelector<HTMLInputElement>('#terms')!;
    const termos = documento.querySelector<HTMLAnchorElement>('a[target="_blank"]')!;
    expect(termos.href).toContain(`/privacidade/termos/${VERSAO_TERMOS}`);
    expect(aceite.disabled).toBeFalse();
    tela.componentInstance.submit();
    expect(cadastro.saveDraft).not.toHaveBeenCalled();

    aceite.click();
    tela.componentInstance.submit();
    expect(cadastro.saveDraft).toHaveBeenCalledOnceWith({
      nome: 'Nutri Teste', crn: 'CRN8-12345', email: 'nutri@teste.com',
      termsAccepted: true, versaoTermos: VERSAO_TERMOS
    });
    expect(navegar).toHaveBeenCalledOnceWith(['/cadastro/senha']);
  });
});
