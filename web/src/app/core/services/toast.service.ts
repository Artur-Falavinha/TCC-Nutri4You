import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastr = inject(ToastrService);

  sucesso(mensagem: string): void {
    this.toastr.success(mensagem);
  }

  erro(mensagem: string): void {
    this.toastr.error(mensagem, undefined, { timeOut: 8000 });
  }

  aviso(mensagem: string): void {
    this.toastr.warning(mensagem, undefined, { timeOut: 7000 });
  }

  informacao(mensagem: string): void {
    this.toastr.info(mensagem);
  }
}
