import { DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, CanDeactivateFn } from '@angular/router';
import { EMPTY, Subject, catchError, forkJoin, switchMap } from 'rxjs';

import { ApiErrorResponse } from '../../core/models/api-response.model';
import { Paciente } from '../../core/models/paciente.models';
import { PacientesService } from '../../core/services/pacientes.service';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { PatientTabsComponent } from '../../shared/components/patient-tabs/patient-tabs.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
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
import { DietaService } from './dieta.service';

type TelaDieta = 'lista' | 'detalhe' | 'editor';
type FiltrosBuscaAlimentos = { nome: string; categoria: string; pagina: number } | null;
type PedidoListaCompras = { planoId: number; dias: number } | null;

const NUTRIENTES_VAZIOS: Nutrientes = { kcal: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0 };
const MAXIMO_SUBSTITUTOS = 10;

@Component({
  selector: 'app-dieta',
  imports: [DatePipe, FormsModule, PatientTabsComponent, FormAlertComponent, UiButtonComponent, BuscaAlimentosComponent],
  templateUrl: './dieta.component.html',
  styleUrl: './dieta.component.css'
})
export class DietaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pacientes = inject(PacientesService);
  private readonly dieta = inject(DietaService);
  private readonly destroyRef = inject(DestroyRef);
  readonly patientId = Number(this.route.snapshot.paramMap.get('id'));

  paciente: Paciente | null = null;
  planos: Plano[] = [];
  planoSelecionado: Plano | null = null;
  planoEmEdicaoId: number | null = null;
  tela: TelaDieta = 'lista';
  form = this.novoFormulario();
  carregando = true;
  carregado = false;
  salvando = false;
  publicando = false;
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
  private substitutoSelecionado: { refeicaoChave: number; itemChave: number } | null = null;

  get podeColarRefeicao(): boolean {
    return this.refeicaoCopiada !== null && this.form.refeicoes.length < 20;
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
    forkJoin({
      paciente: this.pacientes.buscarPorId(this.patientId),
      planos: this.dieta.listarPlanos(this.patientId)
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ paciente, planos }) => {
        this.paciente = paciente;
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

  abrirNovoRascunho(): void {
    if (!this.podeTrocarTela()) return;
    this.tela = 'editor';
    this.planoEmEdicaoId = null;
    this.planoSelecionado = null;
    this.form = this.novoFormulario();
    this.original = this.assinatura();
    this.limparMensagens();
  }

  abrirDetalhe(plano: Plano): void {
    if (!this.podeTrocarTela()) return;
    this.erro = '';
    this.mensagem = '';
    this.dieta.buscarPlano(this.patientId, plano.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: detalhe => {
          this.planoSelecionado = detalhe;
          this.tela = 'detalhe';
        },
        error: (error: ApiErrorResponse) => {
          this.erro = error.message || 'Não foi possível abrir este plano.';
        }
      });
  }

  abrirEdicao(): void {
    const plano = this.planoSelecionado;
    if (!plano || plano.status !== 'RASCUNHO') return;
    this.planoEmEdicaoId = plano.id;
    this.form = this.formularioDoPlano(plano);
    this.original = this.assinatura();
    this.tela = 'editor';
    this.limparMensagens();
  }

  duplicarPlano(): void {
    const plano = this.planoSelecionado;
    if (!plano || plano.status === 'RASCUNHO' || !this.podeTrocarTela()) return;
    this.planoEmEdicaoId = null;
    this.form = this.formularioDoPlano(plano);
    this.form.titulo = `Cópia de ${plano.titulo}`.slice(0, 150);
    this.form.vigenciaInicio = '';
    this.form.vigenciaFim = '';
    this.original = this.assinatura();
    this.tela = 'editor';
    this.limparMensagens();
  }

  voltarParaLista(): void {
    if (!this.podeTrocarTela()) return;
    this.tela = 'lista';
    this.planoSelecionado = null;
    this.limparMensagens();
  }

  cancelarEdicao(): void {
    if (!this.podeTrocarTela()) return;
    this.tela = this.planoEmEdicaoId !== null && this.planoSelecionado ? 'detalhe' : 'lista';
    this.limparMensagens();
  }

  adicionarRefeicao(): void {
    if (this.form.refeicoes.length >= 20) {
      this.erro = 'Um plano pode conter até 20 refeições.';
      return;
    }
    this.form.refeicoes.push({ chave: this.proximaChave(), nome: '', horario: '', itens: [] });
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
    if (this.form.refeicoes.length >= 20) {
      this.erro = 'Um plano pode conter até 20 refeições.';
      return;
    }

    this.form.refeicoes.push({
      chave: this.proximaChave(),
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
    this.form.refeicoes = this.form.refeicoes.filter(item => item.chave !== refeicao.chave);
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
      ? this.dieta.criarPlano(this.patientId, request)
      : this.dieta.atualizarPlano(this.patientId, this.planoEmEdicaoId, request);
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
    if (!plano || plano.status !== 'RASCUNHO' || this.publicando) return;
    const problema = this.validarPublicacao(plano);
    if (problema) {
      this.erro = problema;
      this.mensagem = '';
      return;
    }
    if (!window.confirm(`Publicar “${plano.titulo}”, versão ${plano.versao}, para ${this.formatarPeriodo(plano)}?`)) return;
    this.publicando = true;
    this.erro = '';
    this.mensagem = '';
    this.dieta.publicarPlano(this.patientId, plano.id, plano.versao)
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
    if (!window.confirm(`Excluir o rascunho “${plano.titulo}”? Esta ação não pode ser desfeita.`)) return;
    this.excluindo = true;
    this.erro = '';
    this.dieta.excluirRascunho(this.patientId, plano.id, plano.versao)
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

  podeSair(): boolean {
    return !this.salvando && (!this.alterado || window.confirm('Descartar as alterações não salvas deste plano?'));
  }

  get totaisPrevistos(): Nutrientes {
    return this.form.refeicoes.reduce((total, refeicao) => this.somar(total, this.totaisRefeicaoPrevistos(refeicao)), { ...NUTRIENTES_VAZIOS });
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
        return this.dieta.previsualizarListaCompras(this.patientId, pedido.planoId, pedido.dias).pipe(
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
    if (this.form.refeicoes.length > 20) errors['refeicoes'] = 'Um plano pode conter até 20 refeições.';
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
      if (indice >= 20) break;
    }
    return errors;
  }

  private validarMetas(errors: Record<string, string>): void {
    const chaves: (keyof MetasEdicao)[] = ['kcal', 'proteinas', 'carboidratos', 'gorduras'];
    const preenchidos = chaves.filter(chave => this.textoNumerico(this.form.metas[chave]).trim() !== '');
    if (preenchidos.length === 0) return;
    if (preenchidos.length !== chaves.length) {
      errors['metas'] = 'Preencha os quatro campos de meta ou deixe todos vazios.';
      return;
    }
    for (const chave of chaves) {
      const valor = this.numero(this.form.metas[chave]);
      const minimoValido = chave === 'kcal' ? valor !== null && valor > 0 : valor !== null && valor >= 0;
      if (!minimoValido || valor! > 999999.99 || !this.temNoMaximoDuasCasas(this.form.metas[chave])) {
        errors[`meta-${chave}`] = chave === 'kcal'
          ? 'Informe calorias maiores que zero, até 999.999,99 e com no máximo duas casas.'
          : 'Informe um valor entre zero e 999.999,99, com no máximo duas casas.';
      }
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
    const metasPreenchidas = [metas.kcal, metas.proteinas, metas.carboidratos, metas.gorduras]
      .every(valor => this.textoNumerico(valor).trim() !== '');
    return {
      titulo: this.form.titulo.trim(),
      orientacoes: this.form.orientacoes.trim() || null,
      vigenciaInicio: this.form.vigenciaInicio || null,
      vigenciaFim: this.form.vigenciaFim || null,
      metas: metasPreenchidas ? {
        kcal: this.numero(metas.kcal) ?? 0,
        proteinas: this.numero(metas.proteinas) ?? 0,
        carboidratos: this.numero(metas.carboidratos) ?? 0,
        gorduras: this.numero(metas.gorduras) ?? 0
      } : null,
      ...(this.planoEmEdicaoId === null ? {} : { versao: this.planoSelecionado?.versao }),
      refeicoes: this.form.refeicoes.map(refeicao => ({
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
      metas: { kcal: '', proteinas: '', carboidratos: '', gorduras: '' },
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
        kcal: String(plano.metas.kcal),
        proteinas: String(plano.metas.proteinas),
        carboidratos: String(plano.metas.carboidratos),
        gorduras: String(plano.metas.gorduras)
      } : { kcal: '', proteinas: '', carboidratos: '', gorduras: '' },
      refeicoes: plano.refeicoes.map(refeicao => ({
        chave: this.proximaChave(),
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

  private assinatura(): string {
    return JSON.stringify(this.form);
  }

  private podeTrocarTela(): boolean {
    return !this.salvando && (!this.alterado || window.confirm('Descartar as alterações não salvas deste plano?'));
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
