import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { formatarDataBr, horarioCivilIso } from '../../shared/utils/data-br.util';

interface ConsultaAgenda {
  id: number;
  dataHora: string;
  status: string;
  pacienteNome: string | null;
  emAtendimento: boolean;
}

interface DiaAgenda {
  data: string;
  temDisponibilidade: boolean;
  horariosLivres: string[];
  consultas: ConsultaAgenda[];
}

interface SemanaAgenda {
  inicio: string;
  hoje: string;
  duracaoMinutos: number;
  dias: DiaAgenda[];
}

const ESTADOS = {
  AGUARDANDO_CONFIRMACAO: { rotulo: 'Pendente', estilo: 'pendente' },
  CONFIRMADA: { rotulo: 'Confirmada', estilo: 'confirmada' },
  REALIZADA: { rotulo: 'Realizada', estilo: 'realizada' },
  CANCELADA: { rotulo: 'Cancelada', estilo: 'encerrada' },
  RECUSADA: { rotulo: 'Recusada', estilo: 'encerrada' }
};

const LIVRE = { rotulo: 'Disponível', estilo: 'livre' };
const EM_ATENDIMENTO = { rotulo: 'Em atendimento', estilo: 'confirmada' };
const OCUPADO = { rotulo: 'Ocupado', estilo: 'confirmada' };
const FORMATO_SEMANA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' });
const FORMATO_DIA = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' });

function dataCivil(iso: string): Date {
  return new Date(iso + 'T00:00:00Z');
}

function inicioDeslocado(iso: string, dias: number): string {
  const data = dataCivil(iso);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function fimDoHorario(horario: string, duracao: number): string {
  const [hora, minuto] = horario.split(':').map(Number);
  const total = (hora * 60 + minuto + duracao) % (24 * 60);
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return h + ':' + m;
}

function estadoDaConsulta(consulta: ConsultaAgenda) {
  if (consulta.emAtendimento) return EM_ATENDIMENTO;
  return ESTADOS[consulta.status as keyof typeof ESTADOS] ?? OCUPADO;
}

@Component({
  selector: 'app-calendario-agenda',
  imports: [UiButtonComponent],
  templateUrl: './calendario-agenda.component.html',
  styleUrl: './calendario-agenda.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarioAgendaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pedidos = new Subject<string | null>();
  private readonly inicioSolicitado = signal<string | null>(null);
  private readonly semana = signal<SemanaAgenda | null>(null);

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly diaSelecionado = signal('');
  protected readonly rotuloSemana = computed(() => {
    const inicio = this.inicioSolicitado() ?? this.semana()?.inicio;
    return inicio ? FORMATO_SEMANA.formatRange(dataCivil(inicio), dataCivil(inicioDeslocado(inicio, 6))) : '';
  });
  protected readonly duracao = computed(() => this.semana()?.duracaoMinutos);
  protected readonly dias = computed(() => {
    const semana = this.semana();
    return semana?.dias.map(dia => this.prepararDia(dia, semana)) ?? [];
  });

  ngOnInit(): void {
    this.pedidos.pipe(
      switchMap(inicio => this.api.get<SemanaAgenda>('/agenda-nutricionista/calendario',
        inicio ? { params: { inicio } } : undefined).pipe(
        catchError(() => {
          this.erro.set(true);
          this.carregando.set(false);
          return EMPTY;
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(semana => {
      this.semana.set(semana);
      if (!semana.dias.some(dia => dia.data === this.diaSelecionado())) {
        const hoje = semana.dias.find(dia => dia.data === semana.hoje);
        this.diaSelecionado.set(hoje?.data ?? semana.inicio);
      }
      this.carregando.set(false);
    });
    this.carregar();
  }

  protected carregar(inicio = this.inicioSolicitado()): void {
    this.inicioSolicitado.set(inicio);
    this.carregando.set(true);
    this.erro.set(false);
    this.pedidos.next(inicio);
  }

  protected mudarSemana(direcao: -1 | 1): void {
    const inicio = this.inicioSolicitado() ?? this.semana()?.inicio;
    if (inicio) this.carregar(inicioDeslocado(inicio, 7 * direcao));
  }

  protected irParaHoje(): void {
    this.diaSelecionado.set('');
    this.carregar(null);
  }

  private prepararDia(dia: DiaAgenda, semana: SemanaAgenda) {
    const livres = dia.horariosLivres.map(horario => ({
      chave: 'livre-' + horario,
      horario: horario.slice(0, 5),
      estado: LIVRE,
      paciente: null
    }));
    const consultas = dia.consultas.map(consulta => ({
      chave: 'consulta-' + consulta.id,
      horario: horarioCivilIso(consulta.dataHora),
      estado: estadoDaConsulta(consulta),
      paciente: consulta.pacienteNome
    }));
    const itens = [...consultas, ...livres].sort((a, b) => a.horario.localeCompare(b.horario));
    return {
      data: dia.data,
      dataCompleta: formatarDataBr(dia.data),
      numero: dia.data.slice(-2),
      diaSemana: FORMATO_DIA.format(dataCivil(dia.data)).replace('.', ''),
      hoje: dia.data === semana.hoje,
      vazio: dia.data < semana.hoje ? 'Sem consultas' : dia.temDisponibilidade ? 'Sem horários livres' : 'Sem disponibilidade',
      itens: itens.map(item => ({ ...item, fim: fimDoHorario(item.horario, semana.duracaoMinutos) }))
    };
  }
}
