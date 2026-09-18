import { TestBed } from '@angular/core/testing';
import { OrdersStore } from './orders-store';
import { advanceLabel, nextStatus, stopAction } from '../order-lifecycle';

describe('order lifecycle', () => {
  it('ends pickup orders at Picked up and delivery orders at Delivered', () => {
    expect(nextStatus({ type: 'pickup', status: 'ready' })).toBe('picked-up');
    expect(nextStatus({ type: 'delivery', status: 'ready' })).toBe('out-for-delivery');
    expect(nextStatus({ type: 'delivery', status: 'delivered' })).toBeNull();
  });

  it('names the next step for the queue buttons', () => {
    expect(advanceLabel({ type: 'delivery', status: 'pending' })).toBe('Accept');
    expect(advanceLabel({ type: 'pickup', status: 'ready' })).toBe('Mark picked up');
  });

  it('rejects new orders, cancels accepted ones, and stops neither once out', () => {
    expect(stopAction('pending')).toBe('reject');
    expect(stopAction('preparing')).toBe('cancel');
    expect(stopAction('out-for-delivery')).toBeNull();
  });
});

describe('OrdersStore', () => {
  let store: OrdersStore;
  const firstPending = () => store.orders().find((o) => o.status === 'pending')!;

  beforeEach(() => {
    store = TestBed.inject(OrdersStore);
  });

  it('accepting a new order confirms it and records the change', () => {
    const order = firstPending();
    store.advance(order.number);

    const updated = store.get(order.number)!;
    expect(updated.status).toBe('confirmed');
    expect(updated.history.at(-1)?.status).toBe('confirmed');
  });

  it('undo restores the order exactly as it was', () => {
    const order = firstPending();
    const previous = store.advance(order.number)!;
    store.restore(previous);

    expect(store.get(order.number)).toEqual(order);
  });

  it('rejecting keeps the reason in the history', () => {
    const order = firstPending();
    store.stop(order.number, 'Kitchen at capacity');

    const updated = store.get(order.number)!;
    expect(updated.status).toBe('rejected');
    expect(updated.history.at(-1)?.note).toBe('Kitchen at capacity');
  });
});
