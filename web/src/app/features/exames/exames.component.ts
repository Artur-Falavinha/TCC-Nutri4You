import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, switchMap, throwError } from 'rxjs';
import { PacientesService } from '../../core/services/pacientes.service';
import { PatientTabsComponent } from '../../shared/components/patient-tabs/patient-tabs.component';
import { AtendimentosService } from '../clinico/consultas/consultas.service';
import { Exame, ExamesService, PaginaExames } from './exames.service';

@Component({
  selector: 'app-exames', imports: [FormsModule, DatePipe, PatientTabsComponent, RouterLink],
  templateUrl: './exames.component.html', styleUrl: './exames.component.css'
})
export class ExamesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ExamesService);
  private readonly atendimentos = inject(AtendimentosService);
  private readonly pacientes = inject(PacientesService);
  private readonly destroyRef = inject(DestroyRef);
  readonly patientId = Number(this.route.snapshot.paramMap.get('id'));
  readonly atendimentoId = this.route.snapshot.queryParamMap.has('atendimentoId') ? Number(this.route.snapshot.queryParamMap.get('atendimentoId')) : null;
  podeSolicitar = false;
  nomePaciente = ''; nome = ''; descricao = ''; parecer = ''; erro = ''; mensagem = '';
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
  solicitar(): void {
    if (this.salvando || (this.atendimentoId !== null && !this.podeSolicitar) || !this.nome.trim()) return;
    this.salvando = true; this.erro = ''; this.mensagem = '';
    this.service.solicitar(this.patientId, this.nome.trim(), this.descricao.trim(), this.atendimentoId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando = false)).subscribe({
        next: () => { this.nome = ''; this.descricao = ''; this.mensagem = 'Exame solicitado.'; this.carregar(0); },
        error: e => this.erro = e.message || 'Não foi possível solicitar o exame.'
      });
  }
  analisar(): void {
    if (this.salvando || !this.selecionado || !this.parecer.trim()) return;
    this.salvando = true; this.erro = ''; this.mensagem = '';
    this.service.analisar(this.patientId, this.selecionado, this.parecer.trim(), this.atendimentoId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando = false)).subscribe({
        next: () => { this.selecionado = null; this.parecer = ''; this.mensagem = 'Análise registrada.'; this.carregar(); },
        error: e => this.erro = e.message || 'Não foi possível analisar o exame. Recarregue antes de continuar.'
      });
  }
  baixar(exame: Exame): void {
    this.service.arquivo(this.patientId, exame.id, this.atendimentoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = exame.arquivoNome || `exame-${exame.id}`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, error: e => this.erro = e.message || 'Não foi possível baixar o arquivo.'
    });
  }
}
