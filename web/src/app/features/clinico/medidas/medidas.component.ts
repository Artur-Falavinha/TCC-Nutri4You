import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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
    if (this.peso == null || this.altura == null) {
      return;
    }
    this.salvando = true;
    this.erro = '';
    const body: Record<string, number> = { peso: this.peso, altura: this.altura };
    if (this.cintura != null) body['circunferenciaCintura'] = this.cintura;
    if (this.quadril != null) body['circunferenciaQuadril'] = this.quadril;
    if (this.braco != null) body['circunferenciaBraco'] = this.braco;
    if (this.tricipital != null) body['pregaTricipital'] = this.tricipital;
    this.clinico.registrar(this.patientId, body).subscribe({
      next: avaliacao => {
        this.mensagem = `Medida registrada. IMC ${avaliacao.imc}.`;
        this.salvando = false;
      },
      error: () => {
        this.erro = 'Não foi possível registrar a medida.';
        this.salvando = false;
      }
    });
  }
}
