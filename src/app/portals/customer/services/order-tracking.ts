import { Injectable, computed, inject, signal } from '@angular/core';
import { Cancellation, CancellationReason, MOCK_ORDERS, TrackedOrder } from '../data/order-data';
import { OrderService } from './order';

/** Wraps OrderService's single last-order with the mock order list, for the tracking pages only. */
@Injectable({ providedIn: 'root' })
export class OrderTrackingService {
  private readonly orderService = inject(OrderService);

  /**
   * Customer cancellations made in this session. Local demo state only — there is no cancellation
   * API, so nothing is sent anywhere and a reload restores the mock orders.
   */
  private readonly cancellations = signal<ReadonlyMap<string, Cancellation>>(new Map());

  private readonly lastOrderAsTracked = computed<TrackedOrder | null>(() => {
    const order = this.orderService.lastOrder();
    if (!order) return null;
    return {
      ...order,
      cancellable: true,
      history: [{ status: order.status, at: order.placedAt }]
    };
  });

  list(): TrackedOrder[] {
    const lastOrder = this.lastOrderAsTracked();
    const orders = lastOrder
      ? [lastOrder, ...MOCK_ORDERS.filter((order) => order.orderNumber !== lastOrder.orderNumber)]
      : MOCK_ORDERS;
    return orders.map((order) => this.applyLocalState(order)).sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  }

  getByNumber(orderNumber: string): TrackedOrder | undefined {
    const lastOrder = this.lastOrderAsTracked();
    const order =
      lastOrder?.orderNumber === orderNumber ? lastOrder : MOCK_ORDERS.find((candidate) => candidate.orderNumber === orderNumber);
    return order ? this.applyLocalState(order) : undefined;
  }

  cancel(orderNumber: string, reason: CancellationReason, note: string): void {
    const order = this.getByNumber(orderNumber);
    if (!order?.cancellable || order.status === 'cancelled') return;

    const next = new Map(this.cancellations());
    next.set(orderNumber, { reason, note: note.trim(), at: new Date().toISOString() });
    this.cancellations.set(next);
  }

  private applyLocalState(order: TrackedOrder): TrackedOrder {
    const cancellation = this.cancellations().get(order.orderNumber);
    if (!cancellation) return order;
    return {
      ...order,
      status: 'cancelled',
      cancellable: false,
      cancellation,
      history: [...order.history, { status: 'cancelled', at: cancellation.at }]
    };
  }
}
