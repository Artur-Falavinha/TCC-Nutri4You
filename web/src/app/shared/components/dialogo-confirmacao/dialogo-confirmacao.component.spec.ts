import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogoConfirmacaoComponent } from './dialogo-confirmacao.component';

describe('DialogoConfirmacaoComponent', () => {
  let fixture: ComponentFixture<DialogoConfirmacaoComponent>;
  let dialogo: HTMLDialogElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogoConfirmacaoComponent);
    fixture.componentRef.setInput('titulo', 'Excluir plano?');
    fixture.componentRef.setInput('descricao', 'O rascunho será excluído.');
    fixture.componentRef.setInput('confirmar', 'Excluir plano');
    fixture.componentRef.setInput('destrutivo', true);
    fixture.detectChanges();
    dialogo = (fixture.nativeElement as HTMLElement).querySelector('dialog')!;
  });

  it('abre modal com nome e descrição acessíveis e põe o foco em cancelar', () => {
    expect(dialogo.open).toBeTrue();
    expect(document.getElementById(dialogo.getAttribute('aria-labelledby')!)?.textContent).toBe('Excluir plano?');
    expect(document.getElementById(dialogo.getAttribute('aria-describedby')!)?.textContent).toBe('O rascunho será excluído.');
    expect(document.activeElement).toBe(dialogo.querySelector('button'));
    expect(dialogo.querySelector('.ui-button--danger')?.textContent?.trim()).toBe('Excluir plano');
  });

  it('bloqueia a confirmação e o fechamento enquanto a ação está em andamento', () => {
    const fechar = jasmine.createSpy('fechar');
    const confirmado = jasmine.createSpy('confirmado');
    fixture.componentInstance.fechar.subscribe(fechar);
    fixture.componentInstance.confirmado.subscribe(confirmado);

    fixture.componentRef.setInput('ocupado', true);
    fixture.detectChanges();

    const cancelar = new Event('cancel', { cancelable: true });
    dialogo.dispatchEvent(cancelar);
    fixture.componentInstance.confirmarAcao();

    expect(cancelar.defaultPrevented).toBeTrue();
    expect(fechar).not.toHaveBeenCalled();
    expect(confirmado).not.toHaveBeenCalled();
    expect(dialogo.querySelectorAll('button:disabled').length).toBe(2);

    fixture.componentRef.setInput('ocupado', false);
    fixture.detectChanges();

    dialogo.dispatchEvent(new Event('cancel', { cancelable: true }));
    dialogo.querySelector<HTMLButtonElement>('.ui-button--danger')!.click();

    expect(fechar).toHaveBeenCalledTimes(1);
    expect(confirmado).toHaveBeenCalledTimes(1);
  });
});
