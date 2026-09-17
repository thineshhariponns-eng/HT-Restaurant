import { Component, ElementRef, computed, input, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TrackedOrder, cancellationReasonLabel } from '../../data/order-data';
import { RESTAURANT_CONTACT } from '../../data/restaurant-info';

@Component({
  selector: 'app-cancelled-order-state',
  imports: [DatePipe, RouterLink],
  templateUrl: './cancelled-order-state.html',
  styleUrl: './cancelled-order-state.css'
})
export class CancelledOrderState {
  readonly order = input.required<TrackedOrder>();

  private readonly heading = viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  protected readonly contact = RESTAURANT_CONTACT;

  protected readonly reasonLabel = computed(() => {
    const cancellation = this.order().cancellation;
    return cancellation ? cancellationReasonLabel(cancellation.reason, this.order().type) : null;
  });

  /** Falls back to the history event for cancelled orders that carry no cancellation record. */
  protected readonly cancelledAt = computed(
    () => this.order().cancellation?.at ?? this.order().history.find((event) => event.status === 'cancelled')?.at ?? null
  );

  focusHeading(): void {
    this.heading().nativeElement.focus();
  }
}
