import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, input, output, viewChild
} from '@angular/core';
import { UiButtonComponent } from '../ui-button/ui-button.component';

let proximoId = 0;

@Component({
  selector: 'app-dialogo-confirmacao',
  imports: [UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialogo-confirmacao.component.html',
  styleUrl: './dialogo-confirmacao.component.css'
})
export class DialogoConfirmacaoComponent implements AfterViewInit, OnDestroy {
  readonly titulo = input.required<string>();
  readonly descricao = input.required<string>();
  readonly confirmar = input.required<string>();
  readonly voltar = input('Cancelar');
  readonly icone = input('info');
  readonly destrutivo = input(false);
  readonly ocupado = input(false);
  readonly rotuloOcupado = input('Aguarde…');
  readonly erro = input('');

  readonly fechar = output<void>();
  readonly confirmado = output<void>();

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private elemento?: HTMLDialogElement;
  private focoAnterior: HTMLElement | null = null;
  private readonly id = ++proximoId;
  readonly tituloId = `confirmacao-titulo-${this.id}`;
  readonly descricaoId = `confirmacao-descricao-${this.id}`;

  ngAfterViewInit(): void {
    this.elemento = this.dialogo().nativeElement;
    const ativo = this.elemento.ownerDocument.activeElement;
    this.focoAnterior = ativo instanceof HTMLElement ? ativo : null;
    this.elemento.showModal();
  }

  ngOnDestroy(): void {
    this.elemento?.close();
  }

  cancelar(evento?: Event): void {
    evento?.preventDefault();
    if (this.ocupado()) return;
    this.elemento?.close();
    if (this.focoAnterior?.isConnected) this.focoAnterior.focus({ preventScroll: true });
    this.fechar.emit();
  }

  confirmarAcao(): void {
    if (!this.ocupado()) this.confirmado.emit();
  }
}
