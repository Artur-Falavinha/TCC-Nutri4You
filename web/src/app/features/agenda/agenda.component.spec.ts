import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';
import { AgendaComponent } from './agenda.component';

describe('AgendaComponent — cópia de disponibilidade', () => {
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'put']);
    TestBed.configureTestingModule({
      imports: [AgendaComponent],
      providers: [{ provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['sucesso', 'erro', 'aviso', 'informacao']) }, { provide: ApiService, useValue: api }]
    });
  });

  it('mantém horários do destino, ignora duplicatas e só grava ao salvar', () => {
    const inicial = [
      { diaSemana: 1, horario: '08:00:00' },
      { diaSemana: 1, horario: '08:45:00' },
      { diaSemana: 2, horario: '08:00:00' },
      { diaSemana: 2, horario: '13:00:00' }
    ];
    const esperado = [
      { diaSemana: 1, horario: '08:00' },
      { diaSemana: 1, horario: '08:45' },
      { diaSemana: 2, horario: '08:00' },
      { diaSemana: 2, horario: '08:45' },
      { diaSemana: 2, horario: '13:00' }
    ];
    api.get.and.returnValue(of(inicial));
    api.put.and.returnValue(of(esperado));

    const agenda = TestBed.createComponent(AgendaComponent).componentInstance;
    agenda.ngOnInit();
    agenda.alternarCopia();
    agenda.selecionarDestino(2, true);
    agenda.copiarHorarios();

    expect(agenda.alterado()).toBeTrue();
    expect(api.put).not.toHaveBeenCalled();
    agenda.salvar();
    expect(api.put).toHaveBeenCalledOnceWith('/agenda-nutricionista/horarios', esperado);
    expect(agenda.alterado()).toBeFalse();
  });

  it('mantém o rascunho intacto quando a cópia ultrapassa o limite semanal', () => {
    api.get.and.returnValue(of(Array.from({ length: 224 }, (_, minuto) => ({
      diaSemana: 1,
      horario: `${String(Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`
    }))));
    const agenda = TestBed.createComponent(AgendaComponent).componentInstance;
    agenda.ngOnInit();
    agenda.alternarCopia();
    agenda.selecionarDestino(2, true);
    agenda.copiarHorarios();

    const toast = TestBed.inject(ToastService);
    expect(toast.aviso).toHaveBeenCalledWith(jasmine.stringContaining('224 horários'));
    expect(agenda.totalHorarios()).toBe(224);
    expect(agenda.alterado()).toBeFalse();
  });
});
