import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanDeactivateFn } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { PacienteDialogComponent } from '../pacientes/components/paciente-dialog/paciente-dialog.component';
import { Observable, Subject, take } from 'rxjs';

interface Horario { diaSemana: number; horario: string }

@Component({
  selector: 'app-agenda',
  imports: [
    FormsModule, FormAlertComponent, PageHeaderComponent,
    UiSelectComponent, UiButtonComponent, PacienteDialogComponent
  ],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css'
})
export class AgendaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly dias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  readonly opcoesDias = this.dias.map((label, indice) => ({ label, value: String(indice + 1) }));
  horarios: Horario[] = [];
  dia = '1';
  hora = '08:00';
  carregando = true;
  carregado = false;
  salvando = false;
  erro = '';
  mensagem = '';
  private original = '[]';
  modalSaida = false;
  private respostaSaida: Subject<boolean> | null = null;

  ngOnInit() { this.carregar(); }
  carregar() {
    this.carregando = true;
    this.erro = '';
    this.api.get<Horario[]>('/agenda-nutricionista/horarios').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: h => { this.receber(h); this.carregando = false; this.carregado = true; },
      error: (e: ApiErrorResponse) => { this.erro = e.message; this.carregando = false; }
    });
  }
  private receber(h: Horario[]) {
    this.horarios = h.map(item => ({ ...item, horario: item.horario.slice(0, 5) }));
    this.original = JSON.stringify(this.horarios);
  }
  adicionar() {
    this.erro = ''; this.mensagem = '';
    if (!/^\d{2}:\d{2}$/.test(this.hora) || this.hora > '23:15') {
      this.erro = 'Escolha um horário até 23:15.'; return;
    }
    if (this.horarios.some(h => h.diaSemana === +this.dia && h.horario === this.hora)) {
      this.erro = 'Este horário já foi adicionado.'; return;
    }
    this.horarios = [...this.horarios, { diaSemana: +this.dia, horario: this.hora }]
      .sort((a, b) => a.diaSemana - b.diaSemana || a.horario.localeCompare(b.horario));
  }
  remover(h: Horario) { this.horarios = this.horarios.filter(item => item !== h); this.mensagem = ''; }
  doDia(dia: number) { return this.horarios.filter(h => h.diaSemana === dia); }
  salvar() {
    if (this.salvando || !this.carregado) return;
    this.salvando = true; this.erro = ''; this.mensagem = '';
    this.api.put<Horario[]>('/agenda-nutricionista/horarios', this.horarios)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: h => { this.receber(h); this.salvando = false; this.mensagem = 'Disponibilidade semanal salva.'; },
        error: (e: ApiErrorResponse) => { this.erro = e.message; this.salvando = false; }
      });
  }
  get alterado() { return JSON.stringify(this.horarios) !== this.original; }
  podeSair(): boolean | Observable<boolean> {
    if (this.salvando) return false;
    if (!this.alterado) return true;
    this.respostaSaida ??= new Subject<boolean>();
    this.modalSaida = true;
    return this.respostaSaida.asObservable().pipe(take(1));
  }
  responderSaida(confirmar: boolean) {
    this.modalSaida = false;
    this.respostaSaida?.next(confirmar);
    this.respostaSaida?.complete();
    this.respostaSaida = null;
  }
  @HostListener('window:beforeunload', ['$event'])
  antesDeFechar(event: BeforeUnloadEvent) { if (this.alterado || this.salvando) event.preventDefault(); }
}
export const agendaPendenteGuard: CanDeactivateFn<AgendaComponent> = c => c.podeSair();
