import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { Agenda, ClinicoService, Contagem } from '../clinico/clinico.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly clinico = inject(ClinicoService);

  readonly raio = 68;
  readonly circunferencia = 2 * Math.PI * 68;
  readonly linhasGrade = [16, 64, 112, 160, 208];

  agenda: Agenda | null = null;
  carregando = true;
  erro = '';

  ngOnInit(): void {
    this.clinico.agenda().subscribe({
      next: agenda => {
        this.agenda = agenda;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar a agenda.';
        this.carregando = false;
      }
    });
  }

  totalPacientes(): number {
    return (this.agenda?.sexo ?? []).reduce((soma, item) => soma + item.quantidade, 0);
  }

  quantidade(rotulo: string): number {
    return this.agenda?.sexo.find(item => item.rotulo === rotulo)?.quantidade ?? 0;
  }

  percentual(rotulo: string): number {
    const total = this.totalPacientes();
    if (!total) {
      return 0;
    }
    return Math.round((this.quantidade(rotulo) * 100) / total);
  }

  arco(rotulo: string): string {
    const total = this.totalPacientes() || 1;
    const comprimento = (this.quantidade(rotulo) / total) * this.circunferencia;
    return `${comprimento} ${this.circunferencia - comprimento}`;
  }

  deslocamento(rotulo: string): number {
    const total = this.totalPacientes() || 1;
    const anteriores = rotulo === 'Feminino' ? this.quantidade('Masculino') : 0;
    return -((anteriores / total) * this.circunferencia);
  }

  alturaBarra(item: Contagem): number {
    const maximo = Math.max(...(this.agenda?.faixaEtaria ?? []).map(faixa => faixa.quantidade), 0);
    if (!maximo) {
      return 0;
    }
    return (item.quantidade / maximo) * 100;
  }

  pontosLinha(): string {
    return this.coordenadas().map(ponto => `${ponto.x},${ponto.y}`).join(' ');
  }

  pontosArea(): string {
    const pontos = this.coordenadas();
    if (!pontos.length) {
      return '';
    }
    const base = 208;
    const inicio = `${pontos[0].x},${base}`;
    const fim = `${pontos[pontos.length - 1].x},${base}`;
    return `${inicio} ${pontos.map(ponto => `${ponto.x},${ponto.y}`).join(' ')} ${fim}`;
  }

  temFaixa(): boolean {
    return (this.agenda?.faixaEtaria ?? []).some(faixa => faixa.quantidade > 0);
  }

  xDoMes(indice: number): number {
    return this.coordenadas()[indice]?.x ?? 0;
  }

  coordenadas(): { x: number; y: number; rotulo: string; quantidade: number; esquerda: number; topo: number; acima: boolean }[] {
    const serie = this.agenda?.ultimos12Meses ?? [];
    const maximo = Math.max(...serie.map(item => item.quantidade), 1);
    const margem = 40;
    const largura = 1024;
    const topo = 16;
    const base = 208;
    const larguraView = 1104;
    const alturaView = 236;
    return serie.map((item, indice) => {
      const x = serie.length === 1 ? margem + largura / 2 : margem + (indice / (serie.length - 1)) * largura;
      const y = base - (item.quantidade / maximo) * (base - topo);
      return {
        x,
        y,
        rotulo: item.rotulo,
        quantidade: item.quantidade,
        esquerda: (x / larguraView) * 100,
        topo: (y / alturaView) * 100,
        acima: y > 48
      };
    });
  }
}
