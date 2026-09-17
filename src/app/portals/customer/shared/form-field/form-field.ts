import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  templateUrl: './form-field.html',
  styleUrl: './form-field.css'
})
export class FormField {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'tel' | 'email'>('text');
  readonly placeholder = input<string>('');
  readonly required = input<boolean>(true);
  readonly errorMessages = input<Record<string, string>>({});
  readonly id = input<string>();

  protected readonly fieldId = computed(() => this.id() ?? this.label().toLowerCase().replace(/\s+/g, '-'));

  protected hasError(): boolean {
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  }

  protected errorMessage(): string {
    const errors = this.control().errors;
    if (!errors) {
      return '';
    }
    const key = Object.keys(errors)[0];
    return this.errorMessages()[key] ?? 'This field is invalid.';
  }
}
