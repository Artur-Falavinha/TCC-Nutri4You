import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, CanDeactivateFn, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, exhaustMap, filter, forkJoin, of, Observable, Subject, take, timer } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { ApiErrorResponse } from '../../../core/models/api-response.model';
import { PacientesService } from '../../../core/services/pacientes.service';
import { EstadoVazioComponent } from '../../../shared/components/estado-vazio/estado-vazio.component';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert.component';
import { PatientTabsComponent } from '../../../shared/components/patient-tabs/patient-tabs.component';
import { TituloPacienteComponent } from '../../../shared/components/avatar-paciente/titulo-paciente.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui-select/ui-select.component';
import { DataHoraClinicaPipe } from '../../../shared/pipes/data-hora-clinica.pipe';
import { DialogoConfirmacaoComponent } from '../../../shared/components/dialogo-confirmacao/dialogo-confirmacao.component';
import { CAMPOS_MEDIDAS, CampoMedida, ConsultaForm, STATUS_CONSULTA, decimal } from './consulta-form';
import { Consulta, ConsultaPayload, ConsultasService, ModoPercentualGordura, PaginaConsultas } from './consultas.service';

const MENSAGENS_ACAO_CONSULTA = {
  inicio: 'Atendimento iniciado.',
  confirmacao: 'Consulta confirmada.',
  recusa: 'Consulta recusada.',
  cancelamento: 'Consulta cancelada.'
} as const;

type AcaoConsulta = keyof typeof MENSAGENS_ACAO_CONSULTA;

@Component({
  selector: 'app-consultas',
  imports: [DataHoraClinicaPipe, FormsModule, RouterLink, EstadoVazioComponent, PatientTabsComponent, TituloPacienteComponent, UiButtonComponent,
    UiInputComponent, UiSelectComponent, FormAlertComponent, DialogoConfirmacaoComponent],
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css'
})
export class ConsultasComponent implements OnInit {
  private readonly toast = inject(ToastService);
  modalSaida = false;
  decisaoConsulta: { consulta: Consulta; tipo: 'confirmacao' | 'cancelamento' | 'recusa' } | null = null;
  private respostaSaida: Subject<boolean> | null = null;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pacientes = inject(PacientesService);
  private readonly service = inject(ConsultasService);
  private readonly destroyRef = inject(DestroyRef);
  patientId = Number(this.route.snapshot.paramMap.get('id'));
  readonly consultaId = this.route.snapshot.paramMap.has('consultaId')
    ? Number(this.route.snapshot.paramMap.get('consultaId')) : null;
  readonly editor = !!this.route.snapshot.data['editor'];
  readonly modosPercentualGordura = [
    { value: 'AUTOMATICO', label: 'Calcular pelas 7 pregas' },
    { value: 'MANUAL', label: 'Informar manualmente' }
  ];
  consultaAtual: Consulta | null = null;
  readonly grupos = [
    { titulo: 'Medidas antropométricas e composição corporal', campos: CAMPOS_MEDIDAS.slice(0, 6) },
    { titulo: 'Sete pregas de Jackson-Pollock', campos: CAMPOS_MEDIDAS.slice(7, 14) },
    { titulo: 'Medidas complementares', campos: [CAMPOS_MEDIDAS[6], ...CAMPOS_MEDIDAS.slice(14)] }
  ];
  readonly decimal = decimal;
  form = new ConsultaForm();
  nome = '';
  carregando = true;
  carregado = false;
  salvando = false;
  erro = '';
  vinculoEncerrado = false;
  errors: Record<string, string> = {};
  lista: PaginaConsultas | null = null;
  private original = this.form.assinatura();

  ngOnInit(): void {
    this.carregar();
    this.monitorarVinculo();
  }

  private monitorarVinculo(): void {
    const consultaId = this.consultaId;
    if (!this.editor || consultaId === null) return;

    timer(15_000, 15_000).pipe(
      filter(() => !this.vinculoEncerrado && !this.salvando && this.consultaAtual?.status === 'CONFIRMADA'
        && !!this.consultaAtual.iniciadaEm),
      exhaustMap(() => this.service.verificarAcesso(this.patientId, consultaId).pipe(
        catchError((erro: ApiErrorResponse) => {
          if (erro.error === 'VINCULO_ENCERRADO') this.tratarFalha(erro, 'O vínculo foi encerrado.');
          return EMPTY;
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  carregar(pagina = 0): void {
    if (this.salvando) return;
    this.carregando = true;
    this.erro = '';
    forkJoin({
      paciente: this.pacientes.buscarPorId(this.patientId),
      consulta: this.editor && this.consultaId !== null
        ? this.service.buscar(this.patientId, this.consultaId) : of(null),
      lista: !this.editor ? this.service.listar(this.patientId, pagina) : of(null)
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ paciente, consulta, lista }) => {
        this.nome = paciente.nome;
        if (consulta) {
          this.form.definirContextoAntropometrico(
            consulta.contextoClinico?.dataNascimento ?? paciente.dataNascimento ?? null,
            consulta.contextoClinico?.sexo ?? paciente.sexo ?? null);
          this.form.carregar(consulta);
          this.form.preencherDaAnamnese(consulta.contextoClinico?.anamneseFinalizada);
        }
        this.consultaAtual = consulta;
        this.original = this.form.assinatura();
        this.lista = lista;
        this.carregado = true;
        this.carregando = false;
      },
      error: (error: ApiErrorResponse) => {
        this.tratarFalha(error, 'Não foi possível carregar as consultas.');
        this.carregando = false;
      }
    });
  }

  salvar(concluir = false): void {
    if (this.salvando || this.carregando || !this.carregado || !this.podeEditar) return;
    const statusAnterior = this.form.status;
    this.form.status = concluir ? 'REALIZADA' : 'CONFIRMADA';
    this.errors = this.form.validar();
    const payload = this.form.payload();
    this.form.status = statusAnterior;
    this.erro = '';
    if (Object.keys(this.errors).length) {
      this.erro = 'Confira os campos destacados antes de salvar.';
      setTimeout(() => document.getElementById(Object.keys(this.errors)[0])?.focus());
      return;
    }

    this.salvarConsulta(payload);
  }

  atualizarMedida(campo: CampoMedida, valor: string): void {
    this.form.atualizarMedida(campo, valor);
    delete this.errors[campo];
    if (campo === 'peso') delete this.errors['massaMuscularKg'];
  }

  atualizarModoPercentualGordura(modo: ModoPercentualGordura): void {
    this.form.atualizarModoPercentualGordura(modo);
    delete this.errors['percentualGordura'];
  }

  private salvarConsulta(payload: ConsultaPayload): void {
    this.salvando = true;
    this.erro = '';
    const operacao = this.service.salvar(this.patientId, this.consultaId, payload);
    operacao.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: consulta => {
        this.consultaAtual = consulta;
        this.form.carregar(consulta);
        this.original = this.form.assinatura();
        this.salvando = false;
        this.toast.sucesso(consulta.status === 'REALIZADA' ? 'Consulta concluída.' : 'Andamento salvo. Você pode continuar depois.');
      },
      error: (error: ApiErrorResponse) => {
        this.tratarFalha(error, 'Não foi possível salvar. Seus campos foram mantidos.', true);
        this.salvando = false;
      }
    });
  }

  get podeEditar(): boolean {
    return this.consultaAtual?.status === 'CONFIRMADA' && !!this.consultaAtual.iniciadaEm;
  }
  podeIniciar(c: Consulta): boolean {
    return c.status === 'CONFIRMADA' && !c.iniciadaEm;
  }
  acao(c: Consulta, acao: AcaoConsulta): void {
    if (this.salvando) return;
    if (acao === 'inicio') this.executarAcao(c, acao);
    else this.decisaoConsulta = { consulta: c, tipo: acao };
  }
  confirmarDecisaoConsulta(): void {
    const decisao = this.decisaoConsulta;
    if (!this.salvando && decisao) this.executarAcao(decisao.consulta, decisao.tipo);
  }
  private executarAcao(c: Consulta, acao: AcaoConsulta): void {
    this.salvando = true; this.erro = '';
    this.service.acao(this.patientId, c, acao).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando = false;
        this.decisaoConsulta = null;
        this.toast.sucesso(MENSAGENS_ACAO_CONSULTA[acao]);
        if (acao === 'inicio' && !this.editor) void this.router.navigate(['/pacientes', this.patientId, 'consultas', c.id]);
        else this.carregar(this.lista?.pagina || 0);
      },
      error: (erro: ApiErrorResponse) => {
        this.salvando = false;
        this.decisaoConsulta = null;
        this.tratarFalha(erro, 'Não foi possível atualizar a consulta.', true);
      }
    });
  }

  private tratarFalha(erro: ApiErrorResponse, mensagemPadrao: string, temporario = false): void {
    const mensagem = erro.message || mensagemPadrao;
    if (temporario && erro.error !== 'VINCULO_ENCERRADO') {
      this.toast.erro(mensagem);
      return;
    }
    this.erro = mensagem;
    if (erro.error !== 'VINCULO_ENCERRADO') return;

    this.vinculoEncerrado = true;
    this.carregado = false;
    this.nome = '';
    this.consultaAtual = null;
    this.lista = null;
    this.form = new ConsultaForm();
    this.original = this.form.assinatura();
  }

  statusLabel(status: string, iniciadaEm?: string | null): string {
    if (status === 'CONFIRMADA' && iniciadaEm) return 'Em atendimento';
    return STATUS_CONSULTA.find(item => item.value === status)?.label || status;
  }
  get alterado(): boolean { return this.editor && this.carregado && this.form.assinatura() !== this.original; }
  podeSair(): boolean | Observable<boolean> {
    if (this.salvando) return false;
    if (!this.alterado) return true;
    this.respostaSaida ??= new Subject<boolean>();
    this.modalSaida = true;
    return this.respostaSaida.asObservable().pipe(take(1));
  }
  responderSaida(confirmar: boolean): void {
    this.modalSaida = false;
    this.respostaSaida?.next(confirmar);
    this.respostaSaida?.complete();
    this.respostaSaida = null;
  }
  @HostListener('window:beforeunload', ['$event'])
  antesDeFechar(event: BeforeUnloadEvent): void {
    if (this.alterado || this.salvando) { event.preventDefault(); event.returnValue = ''; }
  }
}

export const consultaPendenteGuard: CanDeactivateFn<ConsultasComponent> = component => component.podeSair();
