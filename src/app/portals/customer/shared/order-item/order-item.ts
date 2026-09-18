import { Component, computed, input } from '@angular/core';
import type { CartLine } from '../../services/cart';

@Component({
  selector: 'app-order-item',
  imports: [],
  templateUrl: './order-item.html',
  styleUrl: './order-item.css'
})
export class OrderItem {
  readonly line = input.required<CartLine>();

  protected readonly lineTotal = computed(() => this.line().price * this.line().quantity);
}
