import { Injectable, signal } from '@angular/core';

import { RegisterDraft } from '../../../core/models/auth.models';

const STORAGE_KEY = 'nutri4you.register-draft';

@Injectable({ providedIn: 'root' })
export class RegisterFlowService {
  private readonly draftSignal = signal<RegisterDraft | null>(this.readFromStorage());

  draft = this.draftSignal.asReadonly();

  saveDraft(draft: RegisterDraft): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    this.draftSignal.set(draft);
  }

  getDraft(): RegisterDraft | null {
    return this.draftSignal();
  }

  requireDraft(): RegisterDraft {
    const draft = this.getDraft();
    if (!draft) {
      throw new Error('Cadastro incompleto. Volte ao primeiro passo.');
    }
    return draft;
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.draftSignal.set(null);
  }

  private readFromStorage(): RegisterDraft | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as RegisterDraft;
    } catch {
      return null;
    }
  }
}
