import { Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';

export type OrderType = 'delivery' | 'pickup';

@Component({
  selector: 'app-order-type-selector',
  imports: [],
  templateUrl: './order-type-selector.html',
  styleUrl: './order-type-selector.css'
})
export class OrderTypeSelector {
  readonly control = input.required<FormControl<OrderType>>();

  protected select(value: OrderType): void {
    this.control().setValue(value);
    this.control().markAsTouched();
  }

  protected isSelected(value: OrderType): boolean {
    return this.control().value === value;
  }
}
