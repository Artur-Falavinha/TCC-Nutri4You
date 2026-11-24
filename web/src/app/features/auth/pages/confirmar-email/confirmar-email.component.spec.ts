import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { RegisterFlowService } from '../../services/register-flow.service';
import { ConfirmarEmailComponent } from './confirmar-email.component';

describe('ConfirmarEmailComponent', () => {
  const token = '550e8400-e29b-41d4-a716-446655440000';
  const endpoint = environment.apiBaseUrl + '/auth/confirmar-email';
  let fixture: ComponentFixture<ConfirmarEmailComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;
  let rota: { snapshot: { fragment: string } };

  beforeEach(async () => {
    rota = { snapshot: { fragment: 'token=' + token } };
    await TestBed.configureTestingModule({
      imports: [ConfirmarEmailComponent],
      providers: [
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['sucesso', 'erro', 'aviso', 'informacao']) },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: rota }
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ConfirmarEmailComponent);
    pagina = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('aguarda o clique e oferece o login para nutricionistas confirmados', () => {
    http.expectNone(() => true, 'a página ainda está aguardando a ação do usuário');
    pagina.querySelector('button')?.click();
    const pedido = http.expectOne({ method: 'POST', url: endpoint });
    expect(pedido.request.body).toEqual({ token });
    pedido.flush({ data: { tipoUsuario: 'NUTRICIONISTA' } });
    fixture.detectChanges();

    expect(pagina.querySelector('h1')?.textContent).toContain('E-mail confirmado');
    expect(pagina.querySelector('a[href="/login"]')?.textContent).toContain('Ir para o login');
  });

  it('libera os dados do cadastro web após confirmar o endereço', () => {
    fixture.destroy();
    rota.snapshot.fragment = 'cadastro=' + token;
    fixture = TestBed.createComponent(ConfirmarEmailComponent);
    fixture.detectChanges();
    const fluxo = TestBed.inject(RegisterFlowService);
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
    const expiraEm = new Date(Date.now() + 1800000).toISOString();
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    const pedido = http.expectOne({ method: 'POST', url: environment.apiBaseUrl + '/cadastros/confirmar' });
    expect(pedido.request.body).toEqual({ token });
    pedido.flush({ data: { email: 'novo@example.test', tipoUsuario: 'NUTRICIONISTA', expiraEm } });

    expect(fluxo.getEmailConfirmado()).toEqual({ email: 'novo@example.test', tipoUsuario: 'NUTRICIONISTA', token, expiraEm });
    expect(navegar).toHaveBeenCalledWith(['/cadastro/dados'], { replaceUrl: true });
    fluxo.clear();
  });

  it('orienta o paciente confirmado a voltar ao aplicativo', () => {
    pagina.querySelector('button')?.click();
    http.expectOne(endpoint).flush({ data: { tipoUsuario: 'PACIENTE' } });
    fixture.detectChanges();

    expect(pagina.querySelector('[role="status"]')?.textContent).toContain('Volte ao aplicativo');
    expect(pagina.querySelector('a[href="/login"]')).toBeNull();
  });

  it('mostra uma saída para um link que já foi usado', () => {
    pagina.querySelector('button')?.click();
    http.expectOne(endpoint).flush(
      { status: 400, error: 'REQUISICAO_INVALIDA', message: 'Token inválido ou expirado.' },
      { status: 400, statusText: 'Bad Request' }
    );
    fixture.detectChanges();

    expect(pagina.querySelector('h1')?.textContent).toContain('Link indisponível');
    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain('já foi usado');
    expect(pagina.querySelector('button')).toBeNull();
  });
});
