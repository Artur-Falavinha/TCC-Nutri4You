import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ApiErrorResponse } from '../../core/models/api-response.model';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { TokenStorageService } from '../../core/services/token-storage.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../shared/components/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { crnValidator, normalizeCrnForApi } from '../../shared/utils/crn-mask.util';
import { URL_TERMOS, VERSAO_TERMOS } from '../privacidade/privacidade.component';

interface PerfilNutricionista {
  nome: string;
  crn: string;
}

const PERFIL = '/nutricionistas/me/perfil';
const EMAIL = '/usuarios/me/email';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-perfil-conta',
  imports: [ReactiveFormsModule, UiButtonComponent, UiCheckboxComponent, UiInputComponent],
  templateUrl: './perfil-conta.component.html',
  styleUrl: './perfil-conta.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilContaComponent {
  private readonly api = inject(ApiService);
  private readonly tokens = inject(TokenStorageService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly emailAtual = input.required<string>();
  readonly contaAtualizada = output<{ nome?: string; email?: string; reaceitouTermos?: boolean }>();
  protected readonly perfil = signal<PerfilNutricionista | null>(null);
  protected readonly editandoCrn = signal(false);
  protected readonly salvandoPerfil = signal(false);
  protected readonly erroPerfil = signal('');
  protected readonly alterandoEmail = signal(false);
  protected readonly destinoEmail = signal('');
  protected readonly salvandoEmail = signal(false);
  protected readonly erroEmail = signal('');
  protected readonly urlTermos = `${URL_TERMOS}/${VERSAO_TERMOS}`;

  protected readonly perfilForm = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    crn: ['', [crnValidator()]],
    termos: [false]
  });
  protected readonly emailForm = this.fb.group({
    novoEmail: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    senhaAtual: ['', [Validators.required]],
    codigo: ['']
  });

  constructor() {
    this.carregarPerfil();
  }

  protected carregarPerfil(): void {
    this.erroPerfil.set('');
    this.api.get<PerfilNutricionista>(PERFIL).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: perfil => this.aplicarPerfil(perfil),
      error: () => this.erroPerfil.set('Não foi possível carregar os dados profissionais.')
    });
  }

  protected editarCrn(editar: boolean): void {
    this.editandoCrn.set(editar);
    this.perfilForm.controls.crn.reset(this.perfil()?.crn ?? '');
    this.perfilForm.controls.termos.reset(false);
    this.erroPerfil.set('');
  }

  protected get crnFoiAlterado(): boolean {
    return this.editandoCrn() &&
      normalizeCrnForApi(this.perfilForm.controls.crn.value) !== this.perfil()?.crn;
  }

  protected salvarPerfil(): void {
    if (this.salvandoPerfil()) return;
    this.erroPerfil.set('');
    this.perfilForm.markAllAsTouched();
    const { nome, crn, termos } = this.perfilForm.getRawValue();
    const alterarCrn = this.crnFoiAlterado;
    if (!nome.trim() || this.perfilForm.controls.nome.invalid ||
        (alterarCrn && (!crn.trim() || this.perfilForm.controls.crn.invalid || !termos))) return;

    this.salvandoPerfil.set(true);
    const dados = alterarCrn
      ? { nome: nome.trim(), crn: normalizeCrnForApi(crn), versaoTermos: VERSAO_TERMOS, crnDeclarado: termos }
      : { nome: nome.trim() };
    this.api.put<PerfilNutricionista>(PERFIL, dados).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.salvandoPerfil.set(false))
    ).subscribe({
      next: perfil => {
        this.aplicarPerfil(perfil);
        this.contaAtualizada.emit({ nome: perfil.nome, reaceitouTermos: alterarCrn });
        this.toast.sucesso('Dados da conta atualizados.');
      },
      error: (erro: ApiErrorResponse) => this.erroPerfil.set(erro.message || 'Não foi possível salvar os dados.')
    });
  }

  protected abrirAlteracaoEmail(): void {
    this.alterandoEmail.set(true);
  }

  protected reiniciarEmail(): void {
    this.destinoEmail.set('');
    this.erroEmail.set('');
    this.emailForm.controls.codigo.reset();
    this.emailForm.controls.senhaAtual.reset();
  }

  protected fecharAlteracaoEmail(): void {
    this.reiniciarEmail();
    this.emailForm.reset();
    this.alterandoEmail.set(false);
  }

  protected enviarCodigo(): void {
    if (this.salvandoEmail()) return;
    this.erroEmail.set('');
    const { novoEmail, senhaAtual } = this.emailForm.controls;
    novoEmail.setValue(novoEmail.value.trim());
    novoEmail.markAsTouched();
    senhaAtual.markAsTouched();
    if (novoEmail.invalid || senhaAtual.invalid) return;
    if (novoEmail.value.toLowerCase() === this.emailAtual().toLowerCase()) {
      this.erroEmail.set('Informe um e-mail diferente do atual.');
      return;
    }
    this.salvandoEmail.set(true);
    this.api.post<{ email: string }>(EMAIL + '/iniciar', {
      novoEmail: novoEmail.value,
      senhaAtual: senhaAtual.value
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.salvandoEmail.set(false);
      senhaAtual.reset();
    })).subscribe({
      next: pedido => this.destinoEmail.set(pedido.email),
      error: (erro: ApiErrorResponse) => this.erroEmail.set(erro.message || 'Não foi possível enviar o código.')
    });
  }

  protected confirmarEmail(): void {
    if (this.salvandoEmail()) return;
    const codigo = this.emailForm.controls.codigo.value.trim();
    if (!UUID.test(codigo)) {
      this.erroEmail.set('Cole o código completo recebido no novo e-mail.');
      return;
    }
    this.erroEmail.set('');
    this.salvandoEmail.set(true);
    this.api.post<{ email: string; token: string }>(EMAIL + '/confirmar', { codigo }).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.salvandoEmail.set(false))
    ).subscribe({
      next: resultado => {
        this.tokens.setToken(resultado.token);
        this.contaAtualizada.emit({ email: resultado.email });
        this.fecharAlteracaoEmail();
        this.toast.sucesso('E-mail atualizado com sucesso.');
      },
      error: (erro: ApiErrorResponse) => this.erroEmail.set(erro.message || 'Não foi possível confirmar a alteração.')
    });
  }

  private aplicarPerfil(perfil: PerfilNutricionista): void {
    this.perfil.set(perfil);
    this.editandoCrn.set(false);
    this.perfilForm.reset({ nome: perfil.nome, crn: perfil.crn });
  }
}
