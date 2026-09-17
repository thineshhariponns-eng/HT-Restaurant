import { Injectable, computed, signal } from '@angular/core';
import { MOCK_ORDERS } from '../data/mock-orders';
import type { Order, OrderStatus } from '../models/order';
import { isActive, nextStatus, stopAction } from '../order-lifecycle';

/**
 * In-memory order queue seeded with tonight's sample service.
 * Status changes are local UI state only: nothing is sent anywhere and a reload restores the seed.
 */
@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly ordersSignal = signal<Order[]>(structuredClone(MOCK_ORDERS));
  readonly orders = this.ordersSignal.asReadonly();

  readonly pendingCount = computed(() => this.orders().filter((o) => o.status === 'pending').length);
  readonly activeCount = computed(() => this.orders().filter((o) => isActive(o.status)).length);

  get(number: string): Order | undefined {
    return this.orders().find((o) => o.number === number);
  }

  /** Moves an order one step along its lifecycle. Returns the previous state so the change can be undone. */
  advance(number: string): Order | null {
    const order = this.get(number);
    const next = order ? nextStatus(order) : null;
    if (!order || !next) return null;
    this.setStatus(number, next);
    return order;
  }

  /** Rejects a new order or cancels an accepted one, with the reason recorded in its history. */
  stop(number: string, reason: string): Order | null {
    const order = this.get(number);
    const action = order ? stopAction(order.status) : null;
    if (!order || !action) return null;
    this.setStatus(number, action === 'reject' ? 'rejected' : 'cancelled', reason);
    return order;
  }

  /** Puts back an order exactly as it was before the last change. */
  restore(previous: Order): void {
    this.ordersSignal.update((orders) => orders.map((o) => (o.number === previous.number ? previous : o)));
  }

  private setStatus(number: string, status: OrderStatus, note?: string): void {
    const at = new Date().toISOString();
    this.ordersSignal.update((orders) =>
      orders.map((o) =>
        o.number === number ? { ...o, status, history: [...o.history, { status, at, note }] } : o,
      ),
    );
  }
}
