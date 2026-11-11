import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { AnamneseService } from '../../anamnese/anamnese.service';
import { DietaService } from '../../dieta/dieta.service';
import { Plano } from '../../dieta/dieta.models';
import { PacientesService } from '../../../core/services/pacientes.service';
import { ConsultasComponent } from './consultas.component';
import { AtendimentoClinico, AtendimentosService, ConsultasService } from './consultas.service';

describe('ConsultasComponent', () => {
  let fixture: ComponentFixture<ConsultasComponent>;
  let component: ConsultasComponent;
  let atendimentos: jasmine.SpyObj<AtendimentosService>;
  let dieta: jasmine.SpyObj<DietaService>;
  let anamnese: jasmine.SpyObj<AnamneseService>;

  const atendimentoEmAndamento: AtendimentoClinico = {
    id: 90,
    idPaciente: 12,
    dataHora: '2025-01-15T14:30:00',
    status: 'CONFIRMADA',
    observacao: null,
    versao: 3,
    iniciadaEm: '2025-01-15T14:30:00-03:00',
    inicioPermitidoDe: '2025-01-15T14:15:00-03:00',
    inicioPermitidoAte: '2025-01-15T14:45:00-03:00',
    podeIniciar: false,
    avaliacao: null,
    pacienteNome: 'Paciente de teste',
    pacienteId: 12,
    janelaInicio: '2025-01-15T14:15:00-03:00',
    janelaFim: '2025-01-15T14:45:00-03:00',
    contextoClinico: null
  };

  const atendimentoConcluido: AtendimentoClinico = {
    ...atendimentoEmAndamento,
    status: 'REALIZADA',
    versao: 4
  };

  const dietaRascunho: Plano = {
    id: 21,
    pacienteId: 12,
    nutricionistaId: 5,
    nutricionistaNome: 'Nutricionista de teste',
    titulo: 'Plano em rascunho',
    orientacoes: null,
    status: 'RASCUNHO',
    versao: 1,
    vigenciaInicio: null,
    vigenciaFim: null,
    publicadoEm: null,
    metas: null,
    totais: { kcal: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: null },
    refeicoes: []
  };

  beforeEach(async () => {
    atendimentos = jasmine.createSpyObj('AtendimentosService', ['buscar', 'salvar']);
    atendimentos.buscar.and.returnValues(of(atendimentoEmAndamento), of(atendimentoConcluido));
    atendimentos.salvar.and.returnValue(of(atendimentoConcluido));
    dieta = jasmine.createSpyObj('DietaService', ['listarPlanos']);
    dieta.listarPlanos.and.returnValue(of([dietaRascunho]));
    anamnese = jasmine.createSpyObj('AnamneseService', ['fields']);
    anamnese.fields.and.returnValue(of([]));

    const router = {
      navigate: jasmine.createSpy('navigate'),
      lastSuccessfulNavigation: null
    } as unknown as Router;

    await TestBed.configureTestingModule({
      imports: [ConsultasComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '12', consultaId: '90' }),
              queryParamMap: convertToParamMap({}),
              data: { atendimento: true, editor: true }
            }
          }
        },
        { provide: Router, useValue: router },
        { provide: PacientesService, useValue: jasmine.createSpyObj('PacientesService', ['buscarPorId']) },
        { provide: ConsultasService, useValue: jasmine.createSpyObj('ConsultasService', ['buscar', 'listar', 'salvar', 'acao']) },
        { provide: AtendimentosService, useValue: atendimentos },
        { provide: AnamneseService, useValue: anamnese },
        { provide: DietaService, useValue: dieta }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.form.status = 'REALIZADA';
    component.form.medidas.peso = '70';
    component.form.medidas.altura = '170';
  });

  it('asks before completing an appointment with a draft and preserves it as read only', () => {
    component.salvar();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const dialog = root.querySelector('app-paciente-dialog [role="dialog"]');
    expect(dialog?.textContent).toContain('preservado sem publicação');
    expect(dialog?.textContent).toContain('somente para leitura');
    expect(dieta.listarPlanos).toHaveBeenCalledOnceWith(12, 90);
    expect(atendimentos.salvar).not.toHaveBeenCalled();

    const confirm = Array.from(root.querySelectorAll<HTMLButtonElement>('app-paciente-dialog button'))
      .find(button => button.textContent?.trim() === 'Concluir e manter rascunho');
    expect(confirm).toBeTruthy();
    confirm!.click();
    fixture.detectChanges();

    expect(atendimentos.salvar).toHaveBeenCalledOnceWith(90, jasmine.objectContaining({ status: 'REALIZADA' }));
    expect(root.querySelector('app-paciente-dialog')).toBeNull();
    expect(component.consultaAtual?.status).toBe('REALIZADA');
    expect(component.podeEditar).toBeFalse();
  });

  it('returns to the appointment without completing or discarding the draft', () => {
    component.salvar();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const back = Array.from(root.querySelectorAll<HTMLButtonElement>('app-paciente-dialog button'))
      .find(button => button.textContent?.trim() === 'Voltar ao atendimento');
    expect(back).toBeTruthy();
    back!.click();
    fixture.detectChanges();

    expect(root.querySelector('app-paciente-dialog')).toBeNull();
    expect(component.form.status).toBe('REALIZADA');
    expect(atendimentos.salvar).not.toHaveBeenCalled();
  });

  it('completes without opening the warning when there is no draft', () => {
    dieta.listarPlanos.and.returnValue(of([]));

    component.salvar();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-paciente-dialog')).toBeNull();
    expect(atendimentos.salvar).toHaveBeenCalledOnceWith(90, jasmine.objectContaining({ status: 'REALIZADA' }));
  });
});
