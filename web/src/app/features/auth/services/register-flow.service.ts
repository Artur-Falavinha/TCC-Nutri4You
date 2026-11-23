import { Injectable, signal } from '@angular/core';

import { ComprovanteCadastro, RegisterDraft } from '../../../core/models/auth.models';

const CHAVE_RASCUNHO = 'nutri4you.register-draft';
const CHAVE_EMAIL = 'nutri4you.cadastro-email';

@Injectable({ providedIn: 'root' })
export class RegisterFlowService {
  private readonly draftSignal = signal(this.lerArmazenamento<RegisterDraft>(CHAVE_RASCUNHO));
  private confirmacao = this.lerArmazenamento<ComprovanteCadastro>(CHAVE_EMAIL);

  draft = this.draftSignal.asReadonly();

  guardarEmailConfirmado(confirmacao: ComprovanteCadastro): void {
    if (this.confirmacao?.token !== confirmacao.token) {
      sessionStorage.removeItem(CHAVE_RASCUNHO);
      this.draftSignal.set(null);
    }
    sessionStorage.setItem(CHAVE_EMAIL, JSON.stringify(confirmacao));
    this.confirmacao = confirmacao;
  }

  getEmailConfirmado(): ComprovanteCadastro | null {
    const confirmacao = this.confirmacao;
    return confirmacao && Date.parse(confirmacao.expiraEm) > Date.now() ? confirmacao : null;
  }

  saveDraft(draft: RegisterDraft): void {
    sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(draft));
    this.draftSignal.set(draft);
  }

  getDraft(): RegisterDraft | null {
    return this.draftSignal();
  }

  requireDraft(): RegisterDraft {
    const draft = this.getDraft();
    if (!draft) {
      throw new Error('Preencha os dados do cadastro antes de criar a senha.');
    }
    return draft;
  }

  clear(): void {
    sessionStorage.removeItem(CHAVE_RASCUNHO);
    sessionStorage.removeItem(CHAVE_EMAIL);
    this.draftSignal.set(null);
    this.confirmacao = null;
  }

  private lerArmazenamento<T>(chave: string): T | null {
    try {
      const conteudo = sessionStorage.getItem(chave);
      return conteudo ? JSON.parse(conteudo) as T : null;
    } catch {
      return null;
    }
  }
}
