import { Component, EventEmitter, Output, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs';

import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent, UiSelectOption } from '../../../../shared/components/ui-select/ui-select.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert.component';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { Paciente } from '../../../../core/models/paciente.models';
import { ApiErrorResponse } from '../../../../core/models/api-response.model';
import { cpfValidator, extractCpfDigits } from '../../../../shared/utils/cpf-mask.util';
import { resolveFieldError } from '../../../../shared/utils/form-field-error.util';

@Component({
  selector: 'app-novo-paciente-modal',
  imports: [
    ReactiveFormsModule,
    UiInputComponent,
    UiSelectComponent,
    UiButtonComponent,
    FormAlertComponent
  ],
  templateUrl: './novo-paciente-modal.component.html',
  styleUrl: './novo-paciente-modal.component.css'
})
export class NovoPacienteModalComponent {
  @Output() fechar = new EventEmitter<void>();
  @Output() pacienteCriado = new EventEmitter<Paciente>();

  private readonly fb = inject(FormBuilder);
  private readonly pacientesService = inject(PacientesService);

  loading = false;
  submitted = false;
  errorMessage = '';

  readonly sexoOptions: UiSelectOption[] = [
    { label: 'Masculino', value: 'MASCULINO' },
    { label: 'Feminino', value: 'FEMININO' },
    { label: 'Outro', value: 'OUTRO' },
    { label: 'Prefiro não informar', value: 'NAO_INFORMADO' }
  ];

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: [''],
    cpf: ['', [cpfValidator()]],
    dataNascimento: [''],
    sexo: ['']
  });

  get controls() {
    return this.form.controls;
  }

  fieldError(field: keyof typeof this.form.controls): string {
    return resolveFieldError(this.controls[field], this.submitted, {
      email: 'Informe um e-mail válido.',
      cpf: 'CPF incompleto. Use o formato 000.000.000-00.',
      minlength: 'Nome deve ter no mínimo 3 caracteres.'
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { nome, email, telefone, cpf, dataNascimento, sexo } =
      this.form.getRawValue();

    let dataFormatada = undefined;
    if (dataNascimento) {
      const parts = dataNascimento.split('/');
      if (parts.length === 3) {
        dataFormatada = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }
    }

    const telefoneSoNumeros = telefone ? telefone.replace(/\D/g, '') : undefined;
    const cpfDigits = cpf ? extractCpfDigits(cpf) : undefined;

    this.pacientesService
      .criarPaciente({
        nome,
        email,
        telefone: telefoneSoNumeros,
        cpf: cpfDigits,
        dataNascimento: dataFormatada,
        sexo: sexo || undefined
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (paciente: Paciente) => {
          this.pacienteCriado.emit(paciente);
        },
        error: (error: ApiErrorResponse) => {
          this.errorMessage =
            error.message ?? 'Não foi possível criar o paciente. Tente novamente.';
        }
      });
  }

  onCancelar(): void {
    this.fechar.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal__backdrop')) {
      this.fechar.emit();
    }
  }
}

