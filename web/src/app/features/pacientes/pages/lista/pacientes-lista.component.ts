import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { NovoPacienteModalComponent } from '../../components/novo-paciente-modal/novo-paciente-modal.component';
import { InativarPacienteModalComponent } from '../../components/inativar-paciente-modal/inativar-paciente-modal.component';
import { ReativarPacienteModalComponent } from '../../components/reativar-paciente-modal/reativar-paciente-modal.component';
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
    InativarPacienteModalComponent,
    ReativarPacienteModalComponent
  ],
  templateUrl: './pacientes-lista.component.html',
  styleUrl: './pacientes-lista.component.css'
})
export class PacientesListaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pacientesService = inject(PacientesService);

  state: ListaState = 'loading';
  pacientes: Paciente[] = [];
  errorMessage = '';
  modalAberto = false;

  pacienteSelecionado: Paciente | null = null;
  modalInativarAberto = false;
  modalReativarAberto = false;

  filtros = this.fb.group({
    nome: [''],
    email: [''],
    telefone: ['']
  });

  get pacientesFiltrados(): Paciente[] {
    const nomeFiltro = (this.filtros.value.nome || '').toLowerCase().trim();
    const emailFiltro = (this.filtros.value.email || '').toLowerCase().trim();
    const telefoneFiltro = (this.filtros.value.telefone || '').toLowerCase().trim();

    return this.pacientes.filter((p) => {
      const nomeMatch = p.nome.toLowerCase().includes(nomeFiltro);
      const emailMatch = p.email.toLowerCase().includes(emailFiltro);
      const telefoneMatch = (p.telefone || '').toLowerCase().includes(telefoneFiltro);
      return nomeMatch && emailMatch && telefoneMatch;
    });
  }

  ngOnInit(): void {
    this.carregarPacientes();
  }

  verPerfil(paciente: Paciente): void {
    alert(`O prontuário/perfil do paciente ${paciente.nome} será implementado na próxima Sprint! (S2-P1)`);
  }

  carregarPacientes(): void {
    this.state = 'loading';
    this.errorMessage = '';

    this.pacientesService
      .listarPacientes()
      .pipe(finalize(() => { /* state já gerenciado nos callbacks */ }))
      .subscribe({
        next: (lista: Paciente[]) => {
          this.pacientes = lista;
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

  abrirModalInativar(paciente: Paciente): void {
    this.pacienteSelecionado = paciente;
    this.modalInativarAberto = true;
  }

  fecharModalInativar(): void {
    this.modalInativarAberto = false;
    this.pacienteSelecionado = null;
  }

  abrirModalReativar(paciente: Paciente): void {
    this.pacienteSelecionado = paciente;
    this.modalReativarAberto = true;
  }

  fecharModalReativar(): void {
    this.modalReativarAberto = false;
    this.pacienteSelecionado = null;
  }

  onPacienteCriado(paciente: Paciente): void {
    this.modalAberto = false;
    this.pacientes = [paciente, ...this.pacientes];
    this.state = 'loaded';
  }

  onPacienteAtualizado(pacienteAtualizado: Paciente): void {
    this.fecharModalInativar();
    this.fecharModalReativar();
    
    this.pacientes = this.pacientes.map((p) =>
      p.id === pacienteAtualizado.id ? pacienteAtualizado : p
    );
  }
}
