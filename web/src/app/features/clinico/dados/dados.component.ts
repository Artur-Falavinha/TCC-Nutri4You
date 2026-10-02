import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Paciente } from '../../../core/models/paciente.models';
import { PacientesService } from '../../../core/services/pacientes.service';
import { PatientTabsComponent } from '../../../shared/components/patient-tabs/patient-tabs.component';
import { AnamneseService } from '../../anamnese/anamnese.service';
import { Answers } from '../../anamnese/anamnese.models';

@Component({
  selector: 'app-dados-paciente',
  imports: [PatientTabsComponent, DatePipe],
  templateUrl: './dados.component.html',
  styleUrl: './dados.component.css'
})
export class DadosComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pacientes = inject(PacientesService);
  private readonly anamnese = inject(AnamneseService);

  paciente: Paciente | null = null;
  respostas: Answers = {};
  erro = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      paciente: this.pacientes.buscarPorId(id),
      anamnese: this.anamnese.get(id)
    }).subscribe({
      next: ({ paciente, anamnese }) => {
        this.paciente = paciente;
        this.respostas = anamnese.respostas ?? {};
      },
      error: () => {
        this.erro = 'Não foi possível carregar os dados do paciente.';
      }
    });
  }

  get objetivo(): string {
    return this.juntar(this.respostas['objectives'], this.respostas['objectiveOther']);
  }

  get restricoes(): string {
    return this.juntar(this.respostas['allergyDetails'], this.respostas['dietOther']);
  }

  get clinico(): string {
    return this.juntar(this.respostas['diagnoses'], this.respostas['medicationDetails']);
  }

  get estilo(): string {
    return this.juntar(this.respostas['activities'], this.respostas['sleepHours'], this.respostas['profession']);
  }

  texto(valor: string): string {
    return valor || 'Não informado.';
  }

  private juntar(...valores: unknown[]): string {
    return valores
      .flatMap(valor => Array.isArray(valor) ? valor : [valor])
      .filter(valor => valor !== null && valor !== undefined && valor !== '')
      .join(' · ');
  }
}
