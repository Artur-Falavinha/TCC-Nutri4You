import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { AuthService } from '../../core/services/auth.service';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { DataHoraClinicaPipe } from '../../shared/pipes/data-hora-clinica.pipe';
import { NotificacaoConsulta, NotificacaoVinculo, NotificacoesService } from './notificacoes.service';

@Component({
  selector: 'app-notificacoes',
  imports: [DataHoraClinicaPipe, FormAlertComponent, PageHeaderComponent, UiButtonComponent],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.css'
})
export class NotificacoesComponent implements OnInit {
  private readonly service = inject(NotificacoesService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  itens: NotificacaoConsulta[] = [];
  vinculos: NotificacaoVinculo[] = [];
  carregando = true;
  decidindo: number | null = null;
  erro = '';
  mensagem = '';

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
          this.service.marcarComoVistas(usuario.id, pendentes);
        },
        error: (erro: ApiErrorResponse) => { this.erro = erro.message || 'Não foi possível carregar as notificações.'; }
      });
  }

  decidirVinculo(item: NotificacaoVinculo, aceitar: boolean): void {
    if (this.decidindo !== null) return;
    this.decidindo = item.id;
    this.erro = '';
    this.mensagem = '';
    this.service.decidirVinculo(item, aceitar).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => { this.decidindo = null; })
    ).subscribe({
      next: () => {
        this.vinculos = this.vinculos.filter(atual => atual.id !== item.id);
        this.mensagem = aceitar ? 'Vínculo aceito.' : 'Solicitação de vínculo recusada.';
      },
      error: (erro: ApiErrorResponse) => { this.erro = erro.message || 'Não foi possível decidir o vínculo.'; }
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
