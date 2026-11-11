import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
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
  imports: [DatePipe, FormAlertComponent],
  templateUrl: './consultas-avulsas.component.html',
  styleUrl: './consultas-avulsas.component.css'
})
export class ConsultasAvulsasComponent implements OnInit {
  private readonly api = inject(ApiService);
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

  ngOnInit(): void {
    this.carregarPreferencia();
    this.carregarSolicitacoes();
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
      },
      error: (erro: ApiErrorResponse) => { this.erroSolicitacoes = erro.message; }
    });
  }
}
