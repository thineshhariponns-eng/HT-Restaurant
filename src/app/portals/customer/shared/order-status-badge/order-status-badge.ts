import { Component, computed, input } from '@angular/core';
import { STATUS_COPY, TrackedStatus } from '../../data/order-data';
import type { OrderType } from '../order-type-selector/order-type-selector';

const SUCCESS_STATUSES: TrackedStatus[] = ['completed'];
const TERMINAL_STATUSES: TrackedStatus[] = ['rejected', 'cancelled'];

@Component({
  selector: 'app-order-status-badge',
  imports: [],
  templateUrl: './order-status-badge.html',
  styleUrl: './order-status-badge.css'
})
export class OrderStatusBadge {
  readonly type = input.required<OrderType>();
  readonly status = input.required<TrackedStatus>();

  protected readonly label = computed(() => STATUS_COPY[this.type()][this.status()].label);

  protected readonly dotClasses = computed(() => {
    if (SUCCESS_STATUSES.includes(this.status())) return 'bg-status-delivered';
    if (TERMINAL_STATUSES.includes(this.status())) return 'bg-status-cancelled';
    return 'bg-primary-600';
  });
}
