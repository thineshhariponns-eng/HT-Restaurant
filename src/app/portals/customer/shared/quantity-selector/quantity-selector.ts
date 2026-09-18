import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-quantity-selector',
  imports: [],
  templateUrl: './quantity-selector.html',
  styleUrl: './quantity-selector.css'
})
export class QuantitySelector {
  readonly quantity = input.required<number>();
  readonly min = input<number>(1);
  readonly disabled = input<boolean>(false);

  readonly decrement = output<void>();
  readonly increment = output<void>();

  protected readonly decrementDisabled = computed(() => this.disabled() || this.quantity() <= this.min());

  protected onDecrement(): void {
    this.decrement.emit();
  }

  protected onIncrement(): void {
    this.increment.emit();
  }
}
