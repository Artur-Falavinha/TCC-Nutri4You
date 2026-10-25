import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PacientesService } from '../../../core/services/pacientes.service';
import { DietaComponent } from './dieta.component';
import { AlimentoTaco } from './dieta.models';
import { DietaService } from './dieta.service';

describe('DietaComponent', () => {
  const alimentosMock: AlimentoTaco[] = [
    {
      id: 1,
      numeroTaco: 1,
      nome: 'Arroz, integral, cozido',
      categoria: 'Cereais e derivados',
      kcal100g: 123.53,
      proteina100g: 2.59,
      carboidratos100g: 25.81,
      gordura100g: 1.0,
      fibra100g: 2.75
    },
    {
      id: 2,
      numeroTaco: 5,
      nome: 'Aveia, flocos, crua',
      categoria: 'Cereais e derivados',
      kcal100g: 393.83,
      proteina100g: 13.92,
      carboidratos100g: 66.64,
      gordura100g: 8.5,
      fibra100g: 9.13
    }
  ];

  const pacientesServiceMock = {
    buscarPorId: () =>
      of({
        id: 10,
        nome: 'Maria Oliveira',
        cpf: '12345678901',
        email: 'maria@teste.com',
        telefone: '11999999999',
        sexo: 'Feminino',
        dataNascimento: '1995-05-10',
        vinculado: true
      })
  };

  const dietaServiceMock = {
    buscarAlimentos: () =>
      of({
        itens: alimentosMock,
        pagina: 0,
        tamanho: 200,
        totalItens: 2,
        totalPaginas: 1
      }),
    listarCategorias: () => of(['Cereais e derivados', 'Frutas e derivados']),
    listarPlanos: () => of([]),
    salvarPlano: (_pacienteId: number, _planoId: number | null, payload: unknown) =>
      of({
        id: 55,
        consultaId: null,
        pacienteId: 10,
        nutricionistaId: 1,
        nutricionistaNome: 'Nutri Teste',
        titulo: 'Plano alimentar',
        observacoes: null,
        status: (payload as { status?: string })?.status || 'RASCUNHO',
        vigente: true,
        vigenciaInicio: '2026-10-25',
        vigenciaFim: null,
        metaCalorias: 185.3,
        metaCarboidratos: 38.72,
        metaGordura: 1.5,
        metaProteina: 3.89,
        criadoEm: '2026-10-25T12:00:00Z',
        publicadoEm: '2026-10-25T12:00:00Z',
        versao: 1,
        refeicoes: []
      })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DietaComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '10' }),
              data: {}
            }
          }
        },
        { provide: PacientesService, useValue: pacientesServiceMock },
        { provide: DietaService, useValue: dietaServiceMock }
      ]
    }).compileComponents();
  });

  it('deve carregar dados do paciente, catálogo TACO e calcular macronutrientes por regra de 3', () => {
    const fixture = TestBed.createComponent(DietaComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.nomePaciente).toBe('Maria Oliveira');
    expect(component.catalogoTaco.length).toBe(2);
    expect(component.refeicoesDoDia.length).toBe(1);

    const refeicao = component.refeicoesDoDia[0];
    const item = refeicao.itens[0];
    component.selecionarAlimentoTaco(item, alimentosMock[0]);
    item.quantidadeGramas = '150';

    const nutrientes = component.nutrientesDaRefeicao(refeicao);
    expect(nutrientes.kcal).toBeCloseTo(185.3, 1);
    expect(nutrientes.proteina).toBeCloseTo(3.89, 2);
  });

  it('deve validar campos obrigatórios conforme mensagens da HU012', () => {
    const fixture = TestBed.createComponent(DietaComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const ref = component.refeicoesDoDia[0];
    ref.nome = '   ';
    expect(component.validarPrescricao(true)).toBe('Nome da refeição não preenchido corretamente!');

    ref.nome = 'Almoço';
    expect(component.validarPrescricao(true)).toBe(
      "O campo 'Nome do alimento' não foi preenchido na refeição 'Almoço'!"
    );

    component.selecionarAlimentoTaco(ref.itens[0], alimentosMock[0]);
    ref.itens[0].quantidadeGramas = '0';
    expect(component.validarPrescricao(true)).toBe(
      "A quantidade de gramas do alimento 'Arroz, integral, cozido' não foi preenchida na refeição 'Almoço'!"
    );
  });

  it('deve permitir copiar e colar refeição entre dias da semana e adicionar substituto', () => {
    const fixture = TestBed.createComponent(DietaComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const refSegunda = component.refeicoesDoDia[0];
    refSegunda.nome = 'Café da manhã';
    component.selecionarAlimentoTaco(refSegunda.itens[0], alimentosMock[0]);
    refSegunda.itens[0].quantidadeGramas = '100';
    component.adicionarSubstituto(refSegunda.itens[0]);
    component.selecionarAlimentoTaco(refSegunda.itens[0].substitutos[0], alimentosMock[1]);
    refSegunda.itens[0].substitutos[0].quantidadeGramas = '40';

    component.copiarRefeicao(refSegunda);
    component.selecionarDia('Terça');
    expect(component.refeicoesDoDia.length).toBe(0);

    component.colarRefeicao();
    expect(component.refeicoesDoDia.length).toBe(1);
    expect(component.refeicoesDoDia[0].nome).toBe('Café da manhã');
    expect(component.refeicoesDoDia[0].itens[0].substitutos.length).toBe(1);
  });
});

