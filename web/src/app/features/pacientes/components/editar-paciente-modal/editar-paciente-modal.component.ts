import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent } from '../../../../shared/components/ui-select/ui-select.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { PacienteDialogComponent } from '../paciente-dialog/paciente-dialog.component';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { Paciente } from '../../../../core/models/paciente.models';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-editar-paciente-modal',
  imports: [
    ReactiveFormsModule,
    UiInputComponent,
    UiSelectComponent,
    UiButtonComponent,
    FormAlertComponent,
    PacienteDialogComponent
  ],
  templateUrl: './editar-paciente-modal.component.html',
  styleUrl: './editar-paciente-modal.component.css'
})
export class EditarPacienteModalComponent implements OnInit {
  @Input({ required: true }) paciente!: Paciente;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<Paciente>();

  private readonly fb = inject(FormBuilder);
  private readonly pacientesService = inject(PacientesService);

  loading = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    telefone: [''],
    dataNascimento: [''],
    sexo: ['']
  });

  readonly sexoOptions = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Feminino' },
    { value: 'O', label: 'Outro' }
  ];

  ngOnInit(): void {
    let dataMask = '';
    if (this.paciente.dataNascimento) {
      const parts = this.paciente.dataNascimento.split('-');
      if (parts.length === 3) {
        dataMask = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    this.form.patchValue({
      nome: this.paciente.nome,
      telefone: this.paciente.telefone || '',
      dataNascimento: dataMask,
      sexo: this.paciente.sexo || ''
    });
  }

  fieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.hasError('required')) return 'Campo obrigatório';
      if (control.hasError('maxlength')) return 'O texto é muito longo';
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { nome, telefone, dataNascimento, sexo } = this.form.getRawValue();

    let dataFormatada = undefined;
    if (dataNascimento) {
      const parts = dataNascimento.split('/');
      if (parts.length === 3) {
        dataFormatada = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }
    }

    const telefoneSoNumeros = telefone ? telefone.replace(/\D/g, '') : undefined;

    this.pacientesService
      .atualizarPaciente(this.paciente.id, {
        nome,
        telefone: telefoneSoNumeros,
        dataNascimento: dataFormatada,
        sexo: sexo || undefined
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pacienteAtualizado: Paciente) => {
          this.salvo.emit(pacienteAtualizado);
        },
        error: (error: ApiErrorResponse) => {
          this.errorMessage = error.message ?? 'Não foi possível atualizar o paciente. Tente novamente.';
        }
      });
  }

  onCancelar(): void {
    this.fechar.emit();
  }
}
