import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToastNoAnimation } from 'ngx-toastr';

const variantes: Record<string, { icone: string; rotulo: string }> = {
  'toast-success': { icone: 'check-circle', rotulo: 'Sucesso' },
  'toast-error': { icone: 'warning-circle', rotulo: 'Erro' },
  'toast-warning': { icone: 'warning', rotulo: 'Atenção' },
  'toast-info': { icone: 'info', rotulo: 'Informação' }
};

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <i class="ph ph-{{ variante.icone }} toast-nutri__icone" aria-hidden="true"></i>
    <p class="toast-nutri__mensagem"><span class="toast-nutri__leitor">{{ variante.rotulo }}. </span>{{ message }}</p>
    <button type="button" class="toast-nutri__fechar" aria-label="Fechar notificação" (click)="remove()">
      <i class="ph ph-x" aria-hidden="true"></i>
    </button>
  `,
  host: {
    '(focusin)': 'stickAround()',
    '(focusout)': 'delayedHideToast()'
  }
})
export class ToastComponent extends ToastNoAnimation {
  protected get variante() {
    return variantes[this.toastPackage.toastType] ?? variantes['toast-info'];
  }
}
