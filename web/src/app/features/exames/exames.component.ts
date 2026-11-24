import { DatePipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, Injector, OnInit, afterNextRender, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, switchMap, throwError } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { PacientesService } from '../../core/services/pacientes.service';
import { EstadoVazioComponent } from '../../shared/components/estado-vazio/estado-vazio.component';
import { PatientTabsComponent } from '../../shared/components/patient-tabs/patient-tabs.component';
import { TituloPacienteComponent } from '../../shared/components/avatar-paciente/titulo-paciente.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { AtendimentosService } from '../clinico/consultas/consultas.service';
import { Exame, ExamesService, PaginaExames } from './exames.service';

@Component({
  selector: 'app-exames', imports: [FormsModule, DatePipe, EstadoVazioComponent, PatientTabsComponent, TituloPacienteComponent, RouterLink, UiButtonComponent],
  templateUrl: './exames.component.html', styleUrl: './exames.component.css'
})
export class ExamesComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ExamesService);
  private readonly atendimentos = inject(AtendimentosService);
  private readonly pacientes = inject(PacientesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly campoNome = viewChild<ElementRef<HTMLInputElement>>('campoNome');
  private readonly estadoVazio = viewChild('estadoVazio', { read: ElementRef<HTMLElement> });
  readonly patientId = Number(this.route.snapshot.paramMap.get('id'));
  readonly atendimentoId = this.route.snapshot.queryParamMap.has('atendimentoId') ? Number(this.route.snapshot.queryParamMap.get('atendimentoId')) : null;
  podeSolicitar = false;
  formularioAberto = false;
  nomePaciente = ''; nome = ''; descricao = ''; parecer = ''; erro = '';
  pagina = 0; dados: PaginaExames | null = null; selecionado: Exame | null = null;
  carregando = false; salvando = false;
  ngOnInit(): void { this.carregar(); }
  carregar(pagina = this.pagina): void {
    this.carregando = true; this.erro = '';
    const dadosPaciente = this.atendimentoId === null ? this.pacientes.buscarPorId(this.patientId)
      : this.atendimentos.buscar(this.atendimentoId).pipe(switchMap(a => {
        if (a.pacienteId !== this.patientId || !a.iniciadaEm) return throwError(() => new Error('Atendimento indisponível.'));
        this.podeSolicitar = a.status === 'CONFIRMADA';
        return [ { nome: a.pacienteNome } ];
      }));
    forkJoin({ paciente: dadosPaciente, exames: this.service.listar(this.patientId, pagina, this.atendimentoId) })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando = false)).subscribe({
        next: r => { this.nomePaciente = r.paciente.nome; this.dados = r.exames; this.pagina = pagina; this.selecionado = null; },
        error: e => this.erro = e.message || 'Não foi possível carregar os exames.'
      });
  }

  abrirFormulario(): void {
    this.formularioAberto = true;
    afterNextRender(() => this.campoNome()?.nativeElement.focus(), { injector: this.injector });
  }

  fecharFormulario(): void {
    this.formularioAberto = false;
    this.erro = '';
    afterNextRender(() => this.estadoVazio()?.nativeElement.focus(), { injector: this.injector });
  }

  solicitar(): void {
    if (this.salvando || (this.atendimentoId !== null && !this.podeSolicitar) || !this.nome.trim()) return;
    this.salvando = true; this.erro = '';
    this.service.solicitar(this.patientId, this.nome.trim(), this.descricao.trim(), this.atendimentoId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando = false)).subscribe({
        next: () => {
          this.nome = '';
          this.descricao = '';
          this.formularioAberto = false;
          this.toast.sucesso('Exame solicitado.');
          this.carregar(0);
        },
        error: e => this.toast.erro(e.message || 'Não foi possível solicitar o exame.')
      });
  }
  analisar(): void {
    if (this.salvando || !this.selecionado || !this.parecer.trim()) return;
    this.salvando = true; this.erro = '';
    this.service.analisar(this.patientId, this.selecionado, this.parecer.trim(), this.atendimentoId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando = false)).subscribe({
        next: () => { this.selecionado = null; this.parecer = ''; this.toast.sucesso('Análise registrada.'); this.carregar(); },
        error: e => this.erro = e.message || 'Não foi possível analisar o exame. Recarregue antes de continuar.'
      });
  }
  baixar(exame: Exame): void {
    this.service.arquivo(this.patientId, exame.id, this.atendimentoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = exame.arquivoNome || `exame-${exame.id}`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, error: e => this.toast.erro(e.message || 'Não foi possível baixar o arquivo.')
    });
  }
}
