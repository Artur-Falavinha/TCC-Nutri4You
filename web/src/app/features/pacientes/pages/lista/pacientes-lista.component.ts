import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { NovoPacienteModalComponent } from '../../components/novo-paciente-modal/novo-paciente-modal.component';
import {
  AcaoRelacao,
  RelacaoPacienteModalComponent
} from '../../components/relacao-paciente-modal/relacao-paciente-modal.component';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { Paciente } from '../../../../core/models/paciente.models';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';

type ListaState = 'loading' | 'empty' | 'loaded' | 'error';

@Component({
  selector: 'app-pacientes-lista',
  imports: [
    ReactiveFormsModule,
    UiButtonComponent,
    UiInputComponent,
    NovoPacienteModalComponent,
    RelacaoPacienteModalComponent
  ],
  templateUrl: './pacientes-lista.component.html',
  styleUrl: './pacientes-lista.component.css'
})
export class PacientesListaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly pacientesService = inject(PacientesService);

  readonly pageSize = 10;

  state: ListaState = 'loading';
  pacientes: Paciente[] = [];
  errorMessage = '';
  modalAberto = false;
  pageIndex = 0;

  pacienteSelecionado: Paciente | null = null;
  acaoRelacao: AcaoRelacao = 'vincular';
  modalRelacaoAberto = false;

  filtros = this.fb.group({
    nome: [''],
    email: [''],
    telefone: ['']
  });

  get pacientesFiltrados(): Paciente[] {
    const nomeFiltro = (this.filtros.value.nome || '').toLowerCase().trim();
    const emailFiltro = (this.filtros.value.email || '').toLowerCase().trim();
    const telefoneFiltro = (this.filtros.value.telefone || '').toLowerCase().trim();

    return this.pacientes.filter((paciente) => {
      const nomeMatch = paciente.nome.toLowerCase().includes(nomeFiltro);
      const emailMatch = paciente.email.toLowerCase().includes(emailFiltro);
      const telefoneMatch = (paciente.telefone || '').toLowerCase().includes(telefoneFiltro);
      return nomeMatch && emailMatch && telefoneMatch;
    });
  }

  get totalFiltrados(): number {
    return this.pacientesFiltrados.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltrados / this.pageSize));
  }

  get pacientesPagina(): Paciente[] {
    const inicio = this.pageIndex * this.pageSize;
    return this.pacientesFiltrados.slice(inicio, inicio + this.pageSize);
  }

  get intervaloPaginacao(): string {
    if (this.totalFiltrados === 0) {
      return '0 de 0';
    }
    const inicio = this.pageIndex * this.pageSize + 1;
    const fim = Math.min(inicio + this.pageSize - 1, this.totalFiltrados);
    return `${inicio}-${fim} de ${this.totalFiltrados}`;
  }

  ngOnInit(): void {
    this.filtros.valueChanges.subscribe(() => {
      this.pageIndex = 0;
    });
    this.carregarPacientes();
  }

  verPerfil(paciente: Paciente): void {
    void this.router.navigate(['/pacientes', paciente.id, 'anamnese']);
  }

  carregarPacientes(): void {
    this.state = 'loading';
    this.errorMessage = '';

    this.pacientesService
      .listarPacientes()
      .pipe(finalize(() => undefined))
      .subscribe({
        next: (lista: Paciente[]) => {
          this.pacientes = lista;
          this.pageIndex = 0;
          this.state = lista.length === 0 ? 'empty' : 'loaded';
        },
        error: (error: ApiErrorResponse) => {
          this.state = 'error';
          this.errorMessage = error.message ?? 'Não foi possível carregar os pacientes.';
        }
      });
  }

  abrirModal(): void {
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  abrirModalRelacao(paciente: Paciente, acao: AcaoRelacao): void {
    this.pacienteSelecionado = paciente;
    this.acaoRelacao = acao;
    this.modalRelacaoAberto = true;
  }

  fecharModalRelacao(): void {
    this.modalRelacaoAberto = false;
    this.pacienteSelecionado = null;
  }

  onPacienteVinculado(): void {
    this.modalAberto = false;
    this.carregarPacientes();
  }

  onRelacaoAlterada(): void {
    this.fecharModalRelacao();
    this.carregarPacientes();
  }

  paginaAnterior(): void {
    if (this.pageIndex > 0) {
      this.pageIndex -= 1;
    }
  }

  paginaProxima(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex += 1;
    }
  }
}
