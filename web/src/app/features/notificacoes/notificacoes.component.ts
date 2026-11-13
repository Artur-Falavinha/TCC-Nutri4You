import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { NotificacaoConsulta, NotificacoesService } from './notificacoes.service';

@Component({
  selector: 'app-notificacoes',
  imports: [DatePipe, FormAlertComponent],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.css'
})
export class NotificacoesComponent implements OnInit {
  private readonly service = inject(NotificacoesService);
  private readonly destroyRef = inject(DestroyRef);
  itens: NotificacaoConsulta[] = [];
  carregando = true;
  decidindo: number | null = null;
  erro = '';
  mensagem = '';

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    this.erro = '';
    this.service.listar().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { this.carregando = false; }))
      .subscribe({
        next: itens => { this.itens = itens; },
        error: (erro: ApiErrorResponse) => { this.erro = erro.message || 'Não foi possível carregar as notificações.'; }
      });
  }

  decidir(item: NotificacaoConsulta, aceitar: boolean): void {
    if (this.decidindo !== null) return;
    this.decidindo = item.id;
    this.erro = '';
    this.mensagem = '';
    this.service.decidir(item, aceitar).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => { this.decidindo = null; })
    ).subscribe({
      next: () => {
        this.itens = this.itens.filter(atual => atual.id !== item.id);
        this.mensagem = aceitar ? 'Consulta confirmada.' : 'Consulta recusada.';
      },
      error: (erro: ApiErrorResponse) => { this.erro = erro.message || 'Não foi possível decidir a solicitação.'; }
    });
  }
}
