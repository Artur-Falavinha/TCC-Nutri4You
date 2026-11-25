import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { AuthService } from '../../core/services/auth.service';
import { DialogoConfirmacaoComponent } from '../../shared/components/dialogo-confirmacao/dialogo-confirmacao.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { DataHoraClinicaPipe } from '../../shared/pipes/data-hora-clinica.pipe';
import { NotificacaoConsulta, NotificacaoResultadoExame, NotificacaoVinculo,
  NotificacoesService, TipoNotificacaoConsulta } from './notificacoes.service';

type Decisao =
  | { tipo: 'consulta'; item: NotificacaoConsulta; aceitar: boolean }
  | { tipo: 'vinculo'; item: NotificacaoVinculo; aceitar: boolean };

@Component({
  selector: 'app-notificacoes',
  imports: [DataHoraClinicaPipe, DatePipe, DialogoConfirmacaoComponent, PageHeaderComponent, RouterLink, UiButtonComponent],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.css'
})
export class NotificacoesComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly service = inject(NotificacoesService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly rotulosConsulta: Record<TipoNotificacaoConsulta, string> = {
    PRIMEIRA_CONSULTA: 'Primeira consulta',
    ACOMPANHAMENTO: 'Consulta de acompanhamento',
    REAGENDAMENTO: 'Reagendamento',
    CONSULTA: 'Solicitação de consulta'
  };
  itens: NotificacaoConsulta[] = [];
  vinculos: NotificacaoVinculo[] = [];
  resultados: NotificacaoResultadoExame[] = [];
  carregando = true;
  decidindo: number | null = null;
  decisao: Decisao | null = null;
  erroDecisao = '';
  erro = '';

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    this.erro = '';
    forkJoin({ usuario: this.auth.fetchMe(), pendentes: this.service.listarPendentes() })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { this.carregando = false; }))
      .subscribe({
        next: ({ usuario, pendentes }) => {
          this.itens = pendentes.consultas;
          this.vinculos = pendentes.vinculos;
          this.resultados = pendentes.resultados;
          this.service.marcarComoVistas(usuario.id, pendentes);
        },
        error: (erro: ApiErrorResponse) => { this.erro = erro.message || 'Não foi possível carregar as notificações.'; }
      });
  }

  pedirDecisao(decisao: Decisao): void {
    this.erroDecisao = '';
    this.decisao = decisao;
  }

  confirmarDecisao(): void {
    const decisao = this.decisao;
    if (!decisao) return;
    this.erroDecisao = '';
    if (decisao.tipo === 'consulta') this.decidir(decisao.item, decisao.aceitar);
    else this.decidirVinculo(decisao.item, decisao.aceitar);
  }

  private decidirVinculo(item: NotificacaoVinculo, aceitar: boolean): void {
    if (this.decidindo !== null) return;
    this.decidindo = item.id;
    this.service.decidirVinculo(item, aceitar).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => { this.decidindo = null; })
    ).subscribe({
      next: () => {
        this.decisao = null;
        this.vinculos = this.vinculos.filter(atual => atual.id !== item.id);
        this.toast.sucesso(aceitar ? 'Vínculo aceito.' : 'Solicitação de vínculo recusada.');
      },
      error: (erro: ApiErrorResponse) => { this.erroDecisao = erro.message || 'Não foi possível responder ao pedido de vínculo. Tente novamente.'; }
    });
  }

  private decidir(item: NotificacaoConsulta, aceitar: boolean): void {
    if (this.decidindo !== null) return;
    this.decidindo = item.id;
    this.service.decidir(item, aceitar).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => { this.decidindo = null; })
    ).subscribe({
      next: () => {
        this.decisao = null;
        this.itens = this.itens.filter(atual => atual.id !== item.id);
        this.toast.sucesso(aceitar ? 'Consulta confirmada.' : 'Consulta recusada.');
      },
      error: (erro: ApiErrorResponse) => { this.erroDecisao = erro.message || 'Não foi possível responder ao pedido de consulta. Tente novamente.'; }
    });
  }
}
