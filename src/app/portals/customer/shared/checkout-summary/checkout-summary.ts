import { Component, input, output } from '@angular/core';
import { CartLine } from '../../services/cart';

@Component({
  selector: 'app-checkout-summary',
  imports: [],
  templateUrl: './checkout-summary.html',
  styleUrl: './checkout-summary.css'
})
export class CheckoutSummary {
  readonly lines = input.required<CartLine[]>();
  readonly subtotal = input.required<number>();
  readonly tax = input.required<number>();
  readonly delivery = input.required<number>();
  readonly total = input.required<number>();
  readonly submitDisabled = input<boolean>(false);
  readonly submitLabel = input<string>('Place Order');

  readonly placeOrder = output<void>();

  protected onPlaceOrder(): void {
    this.placeOrder.emit();
  }
}
