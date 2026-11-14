import { DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, CanDeactivateFn, RouterLink } from '@angular/router';
import { EMPTY, Observable, Subject, catchError, forkJoin, of, switchMap, take, throwError } from 'rxjs';

import { ApiErrorResponse } from '../../core/models/api-response.model';
import { Paciente } from '../../core/models/paciente.models';
import { PacientesService } from '../../core/services/pacientes.service';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { PatientTabsComponent } from '../../shared/components/patient-tabs/patient-tabs.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { PacienteDialogComponent } from '../pacientes/components/paciente-dialog/paciente-dialog.component';
import { BuscaAlimentosComponent } from './busca-alimentos.component';
import {
  Alimento,
  CampoNumericoEdicao,
  ItemEdicao,
  ItemListaCompras,
  ListaCompras,
  MetasEdicao,
  Nutrientes,
  PaginaAlimentos,
  Plano,
  PlanoEdicao,
  PlanoRequest,
  RefeicaoEdicao,
  SubstitutoEdicao
} from './dieta.models';
import { AtendimentosService } from '../clinico/consultas/consultas.service';
import { Avaliacao, ClinicoService } from '../clinico/clinico.service';
import { Anamnese, Answers } from '../anamnese/anamnese.models';
import { AnamneseService } from '../anamnese/anamnese.service';
import { DietaService } from './dieta.service';

type TelaDieta = 'lista' | 'detalhe' | 'editor';
type FiltrosBuscaAlimentos = { nome: string; categoria: string; pagina: number } | null;
type PedidoListaCompras = { planoId: number; dias: number } | null;
type MacroPercentual = 'percentualProteinas' | 'percentualCarboidratos' | 'percentualGorduras';

interface ReferenciaEnergetica {
  peso: number;
  alturaCm: number;
  idade: number;
  tmb: number;
  faSugerido: number;
  get: number;
  origemMedidas: 'avaliação' | 'anamnese';
}

const NUTRIENTES_VAZIOS: Nutrientes = { kcal: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0 };
const MAXIMO_SUBSTITUTOS = 10;

@Component({
  selector: 'app-dieta',
  imports: [DatePipe, FormsModule, RouterLink, PatientTabsComponent, FormAlertComponent, UiButtonComponent, BuscaAlimentosComponent, PacienteDialogComponent],
  templateUrl: './dieta.component.html',
  styleUrl: './dieta.component.css'
})
export class DietaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pacientes = inject(PacientesService);
  private readonly dieta = inject(DietaService);
  private readonly atendimentos = inject(AtendimentosService);
  private readonly clinico = inject(ClinicoService);
  private readonly anamneses = inject(AnamneseService);
  private readonly destroyRef = inject(DestroyRef);
  readonly patientId = Number(this.route.snapshot.paramMap.get('id'));

  readonly atendimentoId = this.route.snapshot.queryParamMap.has('atendimentoId') ? Number(this.route.snapshot.queryParamMap.get('atendimentoId')) : null;
  podeEditarAtendimento = false;
  paciente: Paciente | null = null;
  anamnese: Anamnese | null = null;
  avaliacaoAtual: Avaliacao | null = null;
  fatorAtividade = 1.2;
  readonly fatoresAtividade = [
    { valor: 1.2, rotulo: '1,20 · muito baixo' },
    { valor: 1.375, rotulo: '1,375 · leve' },
    { valor: 1.55, rotulo: '1,55 · moderado' },
    { valor: 1.725, rotulo: '1,725 · elevado' },
    { valor: 1.9, rotulo: '1,90 · muito elevado' }
  ];
  planos: Plano[] = [];
  planoSelecionado: Plano | null = null;
  planoEmEdicaoId: number | null = null;
  tela: TelaDieta = 'lista';
  readonly dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  dia = 1;
  get refeicoesEdicao(): RefeicaoEdicao[] {
    return this.form.refeicoes.filter(r => r.diaSemana == null || r.diaSemana === this.dia);
  }
  get refeicoesDetalhe() {
    return this.planoSelecionado?.refeicoes.filter(r => r.diaSemana == null || r.diaSemana === this.dia) ?? [];
  }
  get indicadores() {
    const totais = this.tela === 'editor' ? this.totaisPrevistos : this.totaisDetalhe;
    const metas = this.tela === 'editor' ? this.metasCalculadas : this.planoSelecionado?.metas;
    return ([['kcal', 'Energia', 'kcal'], ['proteinas', 'Proteínas', 'g'], ['carboidratos', 'Carboidratos', 'g'], ['gorduras', 'Gorduras', 'g']] as const)
      .map(([chave, nome, unidade]) => {
        const meta = metas ? this.numero(metas[chave]) : null;
        const valor = totais[chave];
        const percentual = meta && meta > 0 ? Math.round(valor / meta * 100) : null;
        return { nome, unidade, valor, meta, percentual, barra: Math.min(percentual ?? 0, 100), excesso: meta !== null && valor > meta };
      });
  }
  get metasCalculadas() {
    const kcal = this.numero(this.form.metas.kcal);
    if (kcal === null || kcal <= 0) return null;
    if (this.form.metas.metodo === 'G_POR_KG') {
      const peso = this.referenciaEnergetica?.peso;
      const proteinasGKg = this.numero(this.form.metas.proteinasGKg);
      const carboidratosGKg = this.numero(this.form.metas.carboidratosGKg);
      if (!peso || proteinasGKg === null || carboidratosGKg === null) return null;
      const proteinas = peso * proteinasGKg;
      const carboidratos = peso * carboidratosGKg;
      const gorduras = (kcal - (proteinas + carboidratos) * 4) / 9;
      if (!Number.isFinite(gorduras) || gorduras < 0) return null;
      return { kcal, proteinas, carboidratos, gorduras };
    }
    const proteinas = this.numero(this.form.metas.percentualProteinas);
    const carboidratos = this.numero(this.form.metas.percentualCarboidratos);
    const gorduras = this.numero(this.form.metas.percentualGorduras);
    if (proteinas === null || carboidratos === null || gorduras === null) return null;
    return {
      kcal,
      proteinas: kcal * proteinas / 100 / 4,
      carboidratos: kcal * carboidratos / 100 / 4,
      gorduras: kcal * gorduras / 100 / 9
    };
  }
  get percentuaisCalculados() {
    const metas = this.metasCalculadas;
    if (!metas || metas.kcal <= 0) return null;
    const proteinas = Number((metas.proteinas * 4 / metas.kcal * 100).toFixed(2));
    const gorduras = Number((metas.gorduras * 9 / metas.kcal * 100).toFixed(2));
    return {
      proteinas,
      carboidratos: Number((100 - proteinas - gorduras).toFixed(2)),
      gorduras
    };
  }
  get referenciaEnergetica(): ReferenciaEnergetica | null {
    const respostas = this.anamnese?.respostas ?? {};
    const pesoAvaliacao = this.numero(this.avaliacaoAtual?.peso ?? null);
    const alturaAvaliacao = this.numero(this.avaliacaoAtual?.altura ?? null);
    const pesoResposta = respostas['weight'];
    const alturaResposta = respostas['height'];
    const pesoAnamnese = this.numero(typeof pesoResposta === 'string' || typeof pesoResposta === 'number' ? pesoResposta : null);
    const alturaAnamnese = this.numero(typeof alturaResposta === 'string' || typeof alturaResposta === 'number' ? alturaResposta : null);
    const peso = pesoAvaliacao ?? pesoAnamnese;
    const alturaMetros = alturaAvaliacao ?? alturaAnamnese;
    const idade = this.idadeAtual(this.paciente?.dataNascimento);
    const sexo = (this.paciente?.sexo ?? '').toLocaleLowerCase('pt-BR');
    if (!peso || !alturaMetros || idade === null || idade < 18
      || !(sexo.startsWith('m') || sexo.startsWith('f'))) return null;
    const tmb = 10 * peso + 6.25 * alturaMetros * 100 - 5 * idade
      + (sexo.startsWith('m') ? 5 : -161);
    if (!Number.isFinite(tmb) || tmb <= 0) return null;
    return {
      peso,
      alturaCm: alturaMetros * 100,
      idade,
      tmb: Math.round(tmb),
      faSugerido: this.fatorAtividadeSugerido(respostas),
      get: Math.round(tmb * this.fatorAtividade),
      origemMedidas: pesoAvaliacao !== null && alturaAvaliacao !== null ? 'avaliação' : 'anamnese'
    };
  }
  get totaisDetalhe(): Nutrientes {
    return this.refeicoesDetalhe.reduce((total, r) => this.somar(total, r.totais), { ...NUTRIENTES_VAZIOS });
  }
  form = this.novoFormulario();
  carregando = true;
  carregado = false;
  salvando = false;
  publicando = false;
  planoParaPublicar: Plano | null = null;
  excluindo = false;
  erro = '';
  mensagem = '';
  errors: Record<string, string> = {};
  readonly categorias: string[] = [];
  categoriaErro = '';
  categoriasCarregando = false;
  modalAlimentos = false;
  alimentosCarregando = false;
  alimentosErro = '';
  mensagemAlimento = '';
  paginaAlimentos: PaginaAlimentos | null = null;
  buscaAlimento = '';
  categoriaSelecionada = '';
  refeicaoSelecionada: number | null = null;
  modoBuscaSubstituto = false;
  modalListaCompras = false;
  diasListaCompras: number | null = 7;
  listaCompras: ListaCompras | null = null;
  itensListaComprasPorCategoria: { categoria: string; itens: ItemListaCompras[] }[] = [];
  listaComprasCarregando = false;
  listaComprasErro = '';
  private original = this.assinatura();
  private chaveAtual = 0;
  private refeicaoCopiada: {
    nome: string;
    horario: string;
    itens: {
      alimento: Alimento | null;
      quantidadeGramas: CampoNumericoEdicao;
      substitutos: { alimento: Alimento | null; quantidadeGramas: CampoNumericoEdicao }[];
    }[];
  } | null = null;
  private readonly buscasAlimentos$ = new Subject<FiltrosBuscaAlimentos>();
  private readonly buscasListaCompras$ = new Subject<PedidoListaCompras>();
  private elementoAtivoAntesDaBusca: HTMLElement | null = null;
  private elementoAtivoAntesDaListaCompras: HTMLElement | null = null;
  private elementoAtivoAntesDaPublicacao: HTMLElement | null = null;
  private substitutoSelecionado: { refeicaoChave: number; itemChave: number } | null = null;
  private macroAutopreenchido: MacroPercentual | null = null;
  modalDescartarAlteracoes = false;
  private confirmacaoSaida: Subject<boolean> | null = null;
  private acaoAposDescarte: (() => void) | null = null;
  confirmacaoDestrutiva: { titulo: string; descricao: string; confirmar: string; acao: () => void } | null = null;

  get podeColarRefeicao(): boolean {
    return this.refeicaoCopiada !== null && this.form.refeicoes.length < 140;
  }

  get periodoListaComprasValido(): boolean {
    return this.diasListaCompras !== null
      && Number.isInteger(this.diasListaCompras)
      && this.diasListaCompras >= 1
      && this.diasListaCompras <= 30;
  }

  ngOnInit(): void {
    this.configurarBuscaAlimentos();
    this.configurarPreviaListaCompras();
    this.carregar();
  }

  carregar(): void {
    if (!Number.isSafeInteger(this.patientId) || this.patientId <= 0) {
      this.erro = 'Identificador do paciente inválido.';
      this.carregando = false;
      return;
    }
    this.carregando = true;
    this.erro = '';
    const dadosPaciente = this.atendimentoId === null ? this.pacientes.buscarPorId(this.patientId)
      : this.atendimentos.buscar(this.atendimentoId).pipe(switchMap(a => {
        if (a.pacienteId !== this.patientId || !a.iniciadaEm) return throwError(() => new Error('Atendimento indisponível.'));
        this.podeEditarAtendimento = a.status === 'CONFIRMADA';
        return this.pacientes.buscarPorId(this.patientId);
      }));
    forkJoin({
      paciente: dadosPaciente,
      planos: this.dieta.listarPlanos(this.patientId, this.atendimentoId),
      anamnese: this.anamneses.get(this.patientId).pipe(catchError(() => of(null))),
      historico: this.clinico.historico(this.patientId).pipe(catchError(() => of(null)))
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ paciente, planos, anamnese, historico }) => {
        this.paciente = paciente;
        this.anamnese = anamnese;
        this.avaliacaoAtual = historico?.avaliacoes[0] ?? null;
        this.fatorAtividade = this.fatorAtividadeSugerido(anamnese?.respostas ?? {});
        this.planos = [...planos].sort((a, b) => b.id - a.id);
        this.carregado = true;
        this.carregando = false;
      },
      error: (error: ApiErrorResponse) => {
        this.erro = error.message || 'Não foi possível carregar os planos alimentares.';
        this.carregado = false;
        this.carregando = false;
      }
    });
  }

  atualizarFatorAtividade(valor: string | number): void {
    const fator = Number(valor);
    if (this.fatoresAtividade.some(item => item.valor === fator)) this.fatorAtividade = fator;
  }

  usarGetComoMeta(): void {
    const referencia = this.referenciaEnergetica;
    if (referencia) this.form.metas.kcal = referencia.get;
  }

  alterarMetodoMacros(metodo: 'PERCENTUAL' | 'G_POR_KG'): void {
    if (this.form.metas.metodo === metodo) return;
    const calculadas = this.metasCalculadas;
    const peso = this.referenciaEnergetica?.peso;
    if (metodo === 'G_POR_KG' && calculadas && peso) {
      this.form.metas.proteinasGKg = Number((calculadas.proteinas / peso).toFixed(2));
      this.form.metas.carboidratosGKg = Number((calculadas.carboidratos / peso).toFixed(2));
    } else if (metodo === 'PERCENTUAL' && calculadas) {
      this.form.metas.percentualProteinas = Number((calculadas.proteinas * 4 / calculadas.kcal * 100).toFixed(2));
      this.form.metas.percentualCarboidratos = Number((calculadas.carboidratos * 4 / calculadas.kcal * 100).toFixed(2));
      this.form.metas.percentualGorduras = Number((calculadas.gorduras * 9 / calculadas.kcal * 100).toFixed(2));
    }
    this.form.metas.metodo = metodo;
    this.macroAutopreenchido = null;
    delete this.errors['metas'];
  }

  atualizarPercentual(chave: MacroPercentual, valor: CampoNumericoEdicao): void {
    this.form.metas[chave] = valor;
    if (this.macroAutopreenchido === chave) this.macroAutopreenchido = null;
    const chaves: MacroPercentual[] = ['percentualProteinas', 'percentualCarboidratos', 'percentualGorduras'];
    let destino = this.macroAutopreenchido;
    if (!destino) {
      const vazios = chaves.filter(item => this.textoNumerico(this.form.metas[item]).trim() === '');
      if (vazios.length === 1) destino = vazios[0];
    }
    if (!destino || destino === chave) return;
    const outros = chaves.filter(item => item !== destino).map(item => this.numero(this.form.metas[item]));
    if (outros.some(item => item === null || item < 0 || item > 100)) return;
    const restante = Number((100 - (outros[0]! + outros[1]!)).toFixed(2));
    if (restante < 0 || restante > 100) return;
    this.form.metas[destino] = restante;
    this.macroAutopreenchido = destino;
  }

  abrirNovoRascunho(): void {
    if (this.atendimentoId !== null && !this.podeEditarAtendimento) return;
    this.executarComDescarte(() => {
      this.tela = 'editor';
      this.planoEmEdicaoId = null;
      this.planoSelecionado = null;
      this.form = this.novoFormulario();
      this.original = this.assinatura();
      this.limparMensagens();
    });
  }

  abrirDetalhe(plano: Plano): void {
    this.executarComDescarte(() => {
      this.erro = '';
      this.mensagem = '';
      this.dieta.buscarPlano(this.patientId, plano.id, this.atendimentoId)
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: detalhe => {
            this.planoSelecionado = detalhe;
            this.tela = 'detalhe';
          },
          error: (error: ApiErrorResponse) => {
            this.erro = error.message || 'Não foi possível abrir este plano.';
          }
        });
    });
  }

  abrirEdicao(): void {
    if (this.atendimentoId !== null && !this.podeEditarAtendimento) return;
    const plano = this.planoSelecionado;
    if (!plano || plano.status !== 'RASCUNHO') return;
    this.planoEmEdicaoId = plano.id;
    this.form = this.formularioDoPlano(plano);
    this.original = this.assinatura();
    this.tela = 'editor';
    this.limparMensagens();
  }

  duplicarPlano(): void {
    if (this.atendimentoId !== null && !this.podeEditarAtendimento) return;
    const plano = this.planoSelecionado;
    if (!plano || plano.status === 'RASCUNHO') return;
    this.executarComDescarte(() => {
      this.planoEmEdicaoId = null;
      this.form = this.formularioDoPlano(plano);
      this.form.titulo = `Cópia de ${plano.titulo}`.slice(0, 150);
      this.form.vigenciaInicio = '';
      this.form.vigenciaFim = '';
      this.original = this.assinatura();
      this.tela = 'editor';
      this.limparMensagens();
    });
  }

  voltarParaLista(): void {
    this.executarComDescarte(() => {
      this.tela = 'lista';
      this.planoSelecionado = null;
      this.limparMensagens();
    });
  }

  cancelarEdicao(): void {
    this.executarComDescarte(() => {
      this.tela = this.planoEmEdicaoId !== null && this.planoSelecionado ? 'detalhe' : 'lista';
      this.limparMensagens();
    });
  }

  adicionarRefeicao(): void {
    if (this.form.refeicoes.length >= 140) {
      this.erro = 'Um plano pode conter até 140 refeições.';
      return;
    }
    this.form.refeicoes.push({ chave: this.proximaChave(), nome: '', horario: '', diaSemana: this.dia, itens: [] });
    this.erro = '';
  }

  copiarRefeicao(refeicao: RefeicaoEdicao): void {
    this.refeicaoCopiada = {
      nome: refeicao.nome,
      horario: refeicao.horario,
      itens: refeicao.itens.map(item => ({
        alimento: item.alimento ? { ...item.alimento } : null,
        quantidadeGramas: item.quantidadeGramas,
        substitutos: item.substitutos.map(substituto => ({
          alimento: substituto.alimento ? { ...substituto.alimento } : null,
          quantidadeGramas: substituto.quantidadeGramas
        }))
      }))
    };
    this.mensagem = 'Refeição copiada.';
  }

  colarRefeicao(): void {
    if (!this.refeicaoCopiada) return;
    if (this.form.refeicoes.length >= 140) {
      this.erro = 'Um plano pode conter até 140 refeições.';
      return;
    }

    this.form.refeicoes.push({
      chave: this.proximaChave(),
      diaSemana: this.dia,
      nome: this.refeicaoCopiada.nome,
      horario: this.refeicaoCopiada.horario,
      itens: this.refeicaoCopiada.itens.map(item => ({
        chave: this.proximaChave(),
        alimento: item.alimento ? { ...item.alimento } : null,
        quantidadeGramas: item.quantidadeGramas,
        substitutos: item.substitutos.map(substituto => ({
          chave: this.proximaChave(),
          alimento: substituto.alimento ? { ...substituto.alimento } : null,
          quantidadeGramas: substituto.quantidadeGramas
        }))
      }))
    });
    this.erro = '';
    this.mensagem = 'Refeição adicionada ao plano.';
  }

  removerRefeicao(refeicao: RefeicaoEdicao): void {
    this.pedirConfirmacaoDestrutiva(
      'Excluir refeição?',
      `A refeição “${refeicao.nome || 'sem nome'}” e seus alimentos serão removidos do rascunho.`,
      'Excluir refeição',
      () => this.form.refeicoes = this.form.refeicoes.filter(item => item.chave !== refeicao.chave));
  }

  abrirBuscaAlimentos(refeicao: RefeicaoEdicao): void {
    this.abrirBuscaCatalogo(refeicao, null);
  }

  abrirBuscaSubstitutos(refeicao: RefeicaoEdicao, item: ItemEdicao): void {
    if (!item.alimento || item.substitutos.length >= MAXIMO_SUBSTITUTOS) return;
    this.abrirBuscaCatalogo(refeicao, item);
  }

  private abrirBuscaCatalogo(refeicao: RefeicaoEdicao, itemSubstituido: ItemEdicao | null): void {
    this.elementoAtivoAntesDaBusca = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.refeicaoSelecionada = refeicao.chave;
    this.substitutoSelecionado = itemSubstituido
      ? { refeicaoChave: refeicao.chave, itemChave: itemSubstituido.chave }
      : null;
    this.modoBuscaSubstituto = itemSubstituido !== null;
    this.modalAlimentos = true;
    this.buscaAlimento = '';
    this.categoriaSelecionada = '';
    this.paginaAlimentos = null;
    this.alimentosErro = '';
    this.mensagemAlimento = '';
    this.carregarCategorias();
    this.buscarAlimentos(0);
    setTimeout(() => document.getElementById('busca-alimento')?.focus());
  }

  fecharBuscaAlimentos(): void {
    this.modalAlimentos = false;
    this.refeicaoSelecionada = null;
    this.substitutoSelecionado = null;
    this.modoBuscaSubstituto = false;
    this.alimentosCarregando = false;
    this.buscasAlimentos$.next(null);
    this.elementoAtivoAntesDaBusca?.focus();
    this.elementoAtivoAntesDaBusca = null;
  }

  buscarAlimentos(pagina: number): void {
    this.alimentosCarregando = true;
    this.alimentosErro = '';
    this.buscasAlimentos$.next({
      nome: this.buscaAlimento,
      categoria: this.categoriaSelecionada,
      pagina
    });
  }

  adicionarAlimento(alimento: Alimento): void {
    if (!alimento.disponivelParaPrescricao || this.refeicaoSelecionada === null) return;
    const refeicao = this.form.refeicoes.find(item => item.chave === this.refeicaoSelecionada);
    if (!refeicao) return;
    if (this.substitutoSelecionado) {
      this.adicionarSubstituto(refeicao, this.substitutoSelecionado.itemChave, alimento);
      return;
    }
    if (refeicao.itens.some(item => item.alimento?.id === alimento.id)) {
      this.mensagemAlimento = 'Este alimento já está nesta refeição. Ajuste a quantidade no editor.';
      return;
    }
    if (refeicao.itens.length >= 100) {
      this.mensagemAlimento = 'Uma refeição pode conter até 100 alimentos.';
      return;
    }
    refeicao.itens.push({ chave: this.proximaChave(), alimento, quantidadeGramas: '', substitutos: [] });
    this.mensagemAlimento = `${alimento.nome} adicionado à refeição.`;
  }

  removerSubstituto(item: ItemEdicao, substituto: SubstitutoEdicao): void {
    item.substitutos = item.substitutos.filter(itemAtual => itemAtual.chave !== substituto.chave);
  }

  abrirPreviaListaCompras(): void {
    if (this.tela !== 'detalhe' || !this.planoSelecionado) return;
    this.elementoAtivoAntesDaListaCompras = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.modalListaCompras = true;
    this.listaCompras = null;
    this.itensListaComprasPorCategoria = [];
    this.listaComprasErro = '';
    this.carregarListaCompras();
    setTimeout(() => document.getElementById('dias-lista-compras')?.focus());
  }

  carregarListaCompras(): void {
    const plano = this.planoSelecionado;
    if (!this.modalListaCompras || !plano) return;
    if (!this.periodoListaComprasValido) {
      this.listaCompras = null;
      this.itensListaComprasPorCategoria = [];
      this.listaComprasCarregando = false;
      this.listaComprasErro = 'Informe um número inteiro entre 1 e 30 dias.';
      return;
    }
    this.listaCompras = null;
    this.itensListaComprasPorCategoria = [];
    this.listaComprasErro = '';
    this.listaComprasCarregando = true;
    this.buscasListaCompras$.next({ planoId: plano.id, dias: this.diasListaCompras! });
  }

  fecharPreviaListaCompras(): void {
    this.modalListaCompras = false;
    this.listaComprasCarregando = false;
    this.buscasListaCompras$.next(null);
    this.listaCompras = null;
    this.itensListaComprasPorCategoria = [];
    this.elementoAtivoAntesDaListaCompras?.focus();
    this.elementoAtivoAntesDaListaCompras = null;
  }

  removerAlimento(refeicao: RefeicaoEdicao, item: ItemEdicao): void {
    refeicao.itens = refeicao.itens.filter(alimento => alimento.chave !== item.chave);
  }

  salvar(): void {
    if (this.salvando || this.carregando || !this.carregado) return;
    this.errors = this.validarFormulario();
    this.erro = '';
    this.mensagem = '';
    if (Object.keys(this.errors).length > 0) {
      this.erro = 'Confira os campos destacados antes de salvar.';
      setTimeout(() => document.getElementById(Object.keys(this.errors)[0])?.focus());
      return;
    }
    const request = this.payload();
    this.salvando = true;
    const operacao = this.planoEmEdicaoId === null
      ? this.dieta.criarPlano(this.patientId, request, this.atendimentoId)
      : this.dieta.atualizarPlano(this.patientId, this.planoEmEdicaoId, request, this.atendimentoId);
    operacao.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: plano => {
        this.planoSelecionado = plano;
        this.planoEmEdicaoId = plano.id;
        this.tela = 'detalhe';
        this.salvando = false;
        this.atualizarPlanoNaLista(plano);
        this.mensagem = 'Rascunho salvo com sucesso.';
        this.original = this.assinatura();
        this.errors = {};
      },
      error: (error: ApiErrorResponse) => {
        this.erro = error.message || 'Não foi possível salvar o plano. Os campos foram mantidos.';
        this.salvando = false;
      }
    });
  }

  publicar(): void {
    const plano = this.planoSelecionado;
    if (!plano || plano.status !== 'RASCUNHO' || this.publicando || this.planoParaPublicar) return;
    const problema = this.validarPublicacao(plano);
    if (problema) {
      this.erro = problema;
      this.mensagem = '';
      return;
    }
    this.elementoAtivoAntesDaPublicacao = document.activeElement as HTMLElement | null;
    this.planoParaPublicar = plano;
    setTimeout(() => document.querySelector<HTMLButtonElement>('#cancelar-publicacao button')?.focus());
  }

  cancelarPublicacao(): void {
    this.planoParaPublicar = null;
    this.elementoAtivoAntesDaPublicacao?.focus();
    this.elementoAtivoAntesDaPublicacao = null;
  }

  confirmarPublicacao(): void {
    const plano = this.planoParaPublicar;
    if (!plano || this.publicando) return;
    this.cancelarPublicacao();
    this.publicando = true;
    this.erro = '';
    this.mensagem = '';
    this.dieta.publicarPlano(this.patientId, plano.id, plano.versao, this.atendimentoId)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: publicado => {
          this.planoSelecionado = publicado;
          this.atualizarPlanoNaLista(publicado);
          this.mensagem = `Plano publicado com sucesso na versão ${publicado.versao}.`;
          this.publicando = false;
        },
        error: (error: ApiErrorResponse) => {
          this.erro = error.message || 'Não foi possível publicar o plano.';
          this.publicando = false;
        }
      });
  }

  excluir(): void {
    const plano = this.planoSelecionado;
    if (!plano || plano.status !== 'RASCUNHO' || this.excluindo) return;
    this.pedirConfirmacaoDestrutiva(
      'Excluir rascunho?',
      `O rascunho “${plano.titulo}” será excluído permanentemente.`,
      'Excluir rascunho',
      () => this.excluirRascunho(plano));
  }

  private excluirRascunho(plano: Plano): void {
    if (this.excluindo) return;
    this.excluindo = true;
    this.erro = '';
    this.dieta.excluirRascunho(this.patientId, plano.id, plano.versao, this.atendimentoId)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.planos = this.planos.filter(item => item.id !== plano.id);
          this.planoSelecionado = null;
          this.tela = 'lista';
          this.excluindo = false;
          this.mensagem = 'Rascunho excluído.';
        },
        error: (error: ApiErrorResponse) => {
          this.erro = error.message || 'Não foi possível excluir o rascunho.';
          this.excluindo = false;
        }
      });
  }

  get alterado(): boolean {
    return this.tela === 'editor' && this.carregado && this.assinatura() !== this.original;
  }

  podeSair(): boolean | Observable<boolean> {
    if (this.salvando) return false;
    if (!this.alterado) return true;
    if (!this.confirmacaoSaida) this.confirmacaoSaida = new Subject<boolean>();
    this.modalDescartarAlteracoes = true;
    return this.confirmacaoSaida.asObservable().pipe(take(1));
  }

  cancelarDescarte(): void {
    this.modalDescartarAlteracoes = false;
    this.acaoAposDescarte = null;
    this.confirmacaoSaida?.next(false);
    this.confirmacaoSaida?.complete();
    this.confirmacaoSaida = null;
  }

  confirmarDescarte(): void {
    this.modalDescartarAlteracoes = false;
    const acao = this.acaoAposDescarte;
    this.acaoAposDescarte = null;
    if (acao) {
      this.original = this.assinatura();
      acao();
    } else {
      this.confirmacaoSaida?.next(true);
      this.confirmacaoSaida?.complete();
      this.confirmacaoSaida = null;
    }
  }

  cancelarConfirmacaoDestrutiva(): void {
    this.confirmacaoDestrutiva = null;
  }

  confirmarAcaoDestrutiva(): void {
    const confirmacao = this.confirmacaoDestrutiva;
    this.confirmacaoDestrutiva = null;
    confirmacao?.acao();
  }

  get totaisPrevistos(): Nutrientes {
    return this.refeicoesEdicao.reduce((total, refeicao) => this.somar(total, this.totaisRefeicaoPrevistos(refeicao)), { ...NUTRIENTES_VAZIOS });
  }

  totaisRefeicaoPrevistos(refeicao: RefeicaoEdicao): Nutrientes {
    return refeicao.itens.reduce((total, item) => this.somar(total, this.nutrientesPrevistos(item)), { ...NUTRIENTES_VAZIOS });
  }

  nutrientesPrevistos(item: ItemEdicao): Nutrientes {
    const alimento = item.alimento;
    const gramas = this.numero(item.quantidadeGramas);
    if (!alimento?.disponivelParaPrescricao || gramas === null || gramas <= 0) return { ...NUTRIENTES_VAZIOS };
    const fator = gramas / 100;
    return {
      kcal: (alimento.kcal100g ?? 0) * fator,
      proteinas: (alimento.proteina100g ?? 0) * fator,
      carboidratos: (alimento.carboidratos100g ?? 0) * fator,
      gorduras: (alimento.gordura100g ?? 0) * fator,
      fibras: alimento.fibra100g === null ? null : alimento.fibra100g * fator
    };
  }

  nutrientesSubstitutoPrevistos(substituto: SubstitutoEdicao): Nutrientes {
    const item: ItemEdicao = {
      chave: substituto.chave,
      alimento: substituto.alimento,
      quantidadeGramas: substituto.quantidadeGramas,
      substitutos: []
    };
    return this.nutrientesPrevistos(item);
  }

  formatarNutriente(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) return '—';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor));
  }

  formatarFibra(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? 'Não informado' : this.formatarNutriente(valor);
  }

  statusLabel(status: Plano['status']): string {
    return { RASCUNHO: 'Rascunho', PUBLICADO: 'Publicado', SUBSTITUIDO: 'Substituído' }[status];
  }

  formatarHorario(horario: string): string {
    return horario.slice(0, 5);
  }

  recarregarCategorias(): void {
    this.categorias.splice(0, this.categorias.length);
    this.carregarCategorias();
  }

  formatarPeriodo(plano: Plano): string {
    if (!plano.vigenciaInicio || !plano.vigenciaFim) return 'período sem vigência definida';
    return `${this.dataLocal(plano.vigenciaInicio)} a ${this.dataLocal(plano.vigenciaFim)}`;
  }

  @HostListener('window:beforeunload', ['$event'])
  antesDeFechar(event: BeforeUnloadEvent): void {
    if (this.alterado || this.salvando) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  @HostListener('document:keydown.escape')
  fecharModalComEscape(): void {
    if (this.modalListaCompras) this.fecharPreviaListaCompras();
    else if (this.modalAlimentos) this.fecharBuscaAlimentos();
  }

  private carregarCategorias(): void {
    if (this.categorias.length > 0 || this.categoriasCarregando) return;
    this.categoriasCarregando = true;
    this.categoriaErro = '';
    this.dieta.listarCategorias().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: categorias => {
        this.categorias.splice(0, this.categorias.length, ...categorias);
        this.categoriasCarregando = false;
      },
      error: (error: ApiErrorResponse) => {
        this.categoriaErro = error.message || 'Não foi possível carregar as categorias.';
        this.categoriasCarregando = false;
      }
    });
  }

  private configurarBuscaAlimentos(): void {
    this.buscasAlimentos$.pipe(
      switchMap(filtros => {
        if (filtros === null) return EMPTY;
        return this.dieta.listarAlimentos(filtros).pipe(
          catchError((error: ApiErrorResponse) => {
            this.alimentosErro = error.message || 'Não foi possível pesquisar o catálogo.';
            this.alimentosCarregando = false;
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(resultado => {
      this.paginaAlimentos = resultado;
      this.alimentosCarregando = false;
    });
  }

  private configurarPreviaListaCompras(): void {
    this.buscasListaCompras$.pipe(
      switchMap(pedido => {
        if (pedido === null) return EMPTY;
        return this.dieta.previsualizarListaCompras(this.patientId, pedido.planoId, pedido.dias, this.atendimentoId).pipe(
          catchError((error: ApiErrorResponse) => {
            this.listaComprasErro = error.message || 'Não foi possível carregar a prévia da lista de compras.';
            this.listaComprasCarregando = false;
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(resultado => {
      this.listaCompras = resultado;
      this.itensListaComprasPorCategoria = this.agruparItensListaCompras(resultado.itens);
      this.listaComprasCarregando = false;
    });
  }

  private agruparItensListaCompras(itens: ItemListaCompras[]): { categoria: string; itens: ItemListaCompras[] }[] {
    const grupos = new Map<string, ItemListaCompras[]>();
    for (const item of itens) {
      const categoria = item.categoria?.trim() || 'Sem categoria';
      const itensDaCategoria = grupos.get(categoria) ?? [];
      itensDaCategoria.push(item);
      grupos.set(categoria, itensDaCategoria);
    }
    return [...grupos.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
      .map(([categoria, itensDaCategoria]) => ({ categoria, itens: itensDaCategoria }));
  }

  private adicionarSubstituto(refeicao: RefeicaoEdicao, itemChave: number, alimento: Alimento): void {
    const item = refeicao.itens.find(itemAtual => itemAtual.chave === itemChave);
    if (!item?.alimento) return;
    if (item.substitutos.length >= MAXIMO_SUBSTITUTOS) {
      this.mensagemAlimento = `Um alimento pode ter até ${MAXIMO_SUBSTITUTOS} substitutos.`;
      return;
    }
    if (item.alimento.id === alimento.id) {
      this.mensagemAlimento = 'O substituto deve ser diferente do alimento principal.';
      return;
    }
    if (item.substitutos.some(substituto => substituto.alimento?.id === alimento.id)) {
      this.mensagemAlimento = 'Este substituto já foi adicionado para este alimento.';
      return;
    }
    item.substitutos.push({ chave: this.proximaChave(), alimento, quantidadeGramas: '' });
    this.mensagemAlimento = `${alimento.nome} adicionado como substituto informativo.`;
  }

  private validarFormulario(): Record<string, string> {
    const errors: Record<string, string> = {};
    const titulo = this.form.titulo.trim();
    if (!titulo) errors['titulo'] = 'Informe o título do plano.';
    else if (titulo.length > 150) errors['titulo'] = 'Use até 150 caracteres.';
    if (this.form.orientacoes.length > 4000) errors['orientacoes'] = 'Use até 4.000 caracteres.';
    if (this.form.vigenciaInicio && this.form.vigenciaFim && this.form.vigenciaFim < this.form.vigenciaInicio) {
      errors['vigenciaFim'] = 'O fim deve ser igual ou posterior ao início.';
    }
    this.validarMetas(errors);
    if (this.form.refeicoes.length > 140) errors['refeicoes'] = 'Um plano pode conter até 140 refeições.';
    for (const [indice, refeicao] of this.form.refeicoes.entries()) {
      const prefixo = `refeicao-${refeicao.chave}`;
      const nome = refeicao.nome.trim();
      if (!nome) errors[`${prefixo}-nome`] = 'Informe o nome da refeição.';
      else if (nome.length > 100) errors[`${prefixo}-nome`] = 'Use até 100 caracteres.';
      if (!/^\d{2}:\d{2}$/.test(refeicao.horario)) errors[`${prefixo}-horario`] = 'Informe o horário.';
      if (refeicao.itens.length > 100) errors[`${prefixo}-itens`] = 'Uma refeição pode conter até 100 alimentos.';
      const ids = new Set<number>();
      for (const item of refeicao.itens) {
        const itemPrefixo = `${prefixo}-item-${item.chave}`;
        const gramas = this.numero(item.quantidadeGramas);
        if (!item.alimento) errors[`${itemPrefixo}-alimento`] = 'Selecione um alimento do catálogo.';
        else {
          if (!item.alimento.disponivelParaPrescricao) errors[`${itemPrefixo}-alimento`] = 'Este alimento não tem dados calculáveis.';
          if (ids.has(item.alimento.id)) errors[`${itemPrefixo}-alimento`] = 'Remova alimentos repetidos nesta refeição.';
          ids.add(item.alimento.id);
        }
        if (gramas === null || gramas <= 0 || gramas > 10000 || !this.temNoMaximoDuasCasas(item.quantidadeGramas)) {
          errors[`${itemPrefixo}-gramas`] = 'Informe uma quantidade maior que zero, até 10.000 g e com no máximo duas casas decimais.';
        }
        if (item.substitutos.length > MAXIMO_SUBSTITUTOS) {
          errors[`${itemPrefixo}-substitutos`] = `Um alimento pode ter até ${MAXIMO_SUBSTITUTOS} substitutos.`;
        }
        for (const substituto of item.substitutos) {
          const substitutoPrefixo = `${itemPrefixo}-substituto-${substituto.chave}`;
          const gramasSubstituto = this.numero(substituto.quantidadeGramas);
          if (!substituto.alimento) {
            errors[`${substitutoPrefixo}-alimento`] = 'Selecione um substituto do catálogo.';
          } else {
            if (!substituto.alimento.disponivelParaPrescricao) {
              errors[`${substitutoPrefixo}-alimento`] = 'Este substituto não tem dados calculáveis.';
            }
            if (substituto.alimento.id === item.alimento?.id) {
              errors[`${substitutoPrefixo}-alimento`] = 'O substituto deve ser diferente do alimento principal.';
            }
            if (item.substitutos.some(outro => outro.chave !== substituto.chave
              && outro.alimento?.id === substituto.alimento?.id)) {
              errors[`${substitutoPrefixo}-alimento`] = 'Remova substitutos repetidos para este alimento.';
            }
          }
          if (gramasSubstituto === null || gramasSubstituto <= 0 || gramasSubstituto > 10000
            || !this.temNoMaximoDuasCasas(substituto.quantidadeGramas)) {
            errors[`${substitutoPrefixo}-gramas`] = 'Informe uma quantidade maior que zero, até 10.000 g e com no máximo duas casas decimais.';
          }
        }
      }
      if (indice >= 140) break;
    }
    return errors;
  }

  private validarMetas(errors: Record<string, string>): void {
    const chaves: (keyof MetasEdicao)[] = this.form.metas.metodo === 'PERCENTUAL'
      ? ['kcal', 'percentualProteinas', 'percentualCarboidratos', 'percentualGorduras']
      : ['kcal', 'proteinasGKg', 'carboidratosGKg'];
    const preenchidos = chaves.filter(chave => this.textoNumerico(this.form.metas[chave]).trim() !== '');
    if (preenchidos.length === 0) return;
    if (preenchidos.length !== chaves.length) {
      errors['metas'] = this.form.metas.metodo === 'PERCENTUAL'
        ? 'Preencha as calorias e os três percentuais ou deixe todos vazios.'
        : 'Preencha as calorias, proteínas e carboidratos em g/kg ou deixe todos vazios.';
      return;
    }
    if (this.form.metas.metodo === 'G_POR_KG' && !this.referenciaEnergetica) {
      errors['metas'] = 'Para usar g/kg, informe peso, altura, sexo e data de nascimento do paciente.';
      return;
    }
    for (const chave of chaves) {
      const valor = this.numero(this.form.metas[chave]);
      const percentual = chave.toString().startsWith('percentual');
      const minimoValido = chave === 'kcal' ? valor !== null && valor > 0 : valor !== null && valor >= 0;
      const maximo = chave === 'kcal' ? 999999.99 : percentual ? 100 : 20;
      if (!minimoValido || valor! > maximo || !this.temNoMaximoDuasCasas(this.form.metas[chave])) {
        errors[`meta-${chave}`] = chave === 'kcal'
          ? 'Informe calorias maiores que zero, até 999.999,99 e com no máximo duas casas.'
          : percentual ? 'Informe um percentual entre zero e 100, com no máximo duas casas.'
            : 'Informe um valor entre zero e 20 g/kg, com no máximo duas casas.';
      }
    }
    if (this.form.metas.metodo === 'PERCENTUAL') {
      const soma = (this.numero(this.form.metas.percentualProteinas) ?? 0)
        + (this.numero(this.form.metas.percentualCarboidratos) ?? 0)
        + (this.numero(this.form.metas.percentualGorduras) ?? 0);
      if (!Object.keys(errors).some(chave => chave.startsWith('meta-')) && Math.abs(soma - 100) > 0.001) {
        errors['metas'] = `A distribuição dos macronutrientes deve somar 100% (atual: ${soma.toLocaleString('pt-BR')}%).`;
      }
    } else if (!Object.keys(errors).some(chave => chave.startsWith('meta-')) && !this.metasCalculadas) {
      errors['metas'] = 'Proteínas e carboidratos ultrapassam a meta energética; reduza os valores em g/kg.';
    }
  }

  private validarPublicacao(plano: Plano): string {
    if (!plano.vigenciaInicio || !plano.vigenciaFim) return 'Informe as datas de início e fim da vigência antes de publicar.';
    if (plano.vigenciaFim < plano.vigenciaInicio) return 'O fim da vigência deve ser igual ou posterior ao início.';
    if (plano.refeicoes.length === 0 || plano.refeicoes.some(refeicao => refeicao.itens.length === 0)) {
      return 'A publicação exige ao menos uma refeição, e todas as refeições precisam ter alimentos.';
    }
    if (plano.refeicoes.some(refeicao => refeicao.itens.some(item => !item.alimento.disponivelParaPrescricao))) {
      return 'A publicação exige alimentos com dados nutricionais calculáveis.';
    }
    return '';
  }

  private payload(): PlanoRequest {
    const metas = this.form.metas;
    const camposMeta = metas.metodo === 'PERCENTUAL'
      ? [metas.kcal, metas.percentualProteinas, metas.percentualCarboidratos, metas.percentualGorduras]
      : [metas.kcal, metas.proteinasGKg, metas.carboidratosGKg];
    const metasPreenchidas = camposMeta
      .every(valor => this.textoNumerico(valor).trim() !== '');
    const calculadas = this.metasCalculadas;
    const percentuais = this.percentuaisCalculados;
    return {
      titulo: this.form.titulo.trim(),
      orientacoes: this.form.orientacoes.trim() || null,
      vigenciaInicio: this.form.vigenciaInicio || null,
      vigenciaFim: this.form.vigenciaFim || null,
      metas: metasPreenchidas && calculadas ? calculadas : null,
      percentuais: metasPreenchidas && percentuais ? percentuais : null,
      ...(this.planoEmEdicaoId === null ? {} : { versao: this.planoSelecionado?.versao }),
      refeicoes: this.form.refeicoes.map(refeicao => ({
        diaSemana: refeicao.diaSemana ?? null,
        nome: refeicao.nome.trim(),
        horario: refeicao.horario,
        itens: refeicao.itens.map(item => ({
          alimentoId: item.alimento!.id,
          quantidadeGramas: this.numero(item.quantidadeGramas) ?? 0,
          substitutos: item.substitutos.map(substituto => ({
            alimentoId: substituto.alimento!.id,
            quantidadeGramas: this.numero(substituto.quantidadeGramas) ?? 0
          }))
        }))
      }))
    };
  }

  private novoFormulario(): PlanoEdicao {
    return {
      titulo: '', orientacoes: '', vigenciaInicio: '', vigenciaFim: '',
      metas: { metodo: 'PERCENTUAL', kcal: '', percentualProteinas: '', percentualCarboidratos: '',
        percentualGorduras: '', proteinasGKg: '', carboidratosGKg: '' },
      refeicoes: []
    };
  }

  private formularioDoPlano(plano: Plano): PlanoEdicao {
    return {
      titulo: plano.titulo,
      orientacoes: plano.orientacoes ?? '',
      vigenciaInicio: plano.vigenciaInicio ?? '',
      vigenciaFim: plano.vigenciaFim ?? '',
      metas: plano.metas ? {
        metodo: 'PERCENTUAL',
        kcal: String(plano.metas.kcal),
        percentualProteinas: String(plano.percentuais?.proteinas ?? this.percentualDaMeta(plano.metas.proteinas, plano.metas.kcal, 4)),
        percentualCarboidratos: String(plano.percentuais?.carboidratos ?? this.percentualDaMeta(plano.metas.carboidratos, plano.metas.kcal, 4)),
        percentualGorduras: String(plano.percentuais?.gorduras ?? this.percentualDaMeta(plano.metas.gorduras, plano.metas.kcal, 9)),
        proteinasGKg: '', carboidratosGKg: ''
      } : { metodo: 'PERCENTUAL', kcal: '', percentualProteinas: '', percentualCarboidratos: '',
        percentualGorduras: '', proteinasGKg: '', carboidratosGKg: '' },
      refeicoes: plano.refeicoes.map(refeicao => ({
        chave: this.proximaChave(),
        diaSemana: refeicao.diaSemana ?? null,
        nome: refeicao.nome,
        horario: refeicao.horario.slice(0, 5),
        itens: refeicao.itens.map(item => ({
          chave: this.proximaChave(),
          alimento: { ...item.alimento },
          quantidadeGramas: String(item.quantidadeGramas),
          substitutos: (item.substitutos ?? []).map(substituto => ({
            chave: this.proximaChave(),
            alimento: substituto.alimento ? { ...substituto.alimento } : null,
            quantidadeGramas: String(substituto.quantidadeGramas)
          }))
        }))
      }))
    };
  }

  private percentualDaMeta(gramas: number, kcal: number, fator: number): number {
    return kcal > 0 ? Number((gramas * fator / kcal * 100).toFixed(2)) : 0;
  }

  private fatorAtividadeSugerido(respostas: Answers): number {
    if (respostas['physicalActivity'] !== 'Sim') return 1.2;
    const frequencia = String(respostas['weeklyFrequency'] ?? '');
    const intensidade = String(respostas['intensity'] ?? '');
    if (frequencia === 'Diariamente' && ['Intensa', 'Muito intensa'].includes(intensidade)) return 1.9;
    if (frequencia === 'Diariamente' || frequencia === '4 a 5 vezes por semana') return 1.725;
    if (frequencia === '3 vezes por semana' || intensidade === 'Moderada') return 1.55;
    return 1.375;
  }

  private idadeAtual(dataNascimento: string | undefined): number | null {
    if (!dataNascimento || !/^\d{4}-\d{2}-\d{2}/.test(dataNascimento)) return null;
    const nascimento = dataNascimento.slice(0, 10).split('-').map(Number);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento[0];
    if (hoje.getMonth() + 1 < nascimento[1]
      || (hoje.getMonth() + 1 === nascimento[1] && hoje.getDate() < nascimento[2])) idade--;
    return idade;
  }

  private assinatura(): string {
    return JSON.stringify(this.form);
  }

  private executarComDescarte(acao: () => void): void {
    if (this.salvando) return;
    if (!this.alterado) {
      acao();
      return;
    }
    this.acaoAposDescarte = acao;
    this.modalDescartarAlteracoes = true;
  }

  private pedirConfirmacaoDestrutiva(
      titulo: string, descricao: string, confirmar: string, acao: () => void): void {
    this.confirmacaoDestrutiva = { titulo, descricao, confirmar, acao };
  }

  private atualizarPlanoNaLista(plano: Plano): void {
    this.planos = [plano, ...this.planos.filter(item => item.id !== plano.id)].sort((a, b) => b.id - a.id);
  }

  private somar(a: Nutrientes, b: Nutrientes): Nutrientes {
    return {
      kcal: a.kcal + b.kcal,
      proteinas: a.proteinas + b.proteinas,
      carboidratos: a.carboidratos + b.carboidratos,
      gorduras: a.gorduras + b.gorduras,
      fibras: a.fibras === null || b.fibras === null ? null : a.fibras + b.fibras
    };
  }

  private numero(valor: CampoNumericoEdicao): number | null {
    const texto = this.textoNumerico(valor).trim().replace(',', '.');
    if (!texto) return null;
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
  }

  private temNoMaximoDuasCasas(valor: CampoNumericoEdicao): boolean {
    const texto = this.textoNumerico(valor).trim().replace(',', '.');
    return /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(texto);
  }

  private textoNumerico(valor: CampoNumericoEdicao): string {
    return valor === null ? '' : String(valor);
  }

  private proximaChave(): number {
    this.chaveAtual += 1;
    return this.chaveAtual;
  }

  private limparMensagens(): void {
    this.erro = '';
    this.mensagem = '';
    this.errors = {};
  }

  private dataLocal(iso: string): string {
    const [ano, mes, dia] = iso.slice(0, 10).split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
  }
}

export const dietaPendenteGuard: CanDeactivateFn<DietaComponent> = component => component.podeSair();
