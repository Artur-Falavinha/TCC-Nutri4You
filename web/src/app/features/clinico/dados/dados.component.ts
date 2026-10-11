import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { Paciente } from '../../../core/models/paciente.models';
import { AuthService } from '../../../core/services/auth.service';
import { PacientesService } from '../../../core/services/pacientes.service';
import { PatientTabsComponent } from '../../../shared/components/patient-tabs/patient-tabs.component';
import { AnamneseService } from '../../anamnese/anamnese.service';
import { Answers } from '../../anamnese/anamnese.models';
import { Consulta, ConsultasService, PaginaConsultas } from '../consultas/consultas.service';

interface UltimaConsulta {
  data: string;
  profissional: string;
}

@Component({
  selector: 'app-dados-paciente',
  imports: [PatientTabsComponent],
  templateUrl: './dados.component.html',
  styleUrl: './dados.component.css'
})
export class DadosComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pacientes = inject(PacientesService);
  private readonly anamnese = inject(AnamneseService);
  private readonly consultas = inject(ConsultasService);
  private readonly auth = inject(AuthService);

  paciente: Paciente | null = null;
  respostas: Answers = {};
  ultimaConsulta: UltimaConsulta | null = null;
  consultaIndisponivel = false;
  erro = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      paciente: this.pacientes.buscarPorId(id),
      anamnese: this.anamnese.get(id),
      consulta: this.ultimaRealizada(id).pipe(
        map(consulta => ({ consulta, falhou: false })),
        catchError(() => of({ consulta: null as Consulta | null, falhou: true }))
      ),
      nutricionista: this.auth.fetchMe().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ paciente, anamnese, consulta, nutricionista }) => {
        this.paciente = paciente;
        this.respostas = anamnese.respostas ?? {};
        this.consultaIndisponivel = consulta.falhou;
        if (consulta.consulta) {
          this.ultimaConsulta = {
            data: this.dataPorExtenso(consulta.consulta.dataHora),
            profissional: nutricionista?.nome ?? ''
          };
        }
      },
      error: () => {
        this.erro = 'Não foi possível carregar os dados do paciente.';
      }
    });
  }

  get telefone(): string {
    const bruto = this.paciente?.telefone?.trim() ?? '';
    const digitos = bruto.replace(/\D/g, '');
    if (digitos.length === 11) {
      return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    }
    if (digitos.length === 10) {
      return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    }
    return bruto || 'não informado';
  }

  get nascimento(): string {
    const iso = this.paciente?.dataNascimento;
    if (!iso) {
      return 'não informado';
    }
    const [ano, mes, dia] = iso.slice(0, 10).split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : 'não informado';
  }

  get metaPrincipal(): string {
    return this.unir([
      this.lista(this.itens(this.respostas['objectives']).filter(item => item !== 'Outro')),
      this.livre('objectiveOther')
    ]);
  }

  get restricoes(): string {
    const partes: string[] = [];
    const alergia = this.livre('allergyDetails');
    if (alergia) {
      partes.push(alergia);
    } else if (this.respostas['allergy'] === 'Não') {
      partes.push('nenhuma');
    }
    const dieta = this.livre('diet');
    if (dieta && dieta !== 'Não sigo dieta específica') {
      partes.push(dieta === 'Outra' ? this.livre('dietOther') : dieta);
    }
    return this.unir(partes, '; ');
  }

  get doencas(): string {
    const selecionados = this.itens(this.respostas['diagnoses']);
    if (selecionados.length === 1 && selecionados[0] === 'Nenhum diagnóstico') {
      return 'nenhuma';
    }
    return this.unir([
      this.lista(selecionados.filter(item => item !== 'Outro' && item !== 'Nenhum diagnóstico')),
      this.livre('diagnosisOther')
    ], '; ');
  }

  get medicamentos(): string {
    if (this.respostas['medication'] === 'Não') {
      return 'nenhum';
    }
    return this.livre('medicationDetails');
  }

  get exercicios(): string {
    if (this.respostas['physicalActivity'] === 'Não') {
      return 'não pratica regularmente';
    }
    const atividades = this.unir([
      this.lista(this.itens(this.respostas['activities']).filter(item => item !== 'Outro')),
      this.livre('activityOther')
    ]);
    const frequencia = this.livre('weeklyFrequency');
    if (atividades && frequencia) {
      return `${atividades}, ${frequencia}`;
    }
    return atividades || frequencia;
  }

  get linhaSonoTrabalho(): string {
    return `Sono: ${this.valor(this.livre('sleepHours'))} Trabalho: ${this.valor(this.livre('profession'))}`;
  }

  valor(texto: string): string {
    const limpo = texto.trim();
    if (!limpo) {
      return 'Não informado.';
    }
    return /[.!?]$/.test(limpo) ? limpo : `${limpo}.`;
  }

  private ultimaRealizada(pacienteId: number): Observable<Consulta | null> {
    return this.consultas.listar(pacienteId, 0).pipe(
      switchMap(pagina => this.procurarRealizada(pacienteId, pagina, 0))
    );
  }

  private procurarRealizada(
    pacienteId: number,
    pagina: PaginaConsultas,
    indice: number
  ): Observable<Consulta | null> {
    const encontrada = pagina.itens.find(item => item.status === 'REALIZADA');
    if (encontrada || indice >= 2 || pagina.pagina + 1 >= pagina.totalPaginas) {
      return of(encontrada ?? null);
    }
    return this.consultas.listar(pacienteId, pagina.pagina + 1).pipe(
      switchMap(seguinte => this.procurarRealizada(pacienteId, seguinte, indice + 1))
    );
  }

  private dataPorExtenso(iso: string): string {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) {
      return iso;
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(data);
  }

  private itens(valor: unknown): string[] {
    if (!Array.isArray(valor)) {
      return [];
    }
    return valor.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  }

  private lista(itens: string[]): string {
    if (itens.length <= 1) {
      return itens[0] ?? '';
    }
    return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
  }

  private livre(chave: string): string {
    const valor = this.respostas[chave];
    return typeof valor === 'string' ? valor.trim() : '';
  }

  private unir(partes: string[], separador = ' '): string {
    return partes.map(parte => parte.trim()).filter(Boolean).join(separador);
  }
}
