import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { formatCpfDisplay } from '../../utils/cpf-mask.util';
import { formatCrnDisplay } from '../../utils/crn-mask.util';

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
  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() inputId = '';
  @Input() autocomplete = '';
  @Input() errorMessage = '';
  @Input() required = false;
  @Input() mask?: 'crn' | 'cpf';

  value = '';
  disabled = false;
  passwordVisible = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  get id(): string {
    return this.inputId || this.label.toLowerCase().replace(/\s+/g, '-');
  }

  get isPasswordField(): boolean {
    return this.type === 'password';
  }

  get resolvedInputType(): 'text' | 'email' | 'password' {
    if (this.isPasswordField && this.passwordVisible) {
      return 'text';
    }

    return this.type;
  }

  writeValue(value: string | null): void {
    this.value = this.formatValue(value ?? '');
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
    this.value = this.formatValue(target.value);
    target.value = this.value;
    this.onChange(this.value);
  }

  private formatValue(value: string): string {
    if (this.mask === 'crn') {
      return formatCrnDisplay(value);
    }

    if (this.mask === 'cpf') {
      return formatCpfDisplay(value);
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
