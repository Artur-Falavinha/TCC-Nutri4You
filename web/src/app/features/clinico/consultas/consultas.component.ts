import { DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, CanDeactivateFn, Router, RouterLink } from '@angular/router';
import { forkJoin, of, interval } from 'rxjs';
import { ApiErrorResponse } from '../../../core/models/api-response.model';
import { PacientesService } from '../../../core/services/pacientes.service';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert.component';
import { PatientTabsComponent } from '../../../shared/components/patient-tabs/patient-tabs.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui-select/ui-select.component';
import { AnamneseField } from '../../anamnese/anamnese.models';
import { AnamneseService } from '../../anamnese/anamnese.service';
import { CAMPOS_MEDIDAS, ConsultaForm, STATUS_CONSULTA, decimal } from './consulta-form';
import { AtendimentoClinico, AtendimentosService, Consulta, ConsultasService, PaginaConsultas } from './consultas.service';

@Component({
  selector: 'app-consultas',
  imports: [DatePipe, FormsModule, RouterLink, PatientTabsComponent, UiButtonComponent,
    UiInputComponent, UiSelectComponent, FormAlertComponent],
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css'
})
export class ConsultasComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pacientes = inject(PacientesService);
  private readonly service = inject(ConsultasService);
  private readonly atendimentos = inject(AtendimentosService);
  private readonly anamnese = inject(AnamneseService);
  private readonly destroyRef = inject(DestroyRef);
  patientId = Number(this.route.snapshot.paramMap.get('id'));
  readonly atendimento = !!this.route.snapshot.data['atendimento'];
  contextoClinico: AtendimentoClinico['contextoClinico'] = null;
  camposAnamnese: AnamneseField[] = [];
  erroCamposAnamnese = '';
  readonly consultaId = this.route.snapshot.paramMap.has('consultaId')
    ? Number(this.route.snapshot.paramMap.get('consultaId')) : null;
  readonly editor = !!this.route.snapshot.data['editor'];
  readonly statusOptions = STATUS_CONSULTA.filter(s => ['CONFIRMADA', 'REALIZADA'].includes(s.value));
  consultaAtual: Consulta | null = null;
  agora = Date.now();
  readonly grupos = [
    { titulo: 'Medidas antropométricas', campos: CAMPOS_MEDIDAS.slice(0, 4) },
    { titulo: 'Pregas cutâneas', campos: CAMPOS_MEDIDAS.slice(4, 8) },
    { titulo: 'Circunferências', campos: CAMPOS_MEDIDAS.slice(8) }
  ];
  readonly decimal = decimal;
  form = new ConsultaForm();
  nome = '';
  carregando = true;
  carregado = false;
  salvando = false;
  erro = '';
  mensagem = '';
  errors: Record<string, string> = {};
  lista: PaginaConsultas | null = null;
  private original = this.form.assinatura();

  ngOnInit(): void {
    if (this.atendimento) {
      this.anamnese.fields().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: campos => { this.camposAnamnese = campos; },
        error: () => { this.erroCamposAnamnese = 'Não foi possível carregar os campos da anamnese.'; }
      });
    }
    if (this.router.lastSuccessfulNavigation?.extras.state?.['consultaSalva']) {
      this.mensagem = 'Consulta salva com sucesso.';
    }
    this.carregar();
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.agora = Date.now(); });
  }

  carregar(pagina = 0): void {
    if (this.salvando) return;
    this.carregando = true;
    this.erro = '';
    if (this.atendimento && this.consultaId !== null) {
      this.atendimentos.buscar(this.consultaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: consulta => {
          this.patientId = consulta.pacienteId ?? 0;
          this.nome = consulta.pacienteNome;
          this.contextoClinico = consulta.contextoClinico;
          this.consultaAtual = consulta;
          this.form.carregar(consulta);
          this.original = this.form.assinatura();
          this.carregado = true;
          this.carregando = false;
        },
        error: (error: ApiErrorResponse) => { this.erro = error.message || 'Não foi possível carregar o atendimento.'; this.carregando = false; }
      });
      return;
    }
    forkJoin({
      paciente: this.pacientes.buscarPorId(this.patientId),
      consulta: this.editor && this.consultaId !== null
        ? this.service.buscar(this.patientId, this.consultaId) : of(null),
      lista: !this.editor ? this.service.listar(this.patientId, pagina) : of(null)
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ paciente, consulta, lista }) => {
        this.nome = paciente.nome;
        if (consulta) this.form.carregar(consulta);
        this.consultaAtual = consulta;
        this.original = this.form.assinatura();
        this.lista = lista;
        this.carregado = true;
        this.carregando = false;
      },
      error: (error: ApiErrorResponse) => {
        this.erro = error.message || 'Não foi possível carregar as consultas.';
        this.carregando = false;
      }
    });
  }

  salvar(): void {
    if (this.salvando || this.carregando || !this.carregado || !this.podeEditar) return;
    this.errors = this.form.validar();
    this.erro = '';
    if (Object.keys(this.errors).length) {
      this.erro = 'Confira os campos destacados antes de salvar.';
      setTimeout(() => document.getElementById(Object.keys(this.errors)[0])?.focus());
      return;
    }
    this.salvando = true;
    const operacao = this.atendimento && this.consultaId !== null
      ? this.atendimentos.salvar(this.consultaId, this.form.payload())
      : this.service.salvar(this.patientId, this.consultaId, this.form.payload());
    operacao
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.original = this.form.assinatura();
          this.salvando = false;
          if (this.atendimento) { this.mensagem = 'Atendimento salvo com sucesso.'; this.carregar(); }
          else void this.router.navigate(['/pacientes', this.patientId, 'consultas'], { state: { consultaSalva: true } });
        },
        error: (error: ApiErrorResponse) => {
          this.erro = error.message || 'Não foi possível salvar. Seus campos foram mantidos.';
          this.salvando = false;
        }
      });
  }

  get respostasAnamnese(): { secao: string; campos: { label: string; valor: string }[] }[] {
    const respostas = this.contextoClinico?.anamneseFinalizada;
    if (!respostas) return [];
    const secoes: { secao: string; campos: { label: string; valor: string }[] }[] = [];
    for (const campo of this.camposAnamnese) {
      const valor = respostas[campo.key];
      const texto = Array.isArray(valor) ? valor.filter(item => typeof item === 'string' || typeof item === 'number').join(', ')
        : typeof valor === 'string' || typeof valor === 'number' ? String(valor) : '';
      if (!texto.trim()) continue;
      let secao = secoes.find(item => item.secao === campo.section);
      if (!secao) { secao = { secao: campo.section, campos: [] }; secoes.push(secao); }
      secao.campos.push({ label: campo.label, valor: texto });
    }
    return secoes;
  }

  get podeEditar(): boolean {
    return !!this.consultaAtual && (!this.atendimento || this.consultaAtual.status !== 'REALIZADA') && (this.consultaAtual.status === 'REALIZADA'
      || (this.consultaAtual.status === 'CONFIRMADA' && !!this.consultaAtual.iniciadaEm));
  }
  podeIniciar(c: Consulta): boolean {
    // Server supplies the configured bounds with the clinic timezone offset.
    return c.status === 'CONFIRMADA' && !c.iniciadaEm && !!c.inicioPermitidoDe && !!c.inicioPermitidoAte
      && this.agora >= Date.parse(c.inicioPermitidoDe)
      && this.agora <= Date.parse(c.inicioPermitidoAte);
  }
  acao(c: Consulta, acao: 'inicio' | 'confirmacao' | 'cancelamento'): void {
    if (this.salvando || (acao === 'cancelamento' && !window.confirm('Cancelar esta consulta?'))) return;
    this.salvando = true; this.erro = '';
    this.service.acao(this.patientId, c, acao).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando = false;
        if (acao === 'inicio' && !this.editor) void this.router.navigate(['/pacientes', this.patientId, 'consultas', c.id]);
        else this.carregar(this.lista?.pagina || 0);
      },
      error: (e: ApiErrorResponse) => { this.salvando = false; this.erro = e.message; }
    });
  }

  statusLabel(status: string): string {
    return STATUS_CONSULTA.find(item => item.value === status)?.label || status;
  }
  get alterado(): boolean { return this.editor && this.carregado && this.form.assinatura() !== this.original; }
  podeSair(): boolean {
    return !this.salvando && (!this.alterado || window.confirm('Descartar as alterações desta consulta?'));
  }
  @HostListener('window:beforeunload', ['$event'])
  antesDeFechar(event: BeforeUnloadEvent): void {
    if (this.alterado || this.salvando) { event.preventDefault(); event.returnValue = ''; }
  }
}

export const consultaPendenteGuard: CanDeactivateFn<ConsultasComponent> = component => component.podeSair();
