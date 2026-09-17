import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-textarea',
  imports: [ReactiveFormsModule],
  templateUrl: './form-textarea.html',
  styleUrl: './form-textarea.css'
})
export class FormTextarea {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly placeholder = input<string>('');
  readonly required = input<boolean>(false);
  readonly rows = input<number>(4);
  readonly maxLength = input<number>();
  readonly errorMessages = input<Record<string, string>>({});
  readonly id = input<string>();

  protected readonly fieldId = computed(() => this.id() ?? this.label().toLowerCase().replace(/\s+/g, '-'));

  protected charCount(): number {
    return (this.control().value ?? '').length;
  }

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
