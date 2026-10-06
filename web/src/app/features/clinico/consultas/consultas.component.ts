import { DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, CanDeactivateFn, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiErrorResponse } from '../../../core/models/api-response.model';
import { PacientesService } from '../../../core/services/pacientes.service';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert.component';
import { PatientTabsComponent } from '../../../shared/components/patient-tabs/patient-tabs.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui-select/ui-select.component';
import { CAMPOS_MEDIDAS, ConsultaForm, STATUS_CONSULTA, decimal } from './consulta-form';
import { ConsultasService, PaginaConsultas } from './consultas.service';

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
  private readonly destroyRef = inject(DestroyRef);
  readonly patientId = Number(this.route.snapshot.paramMap.get('id'));
  readonly consultaId = this.route.snapshot.paramMap.has('consultaId')
    ? Number(this.route.snapshot.paramMap.get('consultaId')) : null;
  readonly editor = !!this.route.snapshot.data['editor'];
  readonly statusOptions = STATUS_CONSULTA;
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
    if (this.router.lastSuccessfulNavigation?.extras.state?.['consultaSalva']) {
      this.mensagem = 'Consulta salva com sucesso.';
    }
    this.carregar();
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
        if (consulta) this.form.carregar(consulta);
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
    if (this.salvando || this.carregando || !this.carregado) return;
    this.errors = this.form.validar();
    this.erro = '';
    if (Object.keys(this.errors).length) {
      this.erro = 'Confira os campos destacados antes de salvar.';
      setTimeout(() => document.getElementById(Object.keys(this.errors)[0])?.focus());
      return;
    }
    this.salvando = true;
    this.service.salvar(this.patientId, this.consultaId, this.form.payload())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.original = this.form.assinatura();
          this.salvando = false;
          void this.router.navigate(['/pacientes', this.patientId, 'consultas'], { state: { consultaSalva: true } });
        },
        error: (error: ApiErrorResponse) => {
          this.erro = error.message || 'Não foi possível salvar. Seus campos foram mantidos.';
          this.salvando = false;
        }
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
