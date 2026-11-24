import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';
import { ApiErrorResponse } from '../models/api-response.model';

@Injectable()
export class FotoPerfilService {
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly endpoint = environment.apiBaseUrl + '/usuarios/me/foto';
  readonly url = signal<string | null>(null);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly falhaCarga = signal(false);
  readonly erro = signal('');

  constructor() {
    this.destroyRef.onDestroy(() => this.atualizarUrl(null));
  }

  carregar(): void {
    if (this.carregando() || this.salvando()) return;
    this.carregando.set(true);
    this.falhaCarga.set(false);
    this.http.get(this.endpoint, { responseType: 'blob' }).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))
    ).subscribe({
      next: imagem => this.atualizarUrl(imagem),
      error: () => this.falhaCarga.set(true)
    });
  }

  salvar(arquivo: File): void {
    if (this.salvando() || this.carregando()) return;
    if (!arquivo.size || arquivo.size > 5 * 1024 * 1024
      || (arquivo.type && !['image/jpeg', 'image/png'].includes(arquivo.type))) {
      this.erro.set('Selecione uma imagem JPEG ou PNG de até 5 MB.');
      return;
    }
    const formulario = new FormData();
    formulario.append('arquivo', arquivo);
    this.alterar(
      this.http.post(this.endpoint, formulario, { responseType: 'blob' }),
      'salvar',
      'Foto de perfil salva.',
      'Envie uma imagem JPEG ou PNG válida de até 5 MB.'
    );
  }

  remover(): void {
    if (this.salvando() || this.carregando() || !this.url()) return;
    this.alterar(this.http.delete<null>(this.endpoint), 'remover', 'Foto de perfil removida.', 'Tente novamente.');
  }

  private alterar(requisicao: Observable<Blob | null>, acao: string, mensagem: string, orientacao: string): void {
    this.salvando.set(true);
    this.erro.set('');
    requisicao.pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando.set(false))
    ).subscribe({
      next: imagem => {
        this.atualizarUrl(imagem);
        this.falhaCarga.set(false);
        this.toast.sucesso(mensagem);
      },
      error: (falha: ApiErrorResponse) => {
        const detalhe = falha.status === 400 || falha.status === 413 ? orientacao : 'Tente novamente.';
        this.toast.erro(`Não foi possível ${acao} a foto. ${detalhe}`);
      }
    });
  }

  private atualizarUrl(imagem: Blob | null): void {
    const anterior = this.url();
    this.url.set(imagem?.size ? URL.createObjectURL(imagem) : null);
    if (anterior) URL.revokeObjectURL(anterior);
  }
}
