import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { PacientesService } from '../../../core/services/pacientes.service';
import { PatientTabsComponent } from '../../../shared/components/patient-tabs/patient-tabs.component';
import { Avaliacao, ClinicoService, Historico } from '../clinico.service';

type Campo = keyof Pick<Avaliacao,
  'peso' | 'imc' | 'percentualGordura' | 'massaMuscularKg' |
  'circunferenciaCintura' | 'circunferenciaQuadril' | 'circunferenciaBraco' |
  'pregaBicipital' | 'pregaTricipital' | 'pregaSubescapular' | 'pregaSuprailiaca'>;

interface Ponto {
  x: number;
  y: number;
  esquerda: number;
  topo: number;
  acima: boolean;
  inicio: boolean;
  fim: boolean;
  rotulo: string;
  valor: string;
  serie: string;
  cor: string;
}

interface Barra {
  x: number;
  y: number;
  altura: number;
  esquerda: number;
  topo: number;
  largura: number;
  alturaPct: number;
  acima: boolean;
  inicio: boolean;
  fim: boolean;
  rotulo: string;
  valor: string;
  serie: string;
}

@Component({
  selector: 'app-historico-paciente',
  imports: [PatientTabsComponent],
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.css'
})
export class HistoricoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clinico = inject(ClinicoService);
  private readonly pacientes = inject(PacientesService);
  private readonly largura = 640;
  private readonly alturaView = 196;
  private readonly margem = 28;
  private readonly topo = 20;
  private readonly base = 158;
  private readonly cores: Record<Campo, string> = {
    peso: '#006f1e',
    imc: '#3d6b99',
    percentualGordura: '#1e293b',
    massaMuscularKg: '#006f1e',
    circunferenciaCintura: '#006f1e',
    circunferenciaQuadril: '#7dcea0',
    circunferenciaBraco: '#94a3b8',
    pregaBicipital: '#006f1e',
    pregaTricipital: '#3d6b99',
    pregaSubescapular: '#1e293b',
    pregaSuprailiaca: '#94a3b8'
  };
  private readonly grupos: Record<Campo, Campo[]> = {
    peso: ['peso', 'imc'],
    imc: ['peso', 'imc'],
    percentualGordura: ['massaMuscularKg', 'percentualGordura'],
    massaMuscularKg: ['massaMuscularKg', 'percentualGordura'],
    circunferenciaCintura: ['circunferenciaCintura', 'circunferenciaQuadril', 'circunferenciaBraco'],
    circunferenciaQuadril: ['circunferenciaCintura', 'circunferenciaQuadril', 'circunferenciaBraco'],
    circunferenciaBraco: ['circunferenciaCintura', 'circunferenciaQuadril', 'circunferenciaBraco'],
    pregaBicipital: ['pregaBicipital', 'pregaTricipital', 'pregaSubescapular', 'pregaSuprailiaca'],
    pregaTricipital: ['pregaBicipital', 'pregaTricipital', 'pregaSubescapular', 'pregaSuprailiaca'],
    pregaSubescapular: ['pregaBicipital', 'pregaTricipital', 'pregaSubescapular', 'pregaSuprailiaca'],
    pregaSuprailiaca: ['pregaBicipital', 'pregaTricipital', 'pregaSubescapular', 'pregaSuprailiaca']
  };

  readonly grades = [48, 84, 120, 156];
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

  get temEvolucao(): boolean {
    return (this.historico?.avaliacoes.length ?? 0) > 0;
  }

  get semConsulta(): boolean {
    return (this.historico?.consultas.length ?? 0) === 0;
  }

  get pesoAtual(): string {
    return this.comUnidade(this.atual?.peso, 1, 'kg');
  }

  get imcAtual(): string {
    return this.numero(this.atual?.imc, 1);
  }

  get gorduraAtual(): string {
    const valor = this.atual?.percentualGordura;
    return valor === null || valor === undefined ? '—' : `${this.numero(valor, 0)}%`;
  }

  get massaAtual(): string {
    return this.comUnidade(this.atual?.massaMuscularKg, 1, 'kg');
  }

  get cinturaQuadril(): string {
    const cintura = this.atual?.circunferenciaCintura;
    const razao = this.atual?.razaoCinturaQuadril;
    if (cintura === null || cintura === undefined || razao === null || razao === undefined) {
      return '—';
    }
    return `${this.numero(cintura, 0)} / ${this.numero(razao, 2)}`;
  }

  eixo(): { x: number; texto: string }[] {
    return this.cronologica().map((item, index, serie) => ({
      x: this.x(index, serie.length),
      texto: this.dataCurta(item.dataAvaliacao)
    }));
  }

  traco(campo: Campo): string {
    return this.pontos(campo).map(ponto => `${ponto.x},${ponto.y}`).join(' ');
  }

  marcadores(campo: Campo): Ponto[] {
    return this.pontos(campo);
  }

  barras(campo: 'circunferenciaCintura' | 'circunferenciaQuadril' | 'circunferenciaBraco'): Barra[] {
    const serie = this.cronologica();
    const valores = serie
      .map(item => this.valor(item, campo))
      .filter((item): item is number => item !== null);
    if (!valores.length) {
      return [];
    }
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    const piso = minimo - Math.max((maximo - minimo) * 0.8, minimo * 0.08);
    const teto = maximo + Math.max((maximo - minimo) * 0.25, 1);
    const deslocamento = campo === 'circunferenciaCintura' ? -13 : campo === 'circunferenciaQuadril' ? -3 : 7;
    return serie.flatMap((item, index) => {
      const medida = this.valor(item, campo);
      if (medida === null) {
        return [];
      }
      const altura = ((medida - piso) / (teto - piso)) * (this.base - this.topo);
      const x = this.x(index, serie.length) + deslocamento;
      const y = this.base - altura;
      const texto = this.textoMedida(campo, medida);
      return [{
        x,
        y,
        altura,
        esquerda: (x / this.largura) * 100,
        topo: (y / this.alturaView) * 100,
        largura: (8 / this.largura) * 100,
        alturaPct: (altura / this.alturaView) * 100,
        acima: y > 48,
        inicio: index === 0,
        fim: index === serie.length - 1,
        rotulo: this.dataCurta(item.dataAvaliacao),
        valor: texto.valor,
        serie: texto.serie
      }];
    });
  }

  private get atual(): Avaliacao | null {
    return this.historico?.avaliacoes[0] ?? null;
  }

  private cronologica(): Avaliacao[] {
    return [...(this.historico?.avaliacoes ?? [])].reverse();
  }

  private pontos(campo: Campo): Ponto[] {
    const serie = this.cronologica();
    const valores = serie.flatMap(item => this.grupos[campo]
      .map(grupo => this.valor(item, grupo))
      .filter((item): item is number => item !== null));
    if (!valores.length) {
      return [];
    }
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    const folga = (maximo - minimo) * 0.35 || Math.max(maximo * 0.08, 1);
    const piso = minimo - folga;
    const teto = maximo + folga;
    return serie.flatMap((item, index) => {
      const medida = this.valor(item, campo);
      if (medida === null) {
        return [];
      }
      const x = this.x(index, serie.length);
      const y = this.base - ((medida - piso) / (teto - piso)) * (this.base - this.topo);
      const texto = this.textoMedida(campo, medida);
      return [{
        x,
        y,
        esquerda: (x / this.largura) * 100,
        topo: (y / this.alturaView) * 100,
        acima: y > 48,
        inicio: index === 0,
        fim: index === serie.length - 1,
        rotulo: this.dataCurta(item.dataAvaliacao),
        valor: texto.valor,
        serie: texto.serie,
        cor: this.cores[campo]
      }];
    });
  }

  private textoMedida(campo: Campo, medida: number): { valor: string; serie: string } {
    switch (campo) {
      case 'peso':
        return { valor: `${this.numero(medida, 1)} kg`, serie: 'Peso' };
      case 'imc':
        return { valor: this.numero(medida, 1), serie: 'IMC' };
      case 'percentualGordura':
        return { valor: `${this.numero(medida, 0)}%`, serie: 'Gordura' };
      case 'massaMuscularKg':
        return { valor: `${this.numero(medida, 1)} kg`, serie: 'Massa muscular' };
      case 'circunferenciaCintura':
        return { valor: `${this.numero(medida, 0)} cm`, serie: 'Cintura' };
      case 'circunferenciaQuadril':
        return { valor: `${this.numero(medida, 0)} cm`, serie: 'Quadril' };
      case 'circunferenciaBraco':
        return { valor: `${this.numero(medida, 1)} cm`, serie: 'Braço' };
      case 'pregaBicipital':
        return { valor: `${this.numero(medida, 1)} mm`, serie: 'Bicipital' };
      case 'pregaTricipital':
        return { valor: `${this.numero(medida, 1)} mm`, serie: 'Triciptal' };
      case 'pregaSubescapular':
        return { valor: `${this.numero(medida, 1)} mm`, serie: 'Subescapular' };
      case 'pregaSuprailiaca':
        return { valor: `${this.numero(medida, 1)} mm`, serie: 'Supra-ilíaca' };
    }
  }

  private x(index: number, total: number): number {
    if (total <= 1) {
      return this.largura / 2;
    }
    return this.margem + (index / (total - 1)) * (this.largura - this.margem * 2);
  }

  private valor(item: Avaliacao, campo: Campo): number | null {
    const medida = item[campo];
    return typeof medida === 'number' && !Number.isNaN(medida) ? medida : null;
  }

  private comUnidade(valor: number | null | undefined, casas: number, unidade: string): string {
    return valor === null || valor === undefined ? '—' : `${this.numero(valor, casas)} ${unidade}`;
  }

  private numero(valor: number | null | undefined, casas: number): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) {
      return '—';
    }
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas
    }).format(valor);
  }

  private dataCurta(iso: string): string {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) {
      return iso;
    }
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${String(data.getDate()).padStart(2, '0')}/${meses[data.getMonth()]}`;
  }
}
