import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { formatCpfDisplay } from '../../utils/cpf-mask.util';
import { formatCrnDisplay } from '../../utils/crn-mask.util';
import { aplicarMascaraDataBr, converterDataBrParaIso, formatarDataBr } from '../../utils/data-br.util';

@Component({
  selector: 'app-ui-input',
  imports: [],
  templateUrl: './ui-input.component.html',
  styleUrl: './ui-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true
    }
  ]
})
export class UiInputComponent implements ControlValueAccessor {
  @Input({ required: true }) label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'date' | 'tel' = 'text';
  @Input() inputId = '';
  @Input() autocomplete = '';
  @Input() errorMessage = '';
  @Input() required = false;
  @Input() readonly = false;
  @Input() inputmode: 'text' | 'decimal' | 'numeric' = 'text';
  @Input() maxlength: number | null = null;
  @Input() min: string | null = null;
  @Input() max: string | null = null;
  @Input() mask?: 'crn' | 'cpf' | 'telefone' | 'data';
  /** Classe Phosphor (ex.: ph-magnifying-glass). Vazio = sem ícone. */
  @Input() leadingIcon = '';

  value = '';
  disabled = false;
  passwordVisible = false;
  readonly seletorNativoDisponivel = typeof HTMLInputElement !== 'undefined'
    && typeof HTMLInputElement.prototype.showPicker === 'function';

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  get id(): string {
    return this.inputId || this.label.toLowerCase().replace(/\s+/g, '-');
  }

  get isPasswordField(): boolean {
    return this.type === 'password';
  }

  get campoData(): boolean {
    return this.type === 'date';
  }

  get dataIso(): string {
    return converterDataBrParaIso(this.value) ?? '';
  }

  get showLeadingIcon(): boolean {
    return this.leadingIcon.length > 0 && this.value.length === 0;
  }

  get resolvedInputType(): UiInputComponent['type'] {
    if (this.campoData || (this.isPasswordField && this.passwordVisible)) {
      return 'text';
    }

    return this.type;
  }

  writeValue(value: string | null): void {
    this.value = this.campoData
      ? (formatarDataBr(value) || value || '')
      : this.formatValue(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.campoData) {
      this.atualizarDataDigitada(target);
      return;
    }
    this.value = this.formatValue(target.value);
    target.value = this.value;
    this.onChange(this.value);
  }

  abrirCalendario(campo: HTMLInputElement): void {
    campo.showPicker();
  }

  selecionarData(iso: string): void {
    this.writeValue(iso);
    this.onChange(iso);
    this.onTouched();
  }

  private atualizarDataDigitada(campo: HTMLInputElement): void {
    const texto = campo.value;
    const dataIsoColada = formatarDataBr(texto);
    this.value = dataIsoColada || aplicarMascaraDataBr(texto);
    if (texto !== this.value) {
      const digitosAntesDoCursor = texto.slice(0, campo.selectionStart ?? texto.length).replace(/\D/g, '').length;
      campo.value = this.value;
      const posicao = dataIsoColada
        ? this.value.length
        : aplicarMascaraDataBr(this.value.replace(/\D/g, '').slice(0, digitosAntesDoCursor)).length;
      campo.setSelectionRange(posicao, posicao);
    }
    this.onChange(this.dataIso || this.value);
  }

  private formatValue(value: string): string {
    if (this.mask === 'crn') {
      return formatCrnDisplay(value);
    }

    if (this.mask === 'cpf') {
      return formatCpfDisplay(value);
    }

    if (this.mask === 'telefone') {
      const d = value.replace(/\D/g, '').slice(0, 11);
      if (d.length === 0) return '';
      if (d.length <= 2) return `(${d}`;
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }

    if (this.mask === 'data') {
      return aplicarMascaraDataBr(value);
    }

    return value;
  }

  onBlur(): void {
    this.onTouched();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}
