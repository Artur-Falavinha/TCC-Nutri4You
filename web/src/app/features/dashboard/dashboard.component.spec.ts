import { Type } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Agenda, ClinicoService } from '../clinico/clinico.service';
import { NotificacoesComponent } from '../notificacoes/notificacoes.component';
import { NotificacaoConsulta, NotificacaoVinculo } from '../notificacoes/notificacoes.service';
import { DashboardComponent } from './dashboard.component';

const agendaVazia: Agenda = {
  hoje: [], semana: [], totalSemana: 0, sexo: [], faixaEtaria: [], ultimos12Meses: [], totalConsultas12Meses: 0
};
const consulta: NotificacaoConsulta = {
  id: 1, pacienteId: 1, pacienteNome: 'Paciente de teste', dataHora: '2026-11-20T09:00:00', versao: 0,
  avulsa: true, tipo: 'PRIMEIRA_CONSULTA', duracaoMinutos: 45
};
const vinculo: NotificacaoVinculo = { id: 1, pacienteNome: 'Outro paciente', versao: 0 };

describe('Badge de notificações do nutricionista', () => {
  let usuarioId: number;
  let consultas: NotificacaoConsulta[];
  let vinculos: NotificacaoVinculo[];
  let indisponivel: boolean;

  beforeEach(() => {
    usuarioId = 910761;
    consultas = [consulta];
    vinculos = [vinculo];
    indisponivel = false;
    TestBed.configureTestingModule({
      imports: [DashboardComponent, NotificacoesComponent],
      providers: [
        provideRouter([]),
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['sucesso', 'erro']) },
        { provide: ClinicoService, useValue: { agenda: () => of(agendaVazia) } },
        { provide: AuthService, useValue: { fetchMe: () => of({ id: usuarioId }) } },
        { provide: ApiService, useValue: {
          get: (rota: string) => indisponivel
            ? throwError(() => ({ message: 'Notificações indisponíveis' }))
            : of(rota.endsWith('/vinculos') ? vinculos : consultas)
        } }
      ]
    });
  });

  afterEach(() => {
    for (const id of [910761, 910762]) {
      localStorage.removeItem(`nutri4you.notificacoes.vistas.${id}`);
    }
  });

  function abrir<T>(componente: Type<T>) {
    const tela = TestBed.createComponent(componente);
    tela.detectChanges();
    tick(0);
    tela.detectChanges();
    return tela;
  }

  it('concentra o aviso no sino com a contagem de consultas e vínculos não vistos', fakeAsync(() => {
    const tela = abrir(DashboardComponent);
    const sino: HTMLAnchorElement = tela.nativeElement.querySelector('app-notification-bell a');
    expect(tela.nativeElement.querySelector('[data-testid="solicitacoes-pendentes"]')).toBeNull();
    expect(sino.getAttribute('href')).toBe('/notificacoes');
    expect(sino.getAttribute('aria-label')).toBe('Notificações, 2 não lidas');
    expect(sino.querySelector('.badge')?.textContent?.trim()).toBe('2');
    tela.destroy();
  }));

  it('limpa o badge após carregar a lista e indica uma nova versão de consulta', fakeAsync(() => {
    const notificacoes = abrir(NotificacoesComponent);
    expect(notificacoes.nativeElement.textContent).toContain('Paciente de teste solicitou uma consulta');
    expect(notificacoes.nativeElement.textContent).toContain('Outro paciente solicitou um vínculo');
    notificacoes.destroy();

    const tela = abrir(DashboardComponent);
    const sino: HTMLAnchorElement = tela.nativeElement.querySelector('app-notification-bell a');
    expect(sino.querySelector('.badge')).toBeNull();
    consultas = [{ ...consulta, versao: 1 }];
    tick(30_000);
    tela.detectChanges();
    expect(sino.querySelector('.badge')?.textContent?.trim()).toBe('1');
    expect(sino.getAttribute('aria-label')).toBe('Notificações, 1 não lida');
    tela.destroy();

    usuarioId = 910762;
    const outraConta = abrir(DashboardComponent);
    expect(outraConta.nativeElement.querySelector('.badge')?.textContent?.trim()).toBe('2');
    outraConta.destroy();
  }));

  it('preserva o aviso quando a página de notificações falha ao carregar', fakeAsync(() => {
    indisponivel = true;
    const notificacoes = abrir(NotificacoesComponent);
    expect(notificacoes.nativeElement.textContent).toContain('Notificações indisponíveis');
    notificacoes.destroy();

    indisponivel = false;
    const tela = abrir(DashboardComponent);
    expect(tela.nativeElement.querySelector('.badge')?.textContent?.trim()).toBe('2');
    tela.destroy();
  }));

  it('distingue as consultas e avisa sobre o vínculo antes do aceite', fakeAsync(() => {
    consultas = [
      consulta,
      { ...consulta, id: 2, avulsa: false, tipo: 'ACOMPANHAMENTO' },
      { ...consulta, id: 3, avulsa: false, tipo: 'REAGENDAMENTO' },
      { ...consulta, id: 4, avulsa: false, tipo: 'CONSULTA' }
    ];
    const tela = abrir(NotificacoesComponent);
    const painel: HTMLElement = tela.nativeElement;
    const rotulos = [...painel.querySelectorAll('.tipo-solicitacao')].map(item => item.textContent?.trim());
    expect(rotulos).toEqual([
      'Acompanhamento nutricional', 'Primeira consulta', 'Consulta de acompanhamento', 'Reagendamento', 'Solicitação de consulta'
    ]);
    expect(painel.querySelector('.horario-consulta')?.textContent).toContain('45 min');
    expect(painel.querySelectorAll('.aviso-vinculo').length).toBe(1);
    expect(painel.querySelector('.aviso-vinculo')?.textContent).toContain('ativa o vínculo com o paciente');
    expect(painel.querySelector('.acoes[aria-describedby]')?.getAttribute('aria-describedby')).toBe('aviso-vinculo-1');
    tela.destroy();
  }));
});
