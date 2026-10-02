import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { PacientesService } from '../../../core/services/pacientes.service';
import { PatientTabsComponent } from '../../../shared/components/patient-tabs/patient-tabs.component';
import { ClinicoService, Historico } from '../clinico.service';

@Component({
  selector: 'app-historico-paciente',
  imports: [PatientTabsComponent, DatePipe],
  templateUrl: './historico.component.html',
  styleUrl: '../dados/dados.component.css'
})
export class HistoricoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clinico = inject(ClinicoService);
  private readonly pacientes = inject(PacientesService);

  patientId = 0;
  nome = '';
  historico: Historico | null = null;
  erro = '';

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      paciente: this.pacientes.buscarPorId(this.patientId),
      historico: this.clinico.historico(this.patientId)
    }).subscribe({
      next: ({ paciente, historico }) => {
        this.nome = paciente.nome;
        this.historico = historico;
      },
      error: () => {
        this.erro = 'Não foi possível carregar o histórico.';
      }
    });
  }

  pontos(campo: 'peso' | 'imc'): string {
    return this.coordenadas(campo).map(ponto => `${ponto.x},${ponto.y}`).join(' ');
  }

  coordenadas(campo: 'peso' | 'imc'): { x: number; y: number; rotulo: string }[] {
    const series = [...(this.historico?.avaliacoes ?? [])].reverse();
    if (!series.length) {
      return [];
    }
    const values = series.map(item => Number(item[campo]));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return series.map((item, index) => ({
      x: series.length === 1 ? 24 : (index / (series.length - 1)) * 620 + 10,
      y: series.length === 1
        ? (campo === 'peso' ? 60 : 110)
        : 150 - ((Number(item[campo]) - min) / span) * 130,
      rotulo: campo === 'peso' ? `${item.peso} kg` : `IMC ${item.imc}`
    }));
  }
}
