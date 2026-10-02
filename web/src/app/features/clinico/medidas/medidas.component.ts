import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ApiErrorResponse } from '../../../core/models/api-response.model';
import { PacientesService } from '../../../core/services/pacientes.service';
import { PatientTabsComponent } from '../../../shared/components/patient-tabs/patient-tabs.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ClinicoService } from '../clinico.service';

@Component({
  selector: 'app-medidas-paciente',
  imports: [FormsModule, PatientTabsComponent, UiButtonComponent],
  templateUrl: './medidas.component.html',
  styleUrl: '../dados/dados.component.css'
})
export class MedidasComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pacientes = inject(PacientesService);
  private readonly clinico = inject(ClinicoService);

  patientId = 0;
  nome = '';
  peso: number | null = null;
  altura: number | null = null;
  cintura: number | null = null;
  quadril: number | null = null;
  braco: number | null = null;
  tricipital: number | null = null;
  salvando = false;
  mensagem = '';
  erro = '';
  errors: Record<string, string> = {};

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.pacientes.buscarPorId(this.patientId).subscribe({
      next: paciente => {
        this.nome = paciente.nome;
      },
      error: () => {
        this.erro = 'Não foi possível carregar o paciente.';
      }
    });
  }

  salvar(event: Event): void {
    event.preventDefault();
    if (this.salvando) return;
    this.mensagem = '';
    this.erro = '';
    this.errors = this.validar();
    if (Object.keys(this.errors).length) {
      this.focarPrimeiroErro();
      return;
    }
    this.salvando = true;
    const body: Record<string, number> = { peso: this.peso!, altura: this.altura! };
    if (this.cintura != null) body['circunferenciaCintura'] = this.cintura;
    if (this.quadril != null) body['circunferenciaQuadril'] = this.quadril;
    if (this.braco != null) body['circunferenciaBraco'] = this.braco;
    if (this.tricipital != null) body['pregaTricipital'] = this.tricipital;
    this.clinico.registrar(this.patientId, body).subscribe({
      next: avaliacao => {
        const rcq = avaliacao.razaoCinturaQuadril == null
          ? ''
          : ` RCQ ${avaliacao.razaoCinturaQuadril}.`;
        this.mensagem = `Medida registrada. IMC ${avaliacao.imc}.${rcq}`;
        this.salvando = false;
      },
      error: (error: ApiErrorResponse) => {
        this.erro = error.message || 'Não foi possível registrar a medida.';
        this.salvando = false;
      }
    });
  }

  private validar(): Record<string, string> {
    const errors: Record<string, string> = {};
    this.validarCampo(errors, 'peso', this.peso, 1, 500, 'Informe um peso entre 1 e 500 kg.');
    this.validarCampo(errors, 'altura', this.altura, 0.3, 2.7, 'Informe uma altura entre 0,30 e 2,70 m.');
    this.validarCampo(errors, 'cintura', this.cintura, 0.1, 300, 'Informe uma cintura entre 0,1 e 300 cm.');
    this.validarCampo(errors, 'quadril', this.quadril, 0.1, 300, 'Informe um quadril entre 0,1 e 300 cm.');
    this.validarCampo(errors, 'braco', this.braco, 0.1, 150, 'Informe um braço entre 0,1 e 150 cm.');
    this.validarCampo(errors, 'tricipital', this.tricipital, 0.1, 100, 'Informe uma prega entre 0,1 e 100 mm.');
    return errors;
  }

  private validarCampo(
    errors: Record<string, string>, campo: string, valor: number | null,
    minimo: number, maximo: number, mensagem: string
  ): void {
    if (valor == null) {
      if (campo === 'peso' || campo === 'altura') errors[campo] = 'Este campo é obrigatório.';
      return;
    }
    if (!Number.isFinite(valor) || valor < minimo || valor > maximo) errors[campo] = mensagem;
  }

  private focarPrimeiroErro(): void {
    const campo = Object.keys(this.errors)[0];
    setTimeout(() => document.querySelector<HTMLInputElement>(`[name="${campo}"]`)?.focus());
  }
}
