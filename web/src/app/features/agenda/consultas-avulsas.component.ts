import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, interval } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AtendimentoClinico, AtendimentosService } from '../clinico/consultas/consultas.service';
import { ApiService } from '../../core/services/api.service';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';

interface PreferenciaAgenda {
  aceitaConsultasAvulsas: boolean;
}

interface SolicitacaoAvulsa {
  id: number;
  pacienteNome: string;
  dataHora: string;
  versao: number;
}

const PREFERENCIAS = '/agenda-nutricionista/preferencias';
const SOLICITACOES = '/agenda-nutricionista/solicitacoes-avulsas';

@Component({
  selector: 'app-consultas-avulsas',
  imports: [DatePipe, FormAlertComponent, RouterLink],
  templateUrl: './consultas-avulsas.component.html',
  styleUrl: './consultas-avulsas.component.css'
})
export class ConsultasAvulsasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly atendimentosService = inject(AtendimentosService);
  private readonly destroyRef = inject(DestroyRef);

  aceitaConsultasAvulsas: boolean | null = null;
  carregandoPreferencia = false;
  salvandoPreferencia = false;
  erroPreferencia = '';
  solicitacoes: SolicitacaoAvulsa[] = [];
  carregandoSolicitacoes = false;
  decidindo = false;
  erroSolicitacoes = '';
  mensagemSolicitacoes = '';

  atendimentos: AtendimentoClinico[] = [];
  carregandoAtendimentos = false;
  erroAtendimentos = '';
  mensagemAtendimentos = '';
  atendimentoParaCancelar: number | null = null;
  cancelando = false;
  iniciando = false;
  agora = Date.now();

  ngOnInit(): void {
    this.carregarAtendimentos();
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.agora = Date.now(); });
    this.carregarPreferencia();
    this.carregarSolicitacoes();
  }

  carregarAtendimentos(): void {
    this.carregandoAtendimentos = true;
    this.erroAtendimentos = '';
    this.atendimentosService.listar().pipe(takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.carregandoAtendimentos = false; })).subscribe({
      next: itens => { this.atendimentos = itens; },
      error: (erro: ApiErrorResponse) => { this.erroAtendimentos = erro.message; }
    });
  }

  podeIniciar(item: AtendimentoClinico): boolean {
    return item.status === 'CONFIRMADA' && !item.iniciadaEm && !!item.janelaInicio && !!item.janelaFim
      && this.agora >= Date.parse(item.janelaInicio) && this.agora <= Date.parse(item.janelaFim);
  }

  iniciar(item: AtendimentoClinico): void {
    if (this.iniciando || this.cancelando || !this.podeIniciar(item)) return;
    this.iniciando = true;
    this.erroAtendimentos = '';
    this.mensagemAtendimentos = '';
    this.atendimentosService.iniciar(item).pipe(takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.iniciando = false; })).subscribe({
      next: () => this.carregarAtendimentos(),
      error: (erro: ApiErrorResponse) => { this.erroAtendimentos = erro.message; }
    });
  }

  podeCancelar(item: AtendimentoClinico): boolean {
    const agoraClinica = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).format(new Date(this.agora)).replace(' ', 'T');
    return item.status === 'CONFIRMADA' && !item.iniciadaEm && item.dataHora.slice(0, 19) > agoraClinica;
  }

  cancelarAtendimento(item: AtendimentoClinico): void {
    if (this.cancelando || this.iniciando || this.atendimentoParaCancelar !== item.id || !this.podeCancelar(item)) return;
    this.cancelando = true;
    this.erroAtendimentos = '';
    this.mensagemAtendimentos = '';
    this.atendimentosService.cancelar(item).pipe(takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.cancelando = false; })).subscribe({
      next: () => {
        this.atendimentoParaCancelar = null;
        this.mensagemAtendimentos = 'Atendimento cancelado.';
        this.carregarAtendimentos();
      },
      error: (erro: ApiErrorResponse) => { this.erroAtendimentos = erro.message || 'Não foi possível cancelar o atendimento.'; }
    });
  }

  carregarPreferencia(): void {
    this.erroPreferencia = '';
    this.carregandoPreferencia = true;
    this.api.get<PreferenciaAgenda>(PREFERENCIAS).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.carregandoPreferencia = false; })
    ).subscribe({
      next: ({ aceitaConsultasAvulsas }) => { this.aceitaConsultasAvulsas = aceitaConsultasAvulsas; },
      error: (erro: ApiErrorResponse) => { this.erroPreferencia = erro.message; }
    });
  }

  alternarPreferencia(): void {
    if (this.aceitaConsultasAvulsas === null || this.salvandoPreferencia) return;
    this.erroPreferencia = '';
    this.salvandoPreferencia = true;
    this.api.put<PreferenciaAgenda>(PREFERENCIAS, { aceitaConsultasAvulsas: !this.aceitaConsultasAvulsas }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.salvandoPreferencia = false; })
    ).subscribe({
      next: ({ aceitaConsultasAvulsas }) => { this.aceitaConsultasAvulsas = aceitaConsultasAvulsas; },
      error: (erro: ApiErrorResponse) => { this.erroPreferencia = erro.message; }
    });
  }

  carregarSolicitacoes(): void {
    this.erroSolicitacoes = '';
    this.mensagemSolicitacoes = '';
    this.carregandoSolicitacoes = true;
    this.api.get<SolicitacaoAvulsa[]>(SOLICITACOES).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.carregandoSolicitacoes = false; })
    ).subscribe({
      next: (solicitacoes) => { this.solicitacoes = solicitacoes; },
      error: (erro: ApiErrorResponse) => { this.erroSolicitacoes = erro.message; }
    });
  }

  decidir(solicitacao: SolicitacaoAvulsa, aceitar: boolean): void {
    if (this.decidindo || this.carregandoSolicitacoes) return;
    this.erroSolicitacoes = '';
    this.mensagemSolicitacoes = '';
    this.decidindo = true;
    this.api.post<void>(SOLICITACOES + '/' + solicitacao.id + '/decisao', { aceitar, versao: solicitacao.versao }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.decidindo = false; })
    ).subscribe({
      next: () => {
        this.solicitacoes = this.solicitacoes.filter(item => item.id !== solicitacao.id);
        this.mensagemSolicitacoes = aceitar ? 'Consulta confirmada.' : 'Consulta recusada.';
        if (aceitar) this.carregarAtendimentos();
      },
      error: (erro: ApiErrorResponse) => { this.erroSolicitacoes = erro.message; }
    });
  }
}
