import { Component, input, output } from '@angular/core';
import type { OrderStatusGroup } from '../../data/order-data';

export type OrderFilterValue = 'all' | OrderStatusGroup;

export type OrderFilterCounts = Record<OrderFilterValue, number>;

@Component({
  selector: 'app-order-filter',
  imports: [],
  templateUrl: './order-filter.html',
  styleUrl: './order-filter.css'
})
export class OrderFilter {
  readonly selected = input.required<OrderFilterValue>();
  readonly counts = input.required<OrderFilterCounts>();

  readonly selectedChange = output<OrderFilterValue>();

  protected readonly options: { value: OrderFilterValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  protected select(value: OrderFilterValue): void {
    this.selectedChange.emit(value);
  }
}
