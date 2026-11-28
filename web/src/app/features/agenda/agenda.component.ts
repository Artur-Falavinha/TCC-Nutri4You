import { Component, DestroyRef, ElementRef, HostListener, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CanDeactivateFn } from '@angular/router';
import { Observable, Subject, take } from 'rxjs';

import { ToastService } from '../../core/services/toast.service';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { ApiService } from '../../core/services/api.service';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { DialogoConfirmacaoComponent } from '../../shared/components/dialogo-confirmacao/dialogo-confirmacao.component';
import { CalendarioAgendaComponent } from './calendario-agenda.component';

interface Horario { diaSemana: number; horario: string }

const CAMINHO_HORARIOS = '/agenda-nutricionista/horarios';
const LIMITE_SEMANAL = 224;
const ULTIMO_INICIO = '23:15';
const DURACAO_CONSULTA = 45;

const DIAS = [
  { numero: 1, nome: 'Segunda-feira', curto: 'Seg' },
  { numero: 2, nome: 'Terça-feira', curto: 'Ter' },
  { numero: 3, nome: 'Quarta-feira', curto: 'Qua' },
  { numero: 4, nome: 'Quinta-feira', curto: 'Qui' },
  { numero: 5, nome: 'Sexta-feira', curto: 'Sex' },
  { numero: 6, nome: 'Sábado', curto: 'Sáb' },
  { numero: 7, nome: 'Domingo', curto: 'Dom' }
];

function ordenar(horarios: Horario[]): Horario[] {
  return [...horarios].sort((a, b) => a.diaSemana - b.diaSemana || a.horario.localeCompare(b.horario));
}

function horarioSeguinte(horario: string): string {
  const [hora, minuto] = horario.split(':').map(Number);
  const minutos = hora * 60 + minuto + DURACAO_CONSULTA;
  const fim = String(Math.floor(minutos / 60)).padStart(2, '0') + ':' + String(minutos % 60).padStart(2, '0');
  return fim <= ULTIMO_INICIO ? fim : '';
}

@Component({
  selector: 'app-agenda',
  imports: [FormsModule, FormAlertComponent, PageHeaderComponent, UiButtonComponent, DialogoConfirmacaoComponent,
    CalendarioAgendaComponent],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css'
})
export class AgendaComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly horarios = signal<Horario[]>([]);
  private readonly horariosSalvos = signal<Horario[]>([]);
  private readonly numeroDia = signal(1);
  private readonly botaoCopia = viewChild<ElementRef<HTMLButtonElement>>('botaoCopia');
  private respostaSaida: Subject<boolean> | null = null;

  readonly semana = computed(() => DIAS.map(dia => ({
    ...dia,
    horarios: this.horarios().filter(item => item.diaSemana === dia.numero)
  })));
  readonly diaSelecionado = computed(() => this.semana()[this.numeroDia() - 1]);
  readonly diasAbertos = computed(() => this.semana().filter(dia => dia.horarios.length > 0).length);
  readonly totalHorarios = computed(() => this.horarios().length);
  readonly alterado = computed(() => JSON.stringify(this.horarios()) !== JSON.stringify(this.horariosSalvos()));
  protected readonly verCalendario = signal(true);

  hora = '08:00';
  carregando = true;
  carregado = false;
  salvando = false;
  erro = '';
  erroHorario = '';
  modalSaida = false;
  copiando = false;
  destinos = new Set<number>();

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    this.erro = '';
    this.api.get<Horario[]>(CAMINHO_HORARIOS).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: horarios => {
        this.receber(horarios);
        this.ajustarSugestao();
        this.carregando = false;
        this.carregado = true;
      },
      error: (erro: ApiErrorResponse) => {
        this.erro = erro.message || 'Não foi possível carregar a disponibilidade.';
        this.carregando = false;
      }
    });
  }

  selecionarDia(numero: number): void {
    if (numero === this.numeroDia()) return;
    this.numeroDia.set(numero);
    this.erroHorario = '';
    this.fecharCopia();
    this.ajustarSugestao();
  }

  adicionar(): void {
    this.erroHorario = '';
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(this.hora) || this.hora > ULTIMO_INICIO) {
      this.erroHorario = 'Informe um horário válido até 23:15.';
      return;
    }
    if (this.diaSelecionado().horarios.some(item => item.horario === this.hora)) {
      this.erroHorario = 'Esse horário já está cadastrado neste dia.';
      return;
    }
    if (this.totalHorarios() >= LIMITE_SEMANAL) {
      this.erroHorario = 'A semana já atingiu o limite de 224 horários.';
      return;
    }
    this.atualizarRascunho([...this.horarios(), { diaSemana: this.numeroDia(), horario: this.hora }]);
    this.hora = horarioSeguinte(this.hora);
  }

  remover(horario: Horario): void {
    this.atualizarRascunho(this.horarios().filter(item => item !== horario));
    this.erroHorario = '';
    if (!this.diaSelecionado().horarios.length) this.fecharCopia();
  }

  alternarCopia(): void {
    if (this.copiando) {
      this.fecharCopia();
    } else {
      this.copiando = true;
    }
  }

  selecionarDestino(numero: number, selecionado: boolean): void {
    if (selecionado) this.destinos.add(numero);
    else this.destinos.delete(numero);
  }

  copiarHorarios(): void {
    const origem = this.diaSelecionado().horarios;
    const novos = this.semana().filter(dia => this.destinos.has(dia.numero)).flatMap(dia => {
      const existentes = new Set(dia.horarios.map(item => item.horario));
      return origem.filter(item => !existentes.has(item.horario))
        .map(item => ({ diaSemana: dia.numero, horario: item.horario }));
    });
    if (!novos.length) {
      this.toast.informacao('Os dias selecionados já têm esses horários.');
      return;
    }
    if (this.totalHorarios() + novos.length > LIMITE_SEMANAL) {
      this.toast.aviso('A cópia ultrapassa o limite de 224 horários. Selecione menos dias.');
      return;
    }
    const dias = new Set(novos.map(item => item.diaSemana)).size;
    this.atualizarRascunho([...this.horarios(), ...novos]);
    this.fecharCopia();
    this.toast.sucesso(dias === 1 ? 'Horários copiados para 1 dia.' : 'Horários copiados para ' + dias + ' dias.');
    this.botaoCopia()?.nativeElement.focus();
  }

  salvar(): void {
    if (this.salvando || !this.carregado || !this.alterado()) return;
    this.salvando = true;
    this.erro = '';
    this.api.put<Horario[]>(CAMINHO_HORARIOS, this.horarios()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: horarios => {
        this.receber(horarios);
        this.salvando = false;
        this.toast.sucesso('Disponibilidade semanal salva.');
      },
      error: (erro: ApiErrorResponse) => {
        this.toast.erro(erro.message || 'Não foi possível salvar. Tente novamente.');
        this.salvando = false;
      }
    });
  }

  podeSair(): boolean | Observable<boolean> {
    if (this.salvando) return false;
    if (!this.alterado()) return true;
    this.respostaSaida ??= new Subject<boolean>();
    this.modalSaida = true;
    return this.respostaSaida.asObservable().pipe(take(1));
  }

  responderSaida(confirmar: boolean): void {
    this.modalSaida = false;
    const resposta = this.respostaSaida;
    this.respostaSaida = null;
    resposta?.next(confirmar);
    resposta?.complete();
  }

  @HostListener('window:beforeunload', ['$event'])
  antesDeFechar(evento: BeforeUnloadEvent): void {
    if (this.alterado() || this.salvando) evento.preventDefault();
  }

  private receber(horarios: Horario[]): void {
    const normalizados = ordenar(horarios.map(item => ({ diaSemana: item.diaSemana, horario: item.horario.slice(0, 5) })));
    this.horarios.set(normalizados);
    this.horariosSalvos.set(normalizados);
  }

  private ajustarSugestao(): void {
    const ultimo = this.diaSelecionado().horarios.at(-1);
    this.hora = ultimo ? horarioSeguinte(ultimo.horario) : '08:00';
  }

  private atualizarRascunho(horarios: Horario[]): void {
    this.horarios.set(ordenar(horarios));
    this.erro = '';
  }

  private fecharCopia(): void {
    this.copiando = false;
    this.destinos.clear();
  }
}

export const agendaPendenteGuard: CanDeactivateFn<AgendaComponent> = componente => componente.podeSair();
