import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Agenda, ClinicoService } from '../clinico/clinico.service';
import { NotificacaoConsulta, NotificacoesService } from '../notificacoes/notificacoes.service';
import { DashboardComponent } from './dashboard.component';

const agendaVazia: Agenda = {
  hoje: [], semana: [], totalSemana: 0, sexo: [], faixaEtaria: [], ultimos12Meses: [], totalConsultas12Meses: 0
};

function solicitacao(id: number): NotificacaoConsulta {
  return { id, pacienteId: id, pacienteNome: `Paciente ${id}`, dataHora: '2026-11-20T09:00:00', versao: 0 };
}

describe('DashboardComponent — solicitações de consulta pendentes', () => {
  function criar(itens: NotificacaoConsulta[]) {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ClinicoService, useValue: { agenda: () => of(agendaVazia) } },
        { provide: NotificacoesService, useValue: { listar: () => of(itens), listarVinculos: () => of([]) } }
      ]
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    return fixture;
  }

  it('destaca na tela inicial o aviso com link para as notificações quando há solicitações pendentes', fakeAsync(() => {
    const fixture = criar([solicitacao(1), solicitacao(2)]);

    const aviso = fixture.nativeElement.querySelector('[data-testid="solicitacoes-pendentes"]') as HTMLAnchorElement;
    expect(aviso).not.toBeNull();
    expect(aviso.textContent).toContain('2 solicitações de consulta aguardando sua confirmação');
    expect(aviso.getAttribute('href')).toBe('/notificacoes');
    discardPeriodicTasks();
  }));

  it('usa o singular quando existe uma única solicitação', fakeAsync(() => {
    const fixture = criar([solicitacao(1)]);

    expect(fixture.nativeElement.querySelector('[data-testid="solicitacoes-pendentes"]').textContent)
      .toContain('1 solicitação de consulta aguardando sua confirmação');
    discardPeriodicTasks();
  }));

  it('não exibe o aviso quando não há solicitações pendentes', fakeAsync(() => {
    const fixture = criar([]);

    expect(fixture.nativeElement.querySelector('[data-testid="solicitacoes-pendentes"]')).toBeNull();
    discardPeriodicTasks();
  }));
});

