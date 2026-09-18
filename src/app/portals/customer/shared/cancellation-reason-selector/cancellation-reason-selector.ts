import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CANCELLATION_REASONS, CancellationReason, cancellationReasonLabel } from '../../data/order-data';
import type { OrderType } from '../order-type-selector/order-type-selector';

let nextId = 0;

@Component({
  selector: 'app-cancellation-reason-selector',
  imports: [ReactiveFormsModule],
  templateUrl: './cancellation-reason-selector.html',
  styleUrl: './cancellation-reason-selector.css'
})
export class CancellationReasonSelector {
  readonly control = input.required<FormControl<CancellationReason | null>>();
  readonly type = input.required<OrderType>();
  readonly invalid = input(false);

  protected readonly groupName = `cancellation-reason-${nextId++}`;
  protected readonly errorId = `${this.groupName}-error`;

  protected readonly options = computed(() =>
    CANCELLATION_REASONS.map((value) => ({ value, label: cancellationReasonLabel(value, this.type()) }))
  );
}
