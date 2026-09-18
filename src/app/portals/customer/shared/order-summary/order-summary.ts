import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-order-summary',
  imports: [],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.css'
})
export class OrderSummary {
  readonly subtotal = input.required<number>();
  readonly tax = input.required<number>();
  readonly delivery = input<number | null>(null);
  readonly total = input.required<number>();
  readonly showCheckout = input(true);
  /** Cancelled orders owe nothing, so their total drops out of the signal color. */
  readonly totalMuted = input(false);

  readonly checkout = output<void>();

  protected onCheckout(): void {
    this.checkout.emit();
  }
}
