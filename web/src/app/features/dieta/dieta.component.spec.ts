import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { Paciente } from '../../core/models/paciente.models';
import { PacientesService } from '../../core/services/pacientes.service';
import { AtendimentosService } from '../clinico/consultas/consultas.service';
import { DietaComponent } from './dieta.component';
import { DietaService } from './dieta.service';
import { Alimento, ItemEdicao, Nutrientes, PaginaAlimentos, Plano } from './dieta.models';

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
  fibra100g: 1.6,
    fonte: 'TACO',
    versaoFonte: '4ª edição',
    observacaoFonte: null,
    disponivelParaPrescricao: true
  };
  const nutrientes: Nutrientes = { kcal: 150.6, proteinas: 3.14, carboidratos: 31.38, gorduras: 0.63, fibras: 2.01 };
  const alimentoAlternativo: Alimento = {
    ...alimento,
    id: 41,
    nome: 'Arroz integral cozido',
    fibra100g: 2.7
  };
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
      itens: [{ alimento, quantidadeGramas: 125.5, nutrientes, substitutos: [] }],
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
      'publicarPlano',
      'previsualizarListaCompras'
    ]);
    dieta.listarAlimentos.and.returnValue(of(paginaAlimentos([])));
    dieta.listarCategorias.and.returnValue(of(['Cereais']));
    dieta.listarPlanos.and.returnValue(of([]));
    dieta.criarPlano.and.returnValue(of(planoSalvo));
    dieta.previsualizarListaCompras.and.returnValue(of({
      planoId: planoSalvo.id,
      planoTitulo: planoSalvo.titulo,
      dias: 7,
      totalItens: 1,
      itensComprados: 0,
      itensPendentes: 1,
      itens: [{ alimentoId: alimento.id, nome: alimento.nome, categoria: alimento.categoria, quantidadeGramas: 875, comprado: false }]
    }));

    await TestBed.configureTestingModule({
      imports: [DietaComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: String(paciente.id) }), queryParamMap: convertToParamMap({}) } }
        },
        { provide: PacientesService, useValue: pacientes },
        { provide: AtendimentosService, useValue: jasmine.createSpyObj('AtendimentosService', ['buscar']) },
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
    const item = {
      chave: 2,
      alimento,
      quantidadeGramas: '',
      substitutos: [{ chave: 3, alimento: alimentoAlternativo, quantidadeGramas: 90 }]
    };
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
        diaSemana: 1,
        itens: [{
          alimentoId: alimento.id,
          quantidadeGramas: 125.5,
          substitutos: [{ alimentoId: alimentoAlternativo.id, quantidadeGramas: 90 }]
        }]
      }]
    }), null);
    expect(component.mensagem).toBe('Rascunho salvo com sucesso.');
  });

  it('pastes an independent copy of a meal and enforces the weekly meal limit', () => {
    component.abrirNovoRascunho();
    component.adicionarRefeicao();
    const original = component.form.refeicoes[0];
    original.nome = 'Café da manhã';
    original.horario = '08:00';
    const alimentoOriginal = { ...alimento };
    const alimentoAlternativoOriginal = { ...alimentoAlternativo };
    const substitutoOriginal = { chave: 501, alimento: alimentoAlternativoOriginal, quantidadeGramas: 85 };
    const itemOriginal = {
      chave: 500,
      alimento: alimentoOriginal,
      quantidadeGramas: 125.5,
      substitutos: [substitutoOriginal]
    };
    original.itens.push(itemOriginal);

    component.copiarRefeicao(original);
    original.nome = 'Refeição alterada';
    original.horario = '10:00';
    alimentoOriginal.nome = 'Arroz alterado';
    itemOriginal.quantidadeGramas = 250;
    alimentoAlternativoOriginal.nome = 'Arroz integral alterado';
    substitutoOriginal.quantidadeGramas = 180;

    component.colarRefeicao();
    const primeiraCopia = component.form.refeicoes[1];
    const primeiroItemCopiado = primeiraCopia.itens[0];
    expect(primeiraCopia.nome).toBe('Café da manhã');
    expect(primeiraCopia.horario).toBe('08:00');
    expect(primeiraCopia.chave).not.toBe(original.chave);
    expect(primeiroItemCopiado.chave).not.toBe(itemOriginal.chave);
    expect(primeiroItemCopiado.quantidadeGramas).toBe(125.5);
    expect(primeiroItemCopiado.alimento?.nome).toBe('Arroz cozido');
    expect(primeiroItemCopiado.substitutos[0].alimento?.nome).toBe('Arroz integral cozido');
    expect(primeiroItemCopiado.substitutos[0].quantidadeGramas).toBe(85);
    expect(primeiraCopia).not.toBe(original);
    expect(primeiraCopia.itens).not.toBe(original.itens);
    expect(primeiroItemCopiado).not.toBe(itemOriginal);
    expect(primeiroItemCopiado.alimento).not.toBe(alimentoOriginal);
    expect(primeiroItemCopiado.substitutos).not.toBe(itemOriginal.substitutos);
    expect(primeiroItemCopiado.substitutos[0]).not.toBe(substitutoOriginal);
    expect(primeiroItemCopiado.substitutos[0].alimento).not.toBe(alimentoAlternativoOriginal);

    primeiroItemCopiado.alimento!.nome = 'Arroz editado na cópia';
    primeiroItemCopiado.quantidadeGramas = 300;
    primeiroItemCopiado.substitutos[0].alimento!.nome = 'Alternativa editada na cópia';
    primeiroItemCopiado.substitutos[0].quantidadeGramas = 300;
    component.colarRefeicao();
    const segundaCopia = component.form.refeicoes[2];
    expect(segundaCopia.itens[0].alimento?.nome).toBe('Arroz cozido');
    expect(segundaCopia.itens[0].quantidadeGramas).toBe(125.5);
    expect(segundaCopia.itens[0].substitutos[0].alimento?.nome).toBe('Arroz integral cozido');
    expect(segundaCopia.itens[0].substitutos[0].quantidadeGramas).toBe(85);
    expect(segundaCopia.itens[0].chave).not.toBe(primeiroItemCopiado.chave);
    expect(segundaCopia.itens[0].alimento).not.toBe(primeiroItemCopiado.alimento);
    expect(segundaCopia.itens[0].substitutos).not.toBe(primeiroItemCopiado.substitutos);
    expect(segundaCopia.itens[0].substitutos[0].alimento).not.toBe(primeiroItemCopiado.substitutos[0].alimento);

    while (component.form.refeicoes.length < 140) component.adicionarRefeicao();
    expect(component.podeColarRefeicao).toBeFalse();
    component.colarRefeicao();
    expect(component.form.refeicoes).toHaveSize(140);
    expect(component.erro).toBe('Um plano pode conter até 140 refeições.');
  });

  it('loads stored alternatives into an independent editor model', () => {
    const alimentoSalvo = { ...alimentoAlternativo };
    const planoComSubstituto: Plano = {
      ...planoSalvo,
      refeicoes: [{
        ...planoSalvo.refeicoes[0],
        itens: [{
          ...planoSalvo.refeicoes[0].itens[0],
          substitutos: [{ alimento: alimentoSalvo, quantidadeGramas: 85, nutrientes }]
        }]
      }]
    };
    component.planoSelecionado = planoComSubstituto;
    component.abrirEdicao();
    const substitutoEditado = component.form.refeicoes[0].itens[0].substitutos[0];

    expect(substitutoEditado.alimento?.id).toBe(alimentoSalvo.id);
    expect(substitutoEditado.quantidadeGramas).toBe('85');
    expect(substitutoEditado.alimento).not.toBe(alimentoSalvo);
    substitutoEditado.alimento!.nome = 'Alternativa no editor';
    expect(alimentoSalvo.nome).toBe('Arroz integral cozido');
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

  it('adds informational alternatives without allowing the primary food or duplicate alternatives', () => {
    component.abrirNovoRascunho();
    component.adicionarRefeicao();
    const refeicao = component.form.refeicoes[0];
    const principal: ItemEdicao = { chave: 20, alimento, quantidadeGramas: 100, substitutos: [] };
    refeicao.itens.push(principal);

    component.abrirBuscaSubstitutos(refeicao, principal);
    component.adicionarAlimento(alimento);
    expect(principal.substitutos).toHaveSize(0);
    expect(component.mensagemAlimento).toContain('diferente do alimento principal');

    component.adicionarAlimento(alimentoAlternativo);
    expect(principal.substitutos).toHaveSize(1);
    expect(principal.substitutos[0].alimento).toBe(alimentoAlternativo);
    component.adicionarAlimento(alimentoAlternativo);
    expect(principal.substitutos).toHaveSize(1);
    expect(component.mensagemAlimento).toContain('já foi adicionado');

    principal.substitutos[0].quantidadeGramas = 50;
    expect(component.nutrientesPrevistos(principal).kcal).toBe(120);
    expect(component.nutrientesSubstitutoPrevistos(principal.substitutos[0]).kcal).toBe(60);
    expect(component.totaisRefeicaoPrevistos(refeicao).kcal).toBe(120);
  });

  it('requires a valid positive quantity for each alternative before saving', () => {
    component.abrirNovoRascunho();
    component.form.titulo = 'Plano com substituto';
    component.adicionarRefeicao();
    const refeicao = component.form.refeicoes[0];
    refeicao.nome = 'Almoço';
    refeicao.horario = '12:00';
    refeicao.itens.push({
      chave: 20,
      alimento,
      quantidadeGramas: 100,
      substitutos: [{ chave: 21, alimento: alimentoAlternativo, quantidadeGramas: '' }]
    });

    component.salvar();

    expect(dieta.criarPlano).not.toHaveBeenCalled();
    expect(component.errors['refeicao-1-item-20-substituto-21-gramas']).toBeDefined();
  });

  it('keeps unknown fiber unknown in food and daily previews', () => {
    component.abrirNovoRascunho();
    const alimentoSemFibra = { ...alimento, fibra100g: null };
    const item: ItemEdicao = { chave: 20, alimento: alimentoSemFibra, quantidadeGramas: 100, substitutos: [] };
    component.form.refeicoes.push({ chave: 19, nome: 'Almoço', horario: '12:00', itens: [item] });

    expect(component.nutrientesPrevistos(item).fibras).toBeNull();
    expect(component.totaisPrevistos.fibras).toBeNull();
    expect(component.formatarFibra(null)).toBe('Não informado');
    expect(component.formatarNutriente(null)).toBe('—');
  });

  it('shows a read-only shopping preview for the saved plan and requests the selected period', () => {
    component.planoSelecionado = planoSalvo;
    component.tela = 'detalhe';
    component.abrirPreviaListaCompras();
    fixture.detectChanges();

    expect(dieta.previsualizarListaCompras).toHaveBeenCalledWith(paciente.id, planoSalvo.id, 7, null);
    expect(fixture.nativeElement.querySelector('.shopping-preview').textContent).toContain('somente os alimentos principais');
    expect(fixture.nativeElement.querySelector('.shopping-category').textContent).toContain('875,00 g');
    expect(fixture.nativeElement.querySelector('.shopping-preview input[type="checkbox"]')).toBeNull();
  });

  it('rejects an invalid shopping preview period and reports API errors', () => {
    component.planoSelecionado = planoSalvo;
    component.tela = 'detalhe';
    component.diasListaCompras = 31;
    component.abrirPreviaListaCompras();

    expect(dieta.previsualizarListaCompras).not.toHaveBeenCalled();
    expect(component.listaComprasErro).toContain('entre 1 e 30 dias');

    component.diasListaCompras = 7;
    dieta.previsualizarListaCompras.and.returnValue(throwError(() => ({ message: 'Falha de prévia' })));
    component.carregarListaCompras();
    expect(component.listaComprasErro).toBe('Falha de prévia');
    expect(component.listaComprasCarregando).toBeFalse();
  });
  it('filtra os totais por dia e cola refeições com substitutos no dia escolhido', () => {
    component.abrirNovoRascunho(); component.adicionarRefeicao();
    const segunda = component.form.refeicoes[0];
    segunda.nome = 'Almoço'; segunda.horario = '12:00';
    segunda.itens.push({ chave: 100, alimento, quantidadeGramas: 100, substitutos: [] });
    component.copiarRefeicao(segunda); component.dia = 2;
    expect(component.totaisPrevistos.kcal).toBe(0);
    component.colarRefeicao();
    expect(component.refeicoesEdicao.length).toBe(1);
    expect(component.form.refeicoes[1].diaSemana).toBe(2);
    expect(component.totaisPrevistos.kcal).toBe(120);
    component.form.refeicoes[1].itens[0].quantidadeGramas = 200;
    expect(segunda.itens[0].quantidadeGramas).toBe(100);
  });
  it('publica somente após a confirmação no modal padrão', () => {
    const rascunho = { ...planoSalvo, vigenciaInicio: '2026-11-05', vigenciaFim: '2026-11-12' };
    dieta.publicarPlano.and.returnValue(of({ ...rascunho, status: 'PUBLICADO', versao: 1 }));
    component.planoSelecionado = rascunho;
    component.tela = 'detalhe';
    fixture.detectChanges();

    const raiz = fixture.nativeElement as HTMLElement;
    const publicar = Array.from(raiz.querySelectorAll('button'))
      .find(botao => botao.textContent?.trim() === 'Publicar')!;
    publicar.click();
    fixture.detectChanges();

    const modal = raiz.querySelector('app-paciente-dialog [role="dialog"]')!;
    expect(modal.textContent).toContain(rascunho.titulo);
    expect(dieta.publicarPlano).not.toHaveBeenCalled();

    modal.querySelector<HTMLButtonElement>('#cancelar-publicacao button')!.click();
    fixture.detectChanges();
    expect(raiz.querySelector('app-paciente-dialog')).toBeNull();
    expect(dieta.publicarPlano).not.toHaveBeenCalled();

    publicar.click();
    fixture.detectChanges();
    const confirmar = Array.from(raiz.querySelectorAll<HTMLButtonElement>('app-paciente-dialog button'))
      .find(botao => botao.textContent?.trim() === 'Confirmar publicação')!;
    confirmar.click();
    fixture.detectChanges();

    expect(dieta.publicarPlano).toHaveBeenCalledOnceWith(paciente.id, rascunho.id, rascunho.versao, null);
    expect(raiz.querySelector('app-paciente-dialog')).toBeNull();
  });

  it('exige confirmação para excluir refeições', () => {
    component.abrirNovoRascunho(); component.adicionarRefeicao();
    spyOn(window, 'confirm').and.returnValue(false);
    component.removerRefeicao(component.form.refeicoes[0]);
    expect(component.form.refeicoes.length).toBe(1);
    (window.confirm as jasmine.Spy).and.returnValue(true);
    component.removerRefeicao(component.form.refeicoes[0]);
    expect(component.form.refeicoes.length).toBe(0);
  });

});
