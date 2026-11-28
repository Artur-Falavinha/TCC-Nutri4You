import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ToastService } from '../../../core/services/toast.service';
import { PacientesService } from '../../../core/services/pacientes.service';
import { ConsultasComponent } from './consultas.component';
import { Consulta, ConsultasService } from './consultas.service';

describe('ConsultasComponent', () => {
  let fixture: ComponentFixture<ConsultasComponent>;
  let component: ConsultasComponent;
  let consultas: jasmine.SpyObj<ConsultasService>;

  const consultaEmAndamento: Consulta = {
    id: 90,
    idPaciente: 12,
    dataHora: '2025-01-15T14:30:00',
    status: 'CONFIRMADA',
    observacao: null,
    versao: 3,
    iniciadaEm: '2025-01-15T14:30:00-03:00',
    podeIniciar: false,
    avaliacao: null,
    contextoClinico: null
  };

  const consultaConcluida: Consulta = {
    ...consultaEmAndamento,
    status: 'REALIZADA',
    versao: 4
  };

  beforeEach(async () => {
    consultas = jasmine.createSpyObj('ConsultasService', ['buscar', 'listar', 'salvar', 'acao', 'verificarAcesso']);
    consultas.buscar.and.returnValues(of(consultaEmAndamento), of(consultaConcluida));
    consultas.salvar.and.returnValue(of(consultaConcluida));
    consultas.verificarAcesso.and.returnValue(of(undefined));
    await TestBed.configureTestingModule({
      imports: [ConsultasComponent],
      providers: [
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['sucesso', 'erro', 'aviso', 'informacao']) },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '12', consultaId: '90' }),
              queryParamMap: convertToParamMap({}),
              data: { editor: true }
            }
          }
        },
        { provide: PacientesService, useValue: jasmine.createSpyObj('PacientesService', { buscarPorId: of({ id: 12, nome: 'Paciente de teste' }), carregarFoto: of(null) }) },
        { provide: ConsultasService, useValue: consultas },
      ]
    }).compileComponents();

    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.form.status = 'REALIZADA';
    component.form.medidas.peso = '70';
    component.form.medidas.altura = '170';
  });

  it('mantém aprovação na lista sem abrir consulta pendente e permite abrir após aprovar', () => {
    fixture.destroy();
    TestBed.inject(ActivatedRoute).snapshot.data['editor'] = false;
    consultas.listar.and.returnValue(of({ pagina: 0, total: 2, totalPaginas: 1, itens: [
      { ...consultaEmAndamento, id: 91, status: 'AGUARDANDO_CONFIRMACAO', iniciadaEm: null },
      consultaEmAndamento
    ] }));
    fixture = TestBed.createComponent(ConsultasComponent);
    fixture.detectChanges();
    const linhas = fixture.nativeElement.querySelectorAll('.consulta-row') as NodeListOf<HTMLElement>;
    expect(linhas[0].textContent).toContain('Confirmar');
    expect(linhas[0].textContent).toContain('Recusar');
    expect(linhas[0].textContent).not.toContain('Cancelar');
    expect(linhas[0].querySelector('a[aria-label^="Abrir consulta"]')).toBeNull();
    expect(linhas[1].querySelector('a[aria-label^="Abrir consulta"]')).not.toBeNull();
  });

  it('exibe data e hora da consulta em formato brasileiro e mantém o ISO ao salvar', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    const pagina = fixture.nativeElement as HTMLElement;
    expect(pagina.querySelector('.consulta-meta time')?.textContent).toContain('15/01/2025 14:30');
    expect(pagina.querySelector('#dataHora')).toBeNull();
    expect(component.form.payload().dataHora).toBe(consultaEmAndamento.dataHora);
  }));

  it('liga o seletor ao campo de gordura e apresenta a explicação junto ao input', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    const pagina = fixture.nativeElement as HTMLElement;
    const seletor = pagina.querySelector<HTMLSelectElement>('#modoPercentualGordura')!;
    const gordura = pagina.querySelector<HTMLInputElement>('#percentualGordura')!;
    expect(seletor.selectedOptions[0].textContent?.trim()).toBe('Informar manualmente');
    expect(gordura.readOnly).toBeFalse();
    expect(gordura.disabled).toBeFalse();
    for (const id of ['imc', 'massaMagraKg', 'massaGordaKg']) {
      const campo = pagina.querySelector<HTMLInputElement>(`#${id}`)!;
      expect(campo.disabled).withContext(id).toBeTrue();
      campo.focus();
      expect(document.activeElement).not.toBe(campo);
    }
    expect(pagina.querySelector('#imc-help')?.textContent).toContain('Calculado automaticamente.');

    seletor.value = 'AUTOMATICO';
    seletor.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(gordura.readOnly).toBeTrue();
    expect(gordura.disabled).toBeTrue();
    expect(gordura.getAttribute('aria-describedby')).toBe('percentualGordura-help');
    expect(pagina.querySelector('#percentualGordura-help')?.textContent).toContain('Preencha as sete pregas');
    expect(pagina.querySelector<HTMLInputElement>('#massaGordaKg')?.readOnly).toBeTrue();

    seletor.value = 'MANUAL';
    seletor.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(gordura.disabled).toBeFalse();
    expect(gordura.readOnly).toBeFalse();
  }));

  it('permite concluir a consulta iniciada e bloqueia novas alterações após salvar', () => {
    component.salvar(true);
    fixture.detectChanges();

    expect(consultas.salvar).toHaveBeenCalledOnceWith(12, 90, jasmine.objectContaining({ status: 'REALIZADA' }));
    expect(component.consultaAtual?.status).toBe('REALIZADA');
    expect(component.podeEditar).toBeFalse();
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).toBeNull();
    component.salvar();
    expect(consultas.salvar).toHaveBeenCalledTimes(1);
  });

  it('salva andamento sem medidas, permite sair e recupera os dados ao reabrir', () => {
    component.form.medidas.peso = '';
    component.form.medidas.altura = '';
    component.form.observacao = 'Continuar avaliação depois';
    const salva = { ...consultaEmAndamento, observacao: component.form.observacao, versao: 4 };
    consultas.salvar.and.returnValue(of(salva));
    component.salvar();
    expect(consultas.salvar).toHaveBeenCalledOnceWith(12, 90, jasmine.objectContaining({ status: 'CONFIRMADA', avaliacao: null }));
    expect(component.podeEditar).toBeTrue();
    expect(component.alterado).toBeFalse();
    expect(component.podeSair()).toBeTrue();
    consultas.buscar.and.returnValue(of(salva));
    component.carregar();
    expect(component.form.observacao).toBe('Continuar avaliação depois');
    expect(component.statusLabel(component.consultaAtual!.status, component.consultaAtual!.iniciadaEm)).toBe('Em atendimento');
  });

  it('exige medidas para concluir e mantém a consulta em andamento quando inválida', () => {
    component.form.medidas.peso = '';
    component.form.medidas.altura = '';
    component.salvar(true);
    expect(consultas.salvar).not.toHaveBeenCalled();
    expect(component.errors['peso']).toBeTruthy();
    expect(component.podeEditar).toBeTrue();
  });

  it('abre consulta concluída somente para leitura e não envia alterações', fakeAsync(() => {
    fixture.destroy();
    consultas.buscar.and.returnValue(of(consultaConcluida));
    fixture = TestBed.createComponent(ConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const pagina = fixture.nativeElement as HTMLElement;
    expect(pagina.textContent).toContain('Consulta concluída — somente leitura.');
    expect(pagina.querySelector<HTMLFieldSetElement>('fieldset')?.disabled).toBeTrue();
    expect(pagina.querySelector('button[type="submit"]')).toBeNull();
    expect(pagina.querySelector<HTMLInputElement>('#peso')?.matches(':disabled')).toBeTrue();
    component.form.status = 'CONFIRMADA';
    component.form.observacao = 'Tentativa de alteração';
    component.salvar();
    expect(consultas.salvar).not.toHaveBeenCalled();
  }));

  it('informa o encerramento e remove o formulário durante o atendimento aberto', fakeAsync(() => {
    fixture.destroy();
    consultas.buscar.and.returnValue(of(consultaEmAndamento));
    consultas.verificarAcesso.and.returnValue(throwError(() => ({
      status: 403,
      error: 'VINCULO_ENCERRADO',
      message: 'O vínculo com este paciente foi encerrado.'
    })));
    fixture = TestBed.createComponent(ConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.form.observacao = 'Anotação temporária';

    tick(15_000);
    fixture.detectChanges();

    const pagina = fixture.nativeElement as HTMLElement;
    expect(consultas.verificarAcesso).toHaveBeenCalledOnceWith(12, 90);
    expect(pagina.textContent).toContain('O vínculo com este paciente foi encerrado.');
    expect(pagina.querySelector('form')).toBeNull();
    expect(pagina.querySelector('a[href="/pacientes"]')).not.toBeNull();
    expect(component.form.observacao).toBe('');
    expect(component.podeSair()).toBeTrue();
    fixture.destroy();
  }));
});
