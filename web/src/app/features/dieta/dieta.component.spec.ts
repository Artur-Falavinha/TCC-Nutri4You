import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { Paciente } from '../../core/models/paciente.models';
import { PacientesService } from '../../core/services/pacientes.service';
import { DietaComponent } from './dieta.component';
import { DietaService } from './dieta.service';
import { Alimento, Nutrientes, PaginaAlimentos, Plano } from './dieta.models';

describe('DietaComponent', () => {
  let fixture: ComponentFixture<DietaComponent>;
  let component: DietaComponent;
  let dieta: jasmine.SpyObj<DietaService>;
  let pacientes: jasmine.SpyObj<PacientesService>;

  const paciente: Paciente = {
    id: 12,
    nome: 'Paciente de teste',
    email: 'paciente@example.test'
  };
  const alimento: Alimento = {
    id: 40,
    codigoTaco: 1001,
    nome: 'Arroz cozido',
    categoria: 'Cereais',
    kcal100g: 120,
    proteina100g: 2.5,
    carboidratos100g: 25,
    gordura100g: 0.5,
    fonte: 'TACO',
    versaoFonte: '4ª edição',
    observacaoFonte: null,
    disponivelParaPrescricao: true
  };
  const nutrientes: Nutrientes = { kcal: 150.6, proteinas: 3.14, carboidratos: 31.38, gorduras: 0.63 };
  const planoSalvo: Plano = {
    id: 76,
    pacienteId: paciente.id,
    nutricionistaId: 3,
    nutricionistaNome: 'Nutricionista de teste',
    titulo: 'Plano de teste',
    orientacoes: null,
    status: 'RASCUNHO',
    versao: 0,
    vigenciaInicio: null,
    vigenciaFim: null,
    publicadoEm: null,
    metas: null,
    totais: nutrientes,
    refeicoes: [{
      id: 1,
      nome: 'Café da manhã',
      horario: '08:00',
      itens: [{ alimento, quantidadeGramas: 125.5, nutrientes }],
      totais: nutrientes
    }]
  };

  function paginaAlimentos(alimentos: Alimento[]): PaginaAlimentos {
    return {
      alimentos,
      pagina: 0,
      tamanho: 20,
      totalElementos: alimentos.length,
      totalPaginas: 1
    };
  }

  async function preencherNumero(seletor: string, valor: number): Promise<void> {
    const input = fixture.nativeElement.querySelector(seletor) as HTMLInputElement;
    input.value = String(valor);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    pacientes = jasmine.createSpyObj('PacientesService', ['buscarPorId']);
    pacientes.buscarPorId.and.returnValue(of(paciente));

    dieta = jasmine.createSpyObj('DietaService', [
      'listarAlimentos',
      'listarCategorias',
      'listarPlanos',
      'buscarPlano',
      'criarPlano',
      'atualizarPlano',
      'excluirRascunho',
      'publicarPlano'
    ]);
    dieta.listarAlimentos.and.returnValue(of(paginaAlimentos([])));
    dieta.listarCategorias.and.returnValue(of(['Cereais']));
    dieta.listarPlanos.and.returnValue(of([]));
    dieta.criarPlano.and.returnValue(of(planoSalvo));

    await TestBed.configureTestingModule({
      imports: [DietaComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: String(paciente.id) }) } }
        },
        { provide: PacientesService, useValue: pacientes },
        { provide: DietaService, useValue: dieta }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DietaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('uses numeric NgModel values for previews, validation, and the saved plan', async () => {
    component.abrirNovoRascunho();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    component.form.titulo = 'Plano de teste';
    component.adicionarRefeicao();
    const refeicao = component.form.refeicoes[0];
    refeicao.nome = 'Café da manhã';
    refeicao.horario = '08:00';
    const item = { chave: 2, alimento, quantidadeGramas: '' };
    refeicao.itens.push(item);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    await preencherNumero('#meta-kcal', 1800);
    await preencherNumero('#meta-proteinas', 100);
    await preencherNumero('#meta-carboidratos', 200);
    await preencherNumero('#meta-gorduras', 50);
    await preencherNumero('#gramas-2', 125.5);

    expect(typeof component.form.metas.kcal).toBe('number');
    expect(typeof item.quantidadeGramas).toBe('number');
    expect(component.totaisPrevistos.kcal).toBeCloseTo(150.6);
    expect(fixture.nativeElement.querySelector('.preview-card').textContent).toContain('150,60 kcal');

    component.salvar();

    expect(dieta.criarPlano).toHaveBeenCalledWith(paciente.id, jasmine.objectContaining({
      metas: { kcal: 1800, proteinas: 100, carboidratos: 200, gorduras: 50 },
      refeicoes: [{
        nome: 'Café da manhã',
        horario: '08:00',
        itens: [{ alimentoId: alimento.id, quantidadeGramas: 125.5 }]
      }]
    }));
    expect(component.mensagem).toBe('Rascunho salvo com sucesso.');
  });

  it('pastes an independent copy of a meal and enforces the daily meal limit', () => {
    component.abrirNovoRascunho();
    component.adicionarRefeicao();
    const original = component.form.refeicoes[0];
    original.nome = 'Café da manhã';
    original.horario = '08:00';
    const alimentoOriginal = { ...alimento };
    const itemOriginal = { chave: 500, alimento: alimentoOriginal, quantidadeGramas: 125.5 };
    original.itens.push(itemOriginal);

    component.copiarRefeicao(original);
    original.nome = 'Refeição alterada';
    original.horario = '10:00';
    alimentoOriginal.nome = 'Arroz alterado';
    itemOriginal.quantidadeGramas = 250;

    component.colarRefeicao();
    const primeiraCopia = component.form.refeicoes[1];
    const primeiroItemCopiado = primeiraCopia.itens[0];
    expect(primeiraCopia.nome).toBe('Café da manhã');
    expect(primeiraCopia.horario).toBe('08:00');
    expect(primeiraCopia.chave).not.toBe(original.chave);
    expect(primeiroItemCopiado.chave).not.toBe(itemOriginal.chave);
    expect(primeiroItemCopiado.quantidadeGramas).toBe(125.5);
    expect(primeiroItemCopiado.alimento?.nome).toBe('Arroz cozido');
    expect(primeiraCopia).not.toBe(original);
    expect(primeiraCopia.itens).not.toBe(original.itens);
    expect(primeiroItemCopiado).not.toBe(itemOriginal);
    expect(primeiroItemCopiado.alimento).not.toBe(alimentoOriginal);

    primeiroItemCopiado.alimento!.nome = 'Arroz editado na cópia';
    primeiroItemCopiado.quantidadeGramas = 300;
    component.colarRefeicao();
    const segundaCopia = component.form.refeicoes[2];
    expect(segundaCopia.itens[0].alimento?.nome).toBe('Arroz cozido');
    expect(segundaCopia.itens[0].quantidadeGramas).toBe(125.5);
    expect(segundaCopia.itens[0].chave).not.toBe(primeiroItemCopiado.chave);
    expect(segundaCopia.itens[0].alimento).not.toBe(primeiroItemCopiado.alimento);

    while (component.form.refeicoes.length < 20) component.adicionarRefeicao();
    expect(component.podeColarRefeicao).toBeFalse();
    component.colarRefeicao();
    expect(component.form.refeicoes).toHaveSize(20);
    expect(component.erro).toBe('Um plano pode conter até 20 refeições.');
  });

  it('ignores an older food search after a newer search starts', () => {
    const buscaAntiga = new Subject<PaginaAlimentos>();
    const buscaAtual = new Subject<PaginaAlimentos>();
    dieta.listarAlimentos.and.returnValues(buscaAntiga.asObservable(), buscaAtual.asObservable());

    component.abrirNovoRascunho();
    component.adicionarRefeicao();
    component.abrirBuscaAlimentos(component.form.refeicoes[0]);
    component.buscaAlimento = 'arroz';
    component.buscarAlimentos(0);

    const alimentoAntigo = { ...alimento, id: 41, nome: 'Arroz cru' };
    const alimentoAtual = { ...alimento, id: 42, nome: 'Arroz integral' };
    buscaAntiga.next(paginaAlimentos([alimentoAntigo]));
    expect(component.paginaAlimentos).toBeNull();

    buscaAtual.next(paginaAlimentos([alimentoAtual]));
    buscaAntiga.next(paginaAlimentos([alimentoAntigo]));
    expect(component.paginaAlimentos?.alimentos[0].id).toBe(alimentoAtual.id);
  });
});
