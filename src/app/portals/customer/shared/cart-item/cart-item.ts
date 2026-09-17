import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuantitySelector } from '../quantity-selector/quantity-selector';

@Component({
  selector: 'app-cart-item',
  imports: [RouterLink, QuantitySelector],
  templateUrl: './cart-item.html',
  styleUrl: './cart-item.css'
})
export class CartItem {
  readonly slug = input.required<string>();
  readonly name = input.required<string>();
  readonly price = input.required<number>();
  readonly quantity = input.required<number>();

  readonly increment = output<void>();
  readonly decrement = output<void>();
  readonly remove = output<void>();

  protected readonly lineTotal = computed(() => this.price() * this.quantity());

  protected onIncrement(): void {
    this.increment.emit();
  }

  protected onDecrement(): void {
    this.decrement.emit();
  }

  protected onRemove(): void {
    this.remove.emit();
  }
}
