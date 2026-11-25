import { AfterViewInit, Component, ElementRef, OnDestroy, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-paciente-dialog',
  imports: [],
  templateUrl: './paciente-dialog.component.html',
  styleUrl: './paciente-dialog.component.css'
})
export class PacienteDialogComponent implements AfterViewInit, OnDestroy {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly ocupado = input(false);
  readonly fechar = output<void>();

  private readonly painel = viewChild.required<ElementRef<HTMLDialogElement>>('painel');
  private elemento?: HTMLDialogElement;

  ngAfterViewInit(): void {
    this.elemento = this.painel().nativeElement;
    this.elemento.showModal();
  }

  ngOnDestroy(): void {
    this.elemento?.close();
  }

  cancelar(evento?: Event): void {
    evento?.preventDefault();
    if (this.ocupado()) return;
    this.elemento?.close();
    this.fechar.emit();
  }
}
