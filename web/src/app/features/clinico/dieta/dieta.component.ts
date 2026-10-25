import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, CanDeactivateFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiErrorResponse } from '../../../core/models/api-response.model';
import { PacientesService } from '../../../core/services/pacientes.service';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert.component';
import { PatientTabsComponent } from '../../../shared/components/patient-tabs/patient-tabs.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import {
  AlimentoEditorItem,
  AlimentoTaco,
  DIAS_SEMANA,
  DiaSemana,
  ListaComprasResponse,
  NutrientesCalculados,
  PlanoAlimentarPayload,
  PlanoAlimentarResponse,
  RefeicaoEditorItem,
  SubstitutoEditorItem,
  arredondar2,
  calcularNutrientesItem,
  parseGramas
} from './dieta.models';
import { DietaService } from './dieta.service';

@Component({
  selector: 'app-dieta',
  imports: [
    DecimalPipe,
    FormsModule,
    PatientTabsComponent,
    UiButtonComponent,
    FormAlertComponent
  ],
  templateUrl: './dieta.component.html',
  styleUrl: './dieta.component.css'
})
export class DietaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pacientesService = inject(PacientesService);
  private readonly dietaService = inject(DietaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly patientId = Number(this.route.snapshot.paramMap.get('id'));
  readonly diasSemana = DIAS_SEMANA;

  nomePaciente = '';
  carregando = true;
  carregado = false;
  salvando = false;
  erro = '';
  mensagem = '';

  catalogoTaco: AlimentoTaco[] = [];
  categoriasTaco: string[] = [];
  categoriaFiltro = '';

  planosHistorico: PlanoAlimentarResponse[] = [];
  planoAtualId: number | null = null;
  statusPlano = 'RASCUNHO';
  versaoPlano: number | null = null;
  tituloPlano = 'Plano alimentar';
  observacoesPlano = '';
  vigenciaInicio = this.hojeIso();
  vigenciaFim = '';

  diaSelecionado: DiaSemana = 'Segunda';
  refeicoes: RefeicaoEditorItem[] = [];
  refeicaoCopiada: RefeicaoEditorItem | null = null;

  exibirConfiguracoesPlano = false;
  exibirModalListaCompras = false;
  carregandoListaCompras = false;
  listaCompras: ListaComprasResponse | null = null;

  private uidCounter = 1;
  private assinaturaOriginal = '';

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  carregarDadosIniciais(): void {
    if (this.salvando) return;
    this.carregando = true;
    this.erro = '';

    forkJoin({
      paciente: this.pacientesService.buscarPorId(this.patientId),
      alimentosPage: this.dietaService.buscarAlimentos('', '', 0, 200).pipe(
        catchError(() => of({ itens: [], pagina: 0, tamanho: 200, totalItens: 0, totalPaginas: 0 }))
      ),
      categorias: this.dietaService.listarCategorias().pipe(catchError(() => of([]))),
      planos: this.dietaService.listarPlanos(this.patientId).pipe(catchError(() => of([])))
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ paciente, alimentosPage, categorias, planos }) => {
          this.nomePaciente = paciente.nome;
          this.catalogoTaco = alimentosPage.itens || [];
          this.categoriasTaco = categorias || [];
          this.planosHistorico = planos || [];

          const planoInicial =
            this.planosHistorico.find(p => p.status === 'RASCUNHO') ||
            this.planosHistorico.find(p => p.status === 'PUBLICADO' && p.vigente) ||
            this.planosHistorico.find(p => p.status === 'PUBLICADO') ||
            this.planosHistorico[0] ||
            null;

          if (planoInicial) {
            this.aplicarPlanoNoEditor(planoInicial);
          } else {
            this.iniciarPlanoEmBranco();
          }

          this.carregado = true;
          this.carregando = false;
        },
        error: (error: ApiErrorResponse) => {
          this.erro = error.message || 'Não foi possível carregar os dados da prescrição de dieta.';
          this.carregando = false;
        }
      });
  }

  selecionarDia(dia: DiaSemana): void {
    this.diaSelecionado = dia;
  }

  get refeicoesDoDia(): RefeicaoEditorItem[] {
    return this.refeicoes.filter(r => r.diaSemana === this.diaSelecionado);
  }

  quantidadeRefeicoesNoDia(dia: DiaSemana): number {
    return this.refeicoes.filter(r => r.diaSemana === dia).length;
  }

  get somenteLeitura(): boolean {
    return this.statusPlano === 'SUBSTITUIDO';
  }

  selecionarPlanoHistorico(planoIdStr: string): void {
    const id = Number(planoIdStr);
    const encontrado = this.planosHistorico.find(p => p.id === id);
    if (encontrado) {
      this.erro = '';
      this.mensagem = '';
      this.aplicarPlanoNoEditor(encontrado);
    }
  }

  iniciarNovoPlano(): void {
    this.erro = '';
    this.mensagem = 'Novo rascunho iniciado.';
    this.iniciarPlanoEmBranco();
  }

  duplicarParaNovoRascunho(): void {
    this.planoAtualId = null;
    this.statusPlano = 'RASCUNHO';
    this.versaoPlano = null;
    this.vigenciaInicio = this.hojeIso();
    this.vigenciaFim = '';
    for (const ref of this.refeicoes) {
      ref.id = null;
      for (const item of ref.itens) {
        item.id = null;
        for (const sub of item.substitutos) {
          sub.id = null;
        }
      }
    }
    this.erro = '';
    this.mensagem = 'Cópia editável criada como novo rascunho.';
  }

  adicionarRefeicao(nomePadrao = ''): void {
    if (this.somenteLeitura) return;
    const nova: RefeicaoEditorItem = {
      uid: this.novoUid('ref'),
      id: null,
      diaSemana: this.diaSelecionado,
      nome: nomePadrao,
      horario: this.sugerirHorarioRefeicao(this.refeicoesDoDia.length),
      descricao: '',
      itens: [this.criarItemAlimentoVazio()]
    };
    this.refeicoes.push(nova);
  }

  removerRefeicao(uidRefeicao: string): void {
    if (this.somenteLeitura) return;
    this.refeicoes = this.refeicoes.filter(r => r.uid !== uidRefeicao);
  }

  copiarRefeicao(refeicao: RefeicaoEditorItem): void {
    this.refeicaoCopiada = this.clonarRefeicao(refeicao, this.diaSelecionado);
    this.mensagem = `Refeição "${refeicao.nome || 'Sem nome'}" copiada! Use "Colar refeição" no dia desejado.`;
  }

  colarRefeicao(): void {
    if (this.somenteLeitura || !this.refeicaoCopiada) return;
    const colada = this.clonarRefeicao(this.refeicaoCopiada, this.diaSelecionado);
    this.refeicoes.push(colada);
    this.mensagem = `Refeição "${colada.nome || 'Sem nome'}" colada em ${this.diaSelecionado}.`;
  }

  replicarDiaParaTodos(): void {
    if (this.somenteLeitura) return;
    const origem = this.refeicoesDoDia;
    if (!origem.length) {
      this.erro = `Não há refeições em ${this.diaSelecionado} para replicar.`;
      return;
    }
    const outrosDias = this.diasSemana.filter(d => d !== this.diaSelecionado);
    this.refeicoes = this.refeicoes.filter(r => r.diaSemana === this.diaSelecionado);
    for (const dia of outrosDias) {
      for (const ref of origem) {
        this.refeicoes.push(this.clonarRefeicao(ref, dia));
      }
    }
    this.erro = '';
    this.mensagem = `Refeições de ${this.diaSelecionado} replicadas para todos os dias da semana.`;
  }

  adicionarAlimento(refeicao: RefeicaoEditorItem): void {
    if (this.somenteLeitura) return;
    refeicao.itens.push(this.criarItemAlimentoVazio());
  }

  removerAlimento(refeicao: RefeicaoEditorItem, uidItem: string): void {
    if (this.somenteLeitura) return;
    refeicao.itens = refeicao.itens.filter(i => i.uid !== uidItem);
  }

  adicionarSubstituto(item: AlimentoEditorItem): void {
    if (this.somenteLeitura) return;
    item.substitutos.push(this.criarSubstitutoVazio());
  }

  removerSubstituto(item: AlimentoEditorItem, uidSub: string): void {
    if (this.somenteLeitura) return;
    item.substitutos = item.substitutos.filter(s => s.uid !== uidSub);
  }

  aoDigitarBuscaAlimento(alvo: AlimentoEditorItem | SubstitutoEditorItem, valor: string): void {
    alvo.termoBusca = valor;
    alvo.abertoDropdown = true;
    if (alvo.alimentoNome && valor.trim() !== alvo.alimentoNome) {
      alvo.alimentoId = null;
    }
    const termo = valor.trim();
    if (termo.length >= 2) {
      this.dietaService
        .buscarAlimentos(termo, this.categoriaFiltro, 0, 40)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: pagina => {
            this.mesclarAlimentosNoCatalogo(pagina.itens || []);
          }
        });
    }
  }

  abrirDropdownAlimento(alvo: AlimentoEditorItem | SubstitutoEditorItem): void {
    if (this.somenteLeitura) return;
    this.fecharTodosDropdowns();
    alvo.abertoDropdown = true;
  }

  fecharDropdownComDelay(alvo: AlimentoEditorItem | SubstitutoEditorItem): void {
    setTimeout(() => {
      alvo.abertoDropdown = false;
    }, 180);
  }

  selecionarAlimentoTaco(
    alvo: AlimentoEditorItem | SubstitutoEditorItem,
    alimento: AlimentoTaco
  ): void {
    alvo.alimentoId = alimento.id;
    alvo.alimentoNome = alimento.nome;
    alvo.termoBusca = alimento.nome;
    alvo.categoria = alimento.categoria;
    alvo.kcal100g = alimento.kcal100g || 0;
    alvo.proteina100g = alimento.proteina100g || 0;
    alvo.carboidratos100g = alimento.carboidratos100g || 0;
    alvo.gordura100g = alimento.gordura100g || 0;
    alvo.fibra100g = alimento.fibra100g || 0;
    if (!alvo.quantidadeGramas || parseGramas(alvo.quantidadeGramas) <= 0) {
      alvo.quantidadeGramas = '100';
    }
    alvo.abertoDropdown = false;
  }

  filtrarSugestoesTaco(termo: string): AlimentoTaco[] {
    const buscaNorm = this.normalizarTexto(termo);
    const catNorm = this.normalizarTexto(this.categoriaFiltro);
    const tokens = buscaNorm ? buscaNorm.split(/\s+/) : [];

    const filtrados = this.catalogoTaco.filter(alimento => {
      if (catNorm && this.normalizarTexto(alimento.categoria || '') !== catNorm) {
        return false;
      }
      if (!tokens.length) {
        return true;
      }
      const nomeNorm = this.normalizarTexto(alimento.nome);
      const categoriaNorm = this.normalizarTexto(alimento.categoria || '');
      return tokens.every(t => nomeNorm.includes(t) || categoriaNorm.includes(t));
    });

    return filtrados.slice(0, 25);
  }

  nutrientesDoItem(item: AlimentoEditorItem | SubstitutoEditorItem): NutrientesCalculados {
    return calcularNutrientesItem(item);
  }

  nutrientesDaRefeicao(refeicao: RefeicaoEditorItem): NutrientesCalculados {
    let kcal = 0;
    let proteina = 0;
    let carboidratos = 0;
    let gordura = 0;
    let fibra = 0;
    for (const item of refeicao.itens) {
      if (!item.alimentoId) continue;
      const calc = calcularNutrientesItem(item);
      kcal += calc.kcal;
      proteina += calc.proteina;
      carboidratos += calc.carboidratos;
      gordura += calc.gordura;
      fibra += calc.fibra;
    }
    return {
      kcal: arredondar2(kcal),
      proteina: arredondar2(proteina),
      carboidratos: arredondar2(carboidratos),
      gordura: arredondar2(gordura),
      fibra: arredondar2(fibra)
    };
  }

  get nutrientesDoDiaSelecionado(): NutrientesCalculados {
    let kcal = 0;
    let proteina = 0;
    let carboidratos = 0;
    let gordura = 0;
    let fibra = 0;
    for (const ref of this.refeicoesDoDia) {
      const calc = this.nutrientesDaRefeicao(ref);
      kcal += calc.kcal;
      proteina += calc.proteina;
      carboidratos += calc.carboidratos;
      gordura += calc.gordura;
      fibra += calc.fibra;
    }
    return {
      kcal: arredondar2(kcal),
      proteina: arredondar2(proteina),
      carboidratos: arredondar2(carboidratos),
      gordura: arredondar2(gordura),
      fibra: arredondar2(fibra)
    };
  }

  validarPrescricao(exigirRefeicaoComAlimento: boolean): string | null {
    if (this.vigenciaInicio && this.vigenciaFim && this.vigenciaFim < this.vigenciaInicio) {
      return 'A data final de vigência não pode ser anterior à data inicial.';
    }

    const refeicoesComDados = this.refeicoes.filter(
      r =>
        r.nome.trim().length > 0 ||
        r.itens.some(
          i =>
            i.alimentoId !== null ||
            i.termoBusca.trim().length > 0 ||
            i.quantidadeGramas.trim().length > 0 ||
            i.substitutos.length > 0
        )
    );

    if (exigirRefeicaoComAlimento && refeicoesComDados.length === 0) {
      return 'Adicione ao menos uma refeição com alimentos antes de publicar a dieta.';
    }

    let totalItensValidos = 0;

    for (const ref of refeicoesComDados) {
      const nomeRef = ref.nome.trim();
      if (!nomeRef) {
        this.diaSelecionado = ref.diaSemana;
        return 'Nome da refeição não preenchido corretamente!';
      }

      for (const item of ref.itens) {
        const itemVazio =
          !item.alimentoId &&
          !item.termoBusca.trim() &&
          !item.quantidadeGramas.trim() &&
          item.substitutos.length === 0;

        if (itemVazio && ref.itens.length > 1) {
          continue;
        }

        if (!item.alimentoId) {
          const correspondenciaExata = this.procurarAlimentoPorNomeExato(item.termoBusca);
          if (correspondenciaExata) {
            this.selecionarAlimentoTaco(item, correspondenciaExata);
          } else {
            this.diaSelecionado = ref.diaSemana;
            return `O campo 'Nome do alimento' não foi preenchido na refeição '${nomeRef}'!`;
          }
        }

        const gramas = parseGramas(item.quantidadeGramas);
        if (gramas <= 0) {
          this.diaSelecionado = ref.diaSemana;
          return `A quantidade de gramas do alimento '${item.alimentoNome}' não foi preenchida na refeição '${nomeRef}'!`;
        }

        totalItensValidos++;

        for (const sub of item.substitutos) {
          if (!sub.alimentoId) {
            const subExato = this.procurarAlimentoPorNomeExato(sub.termoBusca);
            if (subExato) {
              this.selecionarAlimentoTaco(sub, subExato);
            } else {
              this.diaSelecionado = ref.diaSemana;
              return `O campo 'Nome do alimento' não foi preenchido na refeição '${nomeRef}'!`;
            }
          }
          const subGramas = parseGramas(sub.quantidadeGramas);
          if (subGramas <= 0) {
            this.diaSelecionado = ref.diaSemana;
            return `A quantidade de gramas do alimento '${sub.alimentoNome}' não foi preenchida na refeição '${nomeRef}'!`;
          }
        }
      }
    }

    if (exigirRefeicaoComAlimento && totalItensValidos === 0) {
      return 'Adicione ao menos um alimento em uma refeição antes de publicar a dieta.';
    }

    return null;
  }

  salvarRascunho(): void {
    this.executarSalvamento('RASCUNHO');
  }

  publicarDieta(): void {
    this.executarSalvamento('PUBLICADO');
  }

  private executarSalvamento(statusAlvo: 'RASCUNHO' | 'PUBLICADO'): void {
    if (this.salvando || this.carregando || this.somenteLeitura) return;
    this.erro = '';
    this.mensagem = '';

    const erroValidacao = this.validarPrescricao(statusAlvo === 'PUBLICADO');
    if (erroValidacao) {
      this.erro = erroValidacao;
      return;
    }

    const payload = this.construirPayload(statusAlvo);
    this.salvando = true;

    this.dietaService
      .salvarPlano(this.patientId, this.planoAtualId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: planoSalvo => {
          this.salvando = false;
          this.atualizarHistoricoLocal(planoSalvo);
          this.aplicarPlanoNoEditor(planoSalvo);
          this.mensagem =
            statusAlvo === 'PUBLICADO'
              ? 'Dieta publicada com sucesso!'
              : 'Rascunho da dieta salvo com sucesso!';
        },
        error: (error: ApiErrorResponse) => {
          this.salvando = false;
          this.erro = error.message || 'Não foi possível salvar a prescrição de dieta.';
        }
      });
  }

  abrirListaCompras(): void {
    if (!this.planoAtualId) {
      this.erro = 'Salve ou publique a dieta antes de gerar a lista de compras.';
      return;
    }
    this.exibirModalListaCompras = true;
    this.carregandoListaCompras = true;
    this.dietaService
      .gerarOuBuscarListaCompras(this.patientId, this.planoAtualId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: lista => {
          this.listaCompras = lista;
          this.carregandoListaCompras = false;
        },
        error: (error: ApiErrorResponse) => {
          this.erro = error.message || 'Não foi possível carregar a lista de compras.';
          this.carregandoListaCompras = false;
          this.exibirModalListaCompras = false;
        }
      });
  }

  fecharListaCompras(): void {
    this.exibirModalListaCompras = false;
  }

  statusLabel(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PUBLICADO':
        return 'Publicado';
      case 'SUBSTITUIDO':
        return 'Substituído (Histórico)';
      default:
        return 'Rascunho';
    }
  }

  get alterado(): boolean {
    return this.carregado && !this.somenteLeitura && this.assinaturaAtual() !== this.assinaturaOriginal;
  }

  podeSair(): boolean {
    return (
      !this.salvando &&
      (!this.alterado || window.confirm('Descartar as alterações não salvas desta dieta?'))
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  antesDeFechar(event: BeforeUnloadEvent): void {
    if (this.alterado || this.salvando) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private iniciarPlanoEmBranco(): void {
    this.planoAtualId = null;
    this.statusPlano = 'RASCUNHO';
    this.versaoPlano = null;
    this.tituloPlano = 'Plano alimentar';
    this.observacoesPlano = '';
    this.vigenciaInicio = this.hojeIso();
    this.vigenciaFim = '';
    this.diaSelecionado = 'Segunda';
    this.refeicoes = [
      {
        uid: this.novoUid('ref'),
        id: null,
        diaSemana: 'Segunda',
        nome: 'Café da manhã',
        horario: '08:00',
        descricao: '',
        itens: [this.criarItemAlimentoVazio()]
      }
    ];
    this.assinaturaOriginal = this.assinaturaAtual();
  }

  private aplicarPlanoNoEditor(plano: PlanoAlimentarResponse): void {
    this.planoAtualId = plano.id;
    this.statusPlano = plano.status || 'RASCUNHO';
    this.versaoPlano = plano.versao ?? 1;
    this.tituloPlano = plano.titulo || 'Plano alimentar';
    this.observacoesPlano = plano.observacoes || '';
    this.vigenciaInicio = plano.vigenciaInicio || this.hojeIso();
    this.vigenciaFim = plano.vigenciaFim || '';

    const convertidas: RefeicaoEditorItem[] = (plano.refeicoes || []).map(ref => ({
      uid: this.novoUid('ref'),
      id: ref.id,
      diaSemana: this.normalizarDiaSemana(ref.diaSemana),
      nome: ref.nome || '',
      horario: (ref.horario || '08:00').slice(0, 5),
      descricao: ref.descricao || '',
      itens: (ref.itens || []).map(item => ({
        uid: this.novoUid('item'),
        id: item.id,
        alimentoId: item.alimentoId,
        alimentoNome: item.alimentoNome,
        termoBusca: item.alimentoNome,
        categoria: item.categoria,
        quantidadeGramas: item.quantidadeGramas != null ? String(item.quantidadeGramas) : '',
        kcal100g: item.kcal100g || 0,
        proteina100g: item.proteina100g || 0,
        carboidratos100g: item.carboidratos100g || 0,
        gordura100g: item.gordura100g || 0,
        fibra100g: item.fibra100g || 0,
        abertoDropdown: false,
        substitutos: (item.substitutos || []).map(sub => ({
          uid: this.novoUid('sub'),
          id: sub.id,
          alimentoId: sub.alimentoId,
          alimentoNome: sub.alimentoNome,
          termoBusca: sub.alimentoNome,
          categoria: sub.categoria,
          quantidadeGramas: sub.quantidadeGramas != null ? String(sub.quantidadeGramas) : '',
          kcal100g: sub.kcal100g || 0,
          proteina100g: sub.proteina100g || 0,
          carboidratos100g: sub.carboidratos100g || 0,
          gordura100g: sub.gordura100g || 0,
          fibra100g: 0,
          abertoDropdown: false
        }))
      }))
    }));

    this.refeicoes = convertidas;
    if (this.refeicoes.length > 0 && !this.refeicoesDoDia.length) {
      this.diaSelecionado = this.refeicoes[0].diaSemana;
    }
    this.assinaturaOriginal = this.assinaturaAtual();
  }

  private construirPayload(status: 'RASCUNHO' | 'PUBLICADO'): PlanoAlimentarPayload {
    const refeicoesValidas = this.refeicoes.filter(r => r.nome.trim().length > 0);
    return {
      pacienteId: this.patientId,
      titulo: this.tituloPlano.trim() || 'Plano alimentar',
      observacoes: this.observacoesPlano.trim() || null,
      status,
      vigenciaInicio: this.vigenciaInicio || null,
      vigenciaFim: this.vigenciaFim || null,
      versao: this.versaoPlano,
      refeicoes: refeicoesValidas.map((ref, idxRef) => ({
        id: ref.id,
        nome: ref.nome.trim(),
        horario: ref.horario || '08:00',
        diaSemana: ref.diaSemana,
        descricao: ref.descricao.trim() || null,
        ordem: idxRef + 1,
        itens: ref.itens
          .filter(i => i.alimentoId !== null && parseGramas(i.quantidadeGramas) > 0)
          .map((item, idxItem) => ({
            id: item.id,
            alimentoId: item.alimentoId,
            nomeAlimento: item.alimentoNome,
            quantidadeGramas: parseGramas(item.quantidadeGramas),
            ordem: idxItem + 1,
            substitutos: item.substitutos
              .filter(s => s.alimentoId !== null && parseGramas(s.quantidadeGramas) > 0)
              .map((sub, idxSub) => ({
                id: sub.id,
                alimentoId: sub.alimentoId,
                nomeAlimento: sub.alimentoNome,
                quantidadeGramas: parseGramas(sub.quantidadeGramas),
                ordem: idxSub + 1
              }))
          }))
      }))
    };
  }

  private atualizarHistoricoLocal(planoSalvo: PlanoAlimentarResponse): void {
    const semAtual = this.planosHistorico.filter(p => p.id !== planoSalvo.id);
    if (planoSalvo.status === 'PUBLICADO') {
      for (const p of semAtual) {
        if (p.status === 'PUBLICADO') {
          p.status = 'SUBSTITUIDO';
          p.vigente = false;
        }
      }
    }
    this.planosHistorico = [planoSalvo, ...semAtual];
  }

  private clonarRefeicao(origem: RefeicaoEditorItem, diaDestino: DiaSemana): RefeicaoEditorItem {
    return {
      uid: this.novoUid('ref'),
      id: null,
      diaSemana: diaDestino,
      nome: origem.nome,
      horario: origem.horario,
      descricao: origem.descricao,
      itens: origem.itens.map(item => ({
        ...item,
        uid: this.novoUid('item'),
        id: null,
        abertoDropdown: false,
        substitutos: item.substitutos.map(sub => ({
          ...sub,
          uid: this.novoUid('sub'),
          id: null,
          abertoDropdown: false
        }))
      }))
    };
  }

  private criarItemAlimentoVazio(): AlimentoEditorItem {
    return {
      uid: this.novoUid('item'),
      id: null,
      alimentoId: null,
      alimentoNome: '',
      termoBusca: '',
      categoria: null,
      quantidadeGramas: '',
      kcal100g: 0,
      proteina100g: 0,
      carboidratos100g: 0,
      gordura100g: 0,
      fibra100g: 0,
      abertoDropdown: false,
      substitutos: []
    };
  }

  private criarSubstitutoVazio(): SubstitutoEditorItem {
    return {
      uid: this.novoUid('sub'),
      id: null,
      alimentoId: null,
      alimentoNome: '',
      termoBusca: '',
      categoria: null,
      quantidadeGramas: '',
      kcal100g: 0,
      proteina100g: 0,
      carboidratos100g: 0,
      gordura100g: 0,
      fibra100g: 0,
      abertoDropdown: false
    };
  }

  private fecharTodosDropdowns(): void {
    for (const ref of this.refeicoes) {
      for (const item of ref.itens) {
        item.abertoDropdown = false;
        for (const sub of item.substitutos) {
          sub.abertoDropdown = false;
        }
      }
    }
  }

  private mesclarAlimentosNoCatalogo(novos: AlimentoTaco[]): void {
    const mapa = new Map<number, AlimentoTaco>();
    for (const a of this.catalogoTaco) {
      mapa.set(a.id, a);
    }
    for (const n of novos) {
      mapa.set(n.id, n);
    }
    this.catalogoTaco = Array.from(mapa.values());
  }

  private procurarAlimentoPorNomeExato(termo: string): AlimentoTaco | undefined {
    const norm = this.normalizarTexto(termo);
    if (!norm) return undefined;
    return this.catalogoTaco.find(a => this.normalizarTexto(a.nome) === norm);
  }

  private normalizarDiaSemana(dia: string | null | undefined): DiaSemana {
    const limpo = (dia || '').trim().toLowerCase();
    if (limpo.startsWith('ter')) return 'Terça';
    if (limpo.startsWith('qua')) return 'Quarta';
    if (limpo.startsWith('qui')) return 'Quinta';
    if (limpo.startsWith('sex')) return 'Sexta';
    if (limpo.startsWith('sab') || limpo.startsWith('sáb')) return 'Sábado';
    if (limpo.startsWith('dom')) return 'Domingo';
    return 'Segunda';
  }

  private normalizarTexto(valor: string): string {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[,;-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private sugerirHorarioRefeicao(indice: number): string {
    const sugestoes = ['08:00', '10:30', '12:30', '16:00', '19:30', '21:30'];
    return sugestoes[indice % sugestoes.length];
  }

  private hojeIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private novoUid(prefixo: string): string {
    return `${prefixo}-${this.uidCounter++}`;
  }

  private assinaturaAtual(): string {
    return JSON.stringify({
      titulo: this.tituloPlano,
      obs: this.observacoesPlano,
      ini: this.vigenciaInicio,
      fim: this.vigenciaFim,
      refeicoes: this.refeicoes.map(r => ({
        dia: r.diaSemana,
        nome: r.nome,
        horario: r.horario,
        itens: r.itens.map(i => ({
          id: i.alimentoId,
          g: i.quantidadeGramas,
          subs: i.substitutos.map(s => ({ id: s.alimentoId, g: s.quantidadeGramas }))
        }))
      }))
    });
  }
}

export const dietaPendenteGuard: CanDeactivateFn<DietaComponent> = component =>
  component.podeSair();

