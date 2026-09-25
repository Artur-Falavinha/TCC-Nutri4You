import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface UiSelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-ui-select',
  imports: [],
  templateUrl: './ui-select.component.html',
  styleUrl: './ui-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true
    }
  ]
})
export class UiSelectComponent implements ControlValueAccessor {
  @Input({ required: true }) label = '';
  @Input() placeholder = 'Selecione';
  @Input() options: UiSelectOption[] = [];
  @Input() selectId = '';
  @Input() errorMessage = '';
  @Input() required = false;

  value = '';
  disabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  get id(): string {
    return this.selectId || this.label.toLowerCase().replace(/\s+/g, '-');
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
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

  onSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
