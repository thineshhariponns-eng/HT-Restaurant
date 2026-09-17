import { Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, Validators } from '@angular/forms';
import { CancellationReason, TrackedOrder } from '../../data/order-data';
import { CancellationReasonSelector } from '../cancellation-reason-selector/cancellation-reason-selector';
import { FormTextarea } from '../form-textarea/form-textarea';

export interface CancelOrderRequest {
  reason: CancellationReason;
  note: string;
}

const NOTE_MAX_LENGTH = 200;

let nextId = 0;

/** Confirmation step for a customer cancelling an order. Emits the choice; it never cancels anything itself. */
@Component({
  selector: 'app-cancel-order-dialog',
  imports: [CancellationReasonSelector, FormTextarea],
  templateUrl: './cancel-order-dialog.html',
  styleUrl: './cancel-order-dialog.css'
})
export class CancelOrderDialog {
  readonly order = input.required<TrackedOrder>();
  readonly confirmed = output<CancelOrderRequest>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly titleId = `cancel-order-title-${nextId}`;
  protected readonly descriptionId = `cancel-order-description-${nextId}`;
  protected readonly noteId = `cancel-order-note-${nextId++}`;
  protected readonly noteMaxLength = NOTE_MAX_LENGTH;

  protected readonly reason = new FormControl<CancellationReason | null>(null, Validators.required);
  protected readonly note = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(NOTE_MAX_LENGTH)] });

  protected readonly submitted = signal(false);
  protected readonly noteRequired = signal(false);
  protected readonly noteErrors = {
    required: 'Add a short note so the restaurant knows why.',
    maxlength: `Keep the note under ${NOTE_MAX_LENGTH} characters.`
  };

  protected readonly itemCount = computed(() => this.order().lines.reduce((count, line) => count + line.quantity, 0));

  /** A drag that starts inside the sheet and ends on the backdrop must not close it. */
  private pressStartedOnBackdrop = false;

  constructor() {
    this.reason.valueChanges.pipe(takeUntilDestroyed()).subscribe((reason) => {
      const required = reason === 'other';
      this.note.setValidators(
        required ? [Validators.required, Validators.maxLength(NOTE_MAX_LENGTH)] : [Validators.maxLength(NOTE_MAX_LENGTH)]
      );
      this.note.updateValueAndValidity();
      this.noteRequired.set(required);
    });
  }

  open(): void {
    this.reason.reset(null);
    this.note.reset('');
    this.submitted.set(false);
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected onPointerDown(event: PointerEvent): void {
    this.pressStartedOnBackdrop = event.target === this.dialog().nativeElement;
  }

  protected onClick(event: MouseEvent): void {
    if (this.pressStartedOnBackdrop && event.target === this.dialog().nativeElement) {
      this.close();
    }
    this.pressStartedOnBackdrop = false;
  }

  protected reasonInvalid(): boolean {
    return this.submitted() && this.reason.invalid;
  }

  protected confirm(): void {
    this.submitted.set(true);
    this.reason.markAsTouched();
    this.note.markAsTouched();

    if (this.reason.invalid || this.note.invalid) {
      const target = this.reason.invalid ? 'input[type="radio"]' : 'textarea';
      this.dialog().nativeElement.querySelector<HTMLElement>(target)?.focus();
      return;
    }

    this.close();
    this.confirmed.emit({ reason: this.reason.value!, note: this.note.value });
  }
}
